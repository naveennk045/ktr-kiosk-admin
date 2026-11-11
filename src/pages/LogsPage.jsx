import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  Badge, Button, Card, Empty, Input, Segmented, Select, Space, Switch, Table, Tag, Tooltip, Typography, message,
} from 'antd';
import {
  ReloadOutlined, SearchOutlined, CopyOutlined, ShoppingOutlined, ApiOutlined, CloseCircleOutlined,
} from '@ant-design/icons';
import { JsonView, defaultStyles } from 'react-json-view-lite';
import 'react-json-view-lite/dist/index.css';
import api, { API_BASE_URL } from '../api';
import { getToken } from '../authSession';
import { formatApiError } from '../utils/formatApiError';
import {
  detailFields, formatDuration, formatTime, groupByRequest, levelRank, parseTime, shortId, summarize, withIds,
} from '../utils/logGroups';
import './LogsPage.css';
import { brand } from '../theme';

const { Text, Title } = Typography;

const ENV_OPTIONS = [
  { label: 'Default (Env)', value: '' },
  { label: 'Production', value: 'https://api-kiosk.ktr.net.in' },
  { label: 'Pre-Production', value: 'https://ktr-kiosk-9pcyp.ondigitalocean.app' },
];

const LEVEL_OPTIONS = [
  { label: 'All', value: '' },
  { label: 'Info+', value: 'INFO' },
  { label: 'Warnings+', value: 'WARNING' },
  { label: 'Errors', value: 'ERROR' },
];

const EVENT_OPTIONS = [
  { label: 'All events', value: '' },
  { label: 'API requests', value: 'http.' },
  { label: 'Orders', value: 'order.' },
  { label: 'Payments', value: 'payment.' },
  { label: 'Petpooja sync', value: 'petpooja.' },
  { label: 'Kitchen (KDS)', value: 'kds.' },
];

const LIMIT_OPTIONS = [300, 1000, 3000].map((n) => ({ label: `${n} lines`, value: n }));
const MAX_KEPT = 5000;

function levelTag(level) {
  const l = String(level || '').toUpperCase();
  const color = { ERROR: 'red', CRITICAL: 'red', WARNING: 'orange', WARN: 'orange', DEBUG: 'default' }[l] || 'default';
  return <Tag color={color} className="lg-level">{l || '—'}</Tag>;
}

function statusTag(status) {
  if (!status) return <Tag className="lg-status">—</Tag>;
  const color = status >= 500 ? 'red' : status >= 400 ? 'orange' : status >= 300 ? 'gold' : 'green';
  return <Tag color={color} className="lg-status">{status}</Tag>;
}

function methodTag(method) {
  const color = { GET: 'default', POST: 'gold', PATCH: 'lime', PUT: 'lime', DELETE: 'red' }[method] || 'default';
  return <Tag color={color} className="lg-method">{method}</Tag>;
}

function TimeCell({ ts }) {
  const { time, date } = formatTime(ts);
  return (
    <div className="lg-time">
      <span>{time}</span>
      {date && <small>{date}</small>}
    </div>
  );
}

function copy(text) {
  navigator.clipboard?.writeText(text).then(() => message.success('Copied'));
}

/** Full detail for one log entry: message, structured fields, error and stack trace. */
function EntryDetail({ entry }) {
  const fields = detailFields(entry);
  return (
    <div className="lg-detail">
      {entry.error_type && (
        <div className="lg-error">
          <CloseCircleOutlined /> <b>{entry.error_type}</b>: {entry.error_message}
          {entry.source && <Text type="secondary" className="lg-src"> at {entry.source}</Text>}
        </div>
      )}
      {Object.keys(fields).length > 0 && (
        <div className="lg-json">
          <JsonView data={fields} shouldExpandNode={(level) => level < 2} style={defaultStyles} />
        </div>
      )}
      {entry.stack_trace && <pre className="lg-stack">{entry.stack_trace}</pre>}
    </div>
  );
}

