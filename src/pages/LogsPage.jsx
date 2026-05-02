import React, { useEffect, useMemo, useState } from 'react';
import { Alert, Button, Card, Input, InputNumber, Space, Switch, Table, Tag, Typography, message } from 'antd';
import { ReloadOutlined, PlayCircleOutlined, PauseCircleOutlined } from '@ant-design/icons';
import api from '../api';
import { formatApiError } from '../utils/formatApiError';

const { Text, Title } = Typography;

function levelColor(level) {
  const normalized = String(level || '').toUpperCase();
  if (normalized === 'ERROR') return 'error';
  if (normalized === 'WARNING' || normalized === 'WARN') return 'warning';
  if (normalized === 'DEBUG') return 'default';
  return 'processing';
}

const LogsPage = () => {
  const [lines, setLines] = useState(200);
  const [contains, setContains] = useState('');
  const [initialLines, setInitialLines] = useState(50);
  const [loading, setLoading] = useState(false);
  const [streaming, setStreaming] = useState(false);
  const [entries, setEntries] = useState([]);
  const [path, setPath] = useState('');
  const [eventSource, setEventSource] = useState(null);

  const fetchLogs = async () => {
    setLoading(true);
    try {
      const response = await api.get('/admin/logs', {
        params: {
          lines: Math.min(Math.max(Number(lines) || 200, 1), 2000),
          contains: contains.trim() || undefined,
        },
      });
      setEntries(Array.isArray(response.data?.entries) ? response.data.entries : []);
      setPath(response.data?.path || '');
    } catch (error) {
      message.error(formatApiError(error));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchLogs();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const stopStreaming = () => {
    if (eventSource) {
      eventSource.close();
      setEventSource(null);
    }
    setStreaming(false);
  };

  const startStreaming = () => {
    stopStreaming();
    const base = String(import.meta.env.VITE_API_BASE_URL || '/api').replace(/\/$/, '');
    const params = new URLSearchParams();
    params.set('initial_lines', String(Math.min(Math.max(Number(initialLines) || 50, 1), 500)));
    if (contains.trim()) params.set('contains', contains.trim());
    const es = new EventSource(`${base}/admin/logs/stream?${params.toString()}`);
    es.onmessage = (evt) => {
      try {
        const payload = JSON.parse(evt.data);
        const entry = payload?.entry;
        if (!entry) return;
        setEntries((prev) => [entry, ...prev].slice(0, 2000));
      } catch {
        // ignore parse issues from malformed events
      }
    };
    es.onerror = () => {
      message.error('Log stream disconnected');
      stopStreaming();
    };
    setEventSource(es);
    setStreaming(true);
  };

  useEffect(() => {
    return () => {
      if (eventSource) eventSource.close();
    };
  }, [eventSource]);

  const columns = useMemo(
    () => [
      {
        title: 'Timestamp',
        dataIndex: 'timestamp',
        key: 'timestamp',
        width: 210,
        render: (val) => <Text style={{ fontFamily: 'ui-monospace, monospace', fontSize: 12 }}>{val || '-'}</Text>,
      },
      {
        title: 'Level',
        dataIndex: 'level',
        key: 'level',
        width: 110,
        render: (val) => <Tag color={levelColor(val)}>{val || '-'}</Tag>,
      },
      {
        title: 'Logger',
        dataIndex: 'logger',
        key: 'logger',
        width: 260,
        render: (val) => <Text style={{ fontFamily: 'ui-monospace, monospace', fontSize: 12 }}>{val || '-'}</Text>,
      },
      {
        title: 'Message',
        dataIndex: 'message',
        key: 'message',
        render: (val) => <Text>{val || '-'}</Text>,
      },
    ],
    []
  );

  return (
    <div style={{ paddingBottom: 24 }}>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
        <div>
          <Title level={2} style={{ marginBottom: 0 }}>
            Logs
          </Title>
          <Text type="secondary">Admin logs viewer using `/admin/logs` and live SSE `/admin/logs/stream`.</Text>
        </div>

        <Card>
          <Space wrap size={12}>
            <Space size={6}>
              <Text type="secondary">Lines</Text>
              <InputNumber min={1} max={2000} value={lines} onChange={(v) => setLines(v)} />
            </Space>
            <Space size={6}>
              <Text type="secondary">SSE initial</Text>
              <InputNumber min={1} max={500} value={initialLines} onChange={(v) => setInitialLines(v)} />
            </Space>
            <Input
              value={contains}
              onChange={(e) => setContains(e.target.value)}
              placeholder="contains filter (optional)"
              style={{ width: 260 }}
            />
            <Button type="primary" icon={<ReloadOutlined />} onClick={fetchLogs} loading={loading}>
              Load
            </Button>
            <Button
              icon={streaming ? <PauseCircleOutlined /> : <PlayCircleOutlined />}
              onClick={streaming ? stopStreaming : startStreaming}
            >
              {streaming ? 'Stop stream' : 'Start stream'}
            </Button>
            <Space>
              <Text type="secondary">Streaming</Text>
              <Switch checked={streaming} onChange={(v) => (v ? startStreaming() : stopStreaming())} />
            </Space>
          </Space>
          {path ? (
            <Alert
              style={{ marginTop: 12 }}
              type="info"
              showIcon
              description={
                <div style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                  <Text strong>Source log file</Text>
                  <Text code>{path}</Text>
                </div>
              }
            />
          ) : null}
        </Card>

        <Card styles={{ body: { padding: 8 } }}>
          <Table
            columns={columns}
            dataSource={entries}
            rowKey={(record, idx) => `${record.timestamp || 't'}-${record.logger || 'l'}-${idx}`}
            loading={loading}
            pagination={{ pageSize: 50, showSizeChanger: true, pageSizeOptions: ['25', '50', '100'] }}
            scroll={{ x: 1200 }}
          />
        </Card>
      </div>
    </div>
  );
};

export default LogsPage;