/** Every log line inside one request, as a timeline with offsets from the first line. */
function RequestTimeline({ group, onOrder }) {
  const [open, setOpen] = useState(() => new Set(group.entries.filter((e) => levelRank(e.level) >= 40).map((e) => e._id)));
  const toggle = (id) => setOpen((s) => {
    const n = new Set(s);
    if (n.has(id)) n.delete(id); else n.add(id);
    return n;
  });
  return (
    <div className="lg-timeline">
      <div className="lg-tl-head">
        {group.requestId && (
          <Button size="small" icon={<CopyOutlined />} onClick={() => copy(group.requestId)}>
            Request {shortId(group.requestId)}
          </Button>
        )}
        {group.orderIds.map((o) => (
          <Button key={o} size="small" icon={<ShoppingOutlined />} onClick={() => onOrder(o)}>
            Full journey of {o}
          </Button>
        ))}
        {group.http?.client_ip && <Text type="secondary">from {group.http.client_ip}</Text>}
      </div>
      {group.entries.map((e) => {
        const t = parseTime(e.timestamp);
        const offset = t !== null && group.start !== null ? t - group.start : null;
        const rank = levelRank(e.level);
        const hasDetail = Object.keys(detailFields(e)).length > 0 || e.stack_trace || e.error_type;
        return (
          <div key={e._id} className={`lg-tl-row ${rank >= 40 ? 'is-error' : rank === 30 ? 'is-warn' : ''}`}>
            <button type="button" className="lg-tl-line" onClick={() => hasDetail && toggle(e._id)} disabled={!hasDetail}>
              <span className="lg-dot" />
              <span className="lg-offset">{offset === null ? '' : `+${offset} ms`}</span>
              {levelTag(e.level)}
              {e.event && <Tag className="lg-event">{e.event}</Tag>}
              <span className="lg-msg">{e.message}</span>
              <span className="lg-logger">{e.logger}</span>
            </button>
            {open.has(e._id) && <EntryDetail entry={e} />}
          </div>
        );
      })}
    </div>
  );
}

const LogsPage = () => {
  const [selectedEnv, setSelectedEnv] = useState('');
  const [view, setView] = useState('requests');
  const [limit, setLimit] = useState(300);
  const [level, setLevel] = useState('');
  const [event, setEvent] = useState('');
  const [search, setSearch] = useState('');
  const [orderId, setOrderId] = useState('');
  const [orderDraft, setOrderDraft] = useState('');
  const [requestId, setRequestId] = useState('');
  const [entries, setEntries] = useState([]);
  const [meta, setMeta] = useState(null);
  const [loading, setLoading] = useState(false);
  const [live, setLive] = useState(false);
  const esRef = useRef(null);

  const params = useMemo(() => ({
    lines: limit,
    level: level || undefined,
    event: event || undefined,
    contains: search.trim() || undefined,
    order_id: orderId.trim() || undefined,
    request_id: requestId.trim() || undefined,
  }), [limit, level, event, search, orderId, requestId]);

  const load = useCallback(async (p = params) => {
    setLoading(true);
    try {
      const res = await api.get('/admin/logs', { params: p, ...(selectedEnv ? { baseURL: selectedEnv } : {}) });
      setEntries(withIds(Array.isArray(res.data?.entries) ? res.data.entries : []));
      setMeta(res.data);
    } catch (error) {
      setEntries([]);
      setMeta(null);
      message.error(formatApiError(error));
    } finally {
      setLoading(false);
    }
  }, [params, selectedEnv]);

  const stopLive = useCallback(() => {
    esRef.current?.close();
    esRef.current = null;
    setLive(false);
  }, []);

  const startLive = useCallback(() => {
    esRef.current?.close();
    const base = (selectedEnv || API_BASE_URL).replace(/\/$/, '');
    const q = new URLSearchParams({ initial_lines: '0' });
    for (const [k, v] of Object.entries(params)) if (v !== undefined && k !== 'lines') q.set(k, String(v));
    // EventSource cannot send headers, so this one URL carries the session token as a query parameter.
    // Only for our own API: the token is never sent to another environment.
    const token = selectedEnv ? null : getToken();
    if (token) q.set('access_token', token);
    const es = new EventSource(`${base}/admin/logs/stream?${q}`);
    es.onmessage = (evt) => {
      try {
        const payload = JSON.parse(evt.data);
        if (payload?.type === 'log' && payload.entry) {
          setEntries((prev) => [...prev, ...withIds([payload.entry])].slice(-MAX_KEPT));
        }
      } catch {
        // ignore malformed events
      }
    };
    es.onerror = () => {
      message.error('Live log stream disconnected');
      es.close();
      esRef.current = null;
      setLive(false);
    };
    esRef.current = es;
    setLive(true);
  }, [params, selectedEnv]);

  // Reload whenever a server-side filter changes; a running live stream restarts with the new filters.
  useEffect(() => {
    load();
    if (esRef.current) startLive();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedEnv, limit, level, event, orderId, requestId]);

  useEffect(() => () => esRef.current?.close(), []);

  const groups = useMemo(() => groupByRequest(entries), [entries]);
  const stats = useMemo(() => summarize(entries, groups), [entries, groups]);
  const newestFirst = useMemo(() => [...entries].reverse(), [entries]);

  const focusOrder = (id) => {
    setRequestId('');
    setOrderDraft(id);
    setOrderId(id);
    setView('requests');
  };
  const focusRequest = (id) => {
    setOrderDraft('');
    setOrderId('');
    setRequestId(id);
  };
  const clearFocus = () => {
    setOrderDraft('');
    setOrderId('');
    setRequestId('');
  };

  const requestColumns = [
    { title: 'Time', key: 'time', width: 120, render: (_, g) => <TimeCell ts={g.startTs} /> },
    {
      title: 'Request',
      key: 'req',
      render: (_, g) => (
        <div className="lg-req">
          {g.http ? (
            <>
              {methodTag(g.method)}
              <span className="lg-path">{g.path}</span>
            </>
          ) : (
            <>
              <Tooltip title={g.requestId ? 'Part of a request whose summary line is outside these filters' : 'Startup or background job, outside any request'}>
                <Tag className="lg-method">{g.requestId ? 'IN REQUEST' : 'BACKGROUND'}</Tag>
              </Tooltip>
              <span className="lg-bg">{g.title}</span>
            </>
          )}
          {g.events.length > 0 && (
            <div className="lg-events">
              {g.events.slice(0, 4).map((ev) => <Tag key={ev} className="lg-event">{ev}</Tag>)}
            </div>
          )}
        </div>
      ),
    },
    { title: 'Status', key: 'status', width: 90, render: (_, g) => (g.http ? statusTag(g.status) : levelTag(g.entries[0].level)) },
    {
      title: 'Duration',
      key: 'dur',
      width: 100,
      render: (_, g) => (g.http ? <span className={(g.duration || 0) >= 2000 ? 'lg-slow' : ''}>{formatDuration(g.duration)}</span> : '—'),
    },
    {
      title: 'Order',
      key: 'order',
      width: 170,
      render: (_, g) => (g.orderIds.length ? g.orderIds.map((o) => (
        <Button key={o} type="link" size="small" className="lg-link" onClick={(e) => { e.stopPropagation(); focusOrder(o); }}>{o}</Button>
      )) : <Text type="secondary">—</Text>),
    },
    { title: 'Store', key: 'store', width: 70, render: (_, g) => g.storeId || <Text type="secondary">—</Text> },
    {
      title: 'Lines',
      key: 'lines',
      width: 90,
      render: (_, g) => (
        <Space size={4}>
          <span>{g.entries.length}</span>
          {g.errorCount > 0 && <Badge count={g.errorCount} color={brand.maroon} />}
          {g.warnCount > 0 && <Badge count={g.warnCount} color={brand.yellow} />}
        </Space>
      ),
    },
  ];

  const lineColumns = [
    { title: 'Time', key: 'time', width: 120, render: (_, e) => <TimeCell ts={e.timestamp} /> },
    { title: 'Level', key: 'level', width: 100, render: (_, e) => levelTag(e.level) },
    {
      title: 'Message',
      key: 'msg',
      render: (_, e) => (
        <div className="lg-line-msg">
          {e.event && <Tag className="lg-event">{e.event}</Tag>}
          <span>{e.message}</span>
          <small className="lg-logger">{e.logger}</small>
        </div>
      ),
    },
    {
      title: 'Context',
      key: 'ctx',
      width: 260,
      render: (_, e) => (
        <Space size={4} wrap>
          {e.request_id && e.request_id !== '-' && (
            <Tooltip title="Show this request only">
              <Tag className="lg-chip" icon={<ApiOutlined />} onClick={() => focusRequest(e.request_id)}>{shortId(e.request_id)}</Tag>
            </Tooltip>
          )}
          {e.order_id && (
            <Tooltip title="Show this order's full journey">
              <Tag className="lg-chip" icon={<ShoppingOutlined />} onClick={() => focusOrder(e.order_id)}>{e.order_id}</Tag>
            </Tooltip>
          )}
          {e.store_id && <Tag className="lg-chip">store {e.store_id}</Tag>}
        </Space>
      ),
    },
  ];

  const statCards = [
    { key: 'requests', label: 'API requests', value: stats.requests },
    { key: 'errors', label: 'Errors', value: stats.errors, tone: stats.errors ? 'bad' : '', onClick: () => setLevel('ERROR') },
    { key: 'warnings', label: 'Warnings', value: stats.warnings, tone: stats.warnings ? 'warn' : '', onClick: () => setLevel('WARNING') },
    { key: 'failed', label: '5xx responses', value: stats.failed, tone: stats.failed ? 'bad' : '' },
    { key: 'slow', label: 'Slow (≥ 2 s)', value: stats.slow, tone: stats.slow ? 'warn' : '' },
    { key: 'lines', label: 'Log lines', value: stats.lines },
  ];

  return (
    <div className="lg-page">
      <div className="lg-header">
        <div>
          <Title level={2} style={{ marginBottom: 0 }}>Logs</Title>
          <Text type="secondary">Every API call, order, payment and kitchen step, grouped so you can follow what happened.</Text>
        </div>
        <Space>
          <Text type="secondary">Environment</Text>
          <Select options={ENV_OPTIONS} value={selectedEnv} onChange={setSelectedEnv} style={{ width: 190 }} />
        </Space>
      </div>

      <Card className="lg-toolbar">
        <div className="lg-filters">
          <Segmented
            value={view}
            onChange={setView}
            options={[{ label: 'Grouped by request', value: 'requests' }, { label: 'All lines', value: 'lines' }]}
          />
          <Input
            allowClear
            prefix={<SearchOutlined />}
            placeholder="Search text, path, error…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            onPressEnter={() => load()}
            style={{ width: 260 }}
          />
          <Input
            allowClear
            prefix={<ShoppingOutlined />}
            placeholder="Order ID (KTR-…)"
            value={orderDraft}
            onChange={(e) => {
              setOrderDraft(e.target.value);
              if (!e.target.value) setOrderId('');
            }}
            onPressEnter={() => setOrderId(orderDraft.trim())}
            onBlur={() => setOrderId(orderDraft.trim())}
            style={{ width: 190 }}
          />
          <Segmented value={level} onChange={setLevel} options={LEVEL_OPTIONS} />
          <Select value={event} onChange={setEvent} options={EVENT_OPTIONS} style={{ width: 150 }} />
          <Select value={limit} onChange={setLimit} options={LIMIT_OPTIONS} style={{ width: 120 }} />
          <Button type="primary" icon={<ReloadOutlined />} loading={loading} onClick={() => load()}>Refresh</Button>
          <span className={`lg-live ${live ? 'on' : ''}`}>
            <Switch checked={live} onChange={(v) => (v ? startLive() : stopLive())} />
            <span className="lg-live-dot" />
            {live ? 'Live' : 'Live off'}
          </span>
        </div>

        {(orderId.trim() || requestId.trim()) && (
          <div className="lg-focus">
            {orderId.trim() ? (
              <span><ShoppingOutlined /> Showing the full journey of order <b>{orderId.trim()}</b>: creation, payment, token, Petpooja and kitchen.</span>
            ) : (
              <span><ApiOutlined /> Showing request <b>{requestId.trim()}</b> only.</span>
            )}
            <Button size="small" onClick={clearFocus}>Show everything</Button>
          </div>
        )}

        {meta && (
          <Text type="secondary" className="lg-meta">
            {meta.count} entries from {meta.files?.join(', ') || 'app.log'} · scanned {meta.scanned_lines?.toLocaleString('en-IN')} lines
            {meta.complete === false ? ' (search limit reached; narrow the filters to look further back)' : ''}
          </Text>
        )}
      </Card>

      <div className="lg-stats">
        {statCards.map((s) => (
          <button
            key={s.key}
            type="button"
            className={`lg-stat ${s.tone || ''} ${s.onClick ? 'clickable' : ''}`}
            onClick={s.onClick}
            disabled={!s.onClick}
          >
            <span className="v">{s.value}</span>
            <span className="l">{s.label}</span>
          </button>
        ))}
      </div>

      <Card styles={{ body: { padding: 0 } }} className="lg-table-card">
        {view === 'requests' ? (
          <Table
            rowKey="key"
            size="middle"
            columns={requestColumns}
            dataSource={groups}
            loading={loading}
            locale={{ emptyText: <Empty description="No logs match these filters" /> }}
            pagination={{ pageSize: 50, showSizeChanger: true, pageSizeOptions: ['25', '50', '100'] }}
            rowClassName={(g) => (g.worst >= 40 || (g.status || 0) >= 500 ? 'lg-row-error' : g.worst === 30 ? 'lg-row-warn' : '')}
            expandable={{
              expandRowByClick: true,
              expandedRowRender: (g) => <RequestTimeline group={g} onOrder={focusOrder} />,
            }}
            scroll={{ x: 1000 }}
          />
        ) : (
          <Table
            rowKey="_id"
            size="small"
            columns={lineColumns}
            dataSource={newestFirst}
            loading={loading}
            locale={{ emptyText: <Empty description="No logs match these filters" /> }}
            pagination={{ pageSize: 100, showSizeChanger: true, pageSizeOptions: ['50', '100', '200'] }}
            rowClassName={(e) => (levelRank(e.level) >= 40 ? 'lg-row-error' : levelRank(e.level) === 30 ? 'lg-row-warn' : '')}
            expandable={{
              expandRowByClick: true,
              rowExpandable: (e) => Object.keys(detailFields(e)).length > 0 || Boolean(e.stack_trace),
              expandedRowRender: (e) => <EntryDetail entry={e} />,
            }}
            scroll={{ x: 1000 }}
          />
        )}
      </Card>
    </div>
  );
};

export default LogsPage;
