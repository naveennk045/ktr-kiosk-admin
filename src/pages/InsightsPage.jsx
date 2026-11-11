import React, { useEffect, useState } from 'react';
import PropTypes from 'prop-types';
import { Card, Row, Col, Typography, Spin, Space, Tag, Segmented, Empty, Progress, Tooltip, message } from 'antd';
import {
  BulbOutlined,
  StarFilled,
  RiseOutlined,
  FallOutlined,
  WarningOutlined,
  ClockCircleOutlined,
} from '@ant-design/icons';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip as ChartTooltip, ResponsiveContainer } from 'recharts';
import api from '../api';
import { useDashboardPeriod } from '../context/DashboardPeriodContext';
import { useStoreView } from '../context/StoreViewContext';
import { formatApiError } from '../utils/formatApiError';
import './InsightsPage.css';
import { brand } from '../theme';

const { Title, Text } = Typography;

const DAYPART_OPTIONS = [
  { label: 'All day', value: 'all' },
  { label: 'Breakfast', value: 'breakfast' },
  { label: 'Lunch', value: 'lunch' },
  { label: 'Evening', value: 'evening' },
];
const DAYPART_LABEL = { breakfast: 'Breakfast (before 11 AM)', lunch: 'Lunch (11 AM – 4 PM)', evening: 'Evening (after 4 PM)' };
// API weekday: 0 = Sunday … 6 = Saturday. Shown Monday first.
const WEEKDAY_SHORT = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
const WEEKDAY_ORDER = [1, 2, 3, 4, 5, 6, 0];

const SUGGESTION_STYLE = {
  star: { icon: <StarFilled />, color: brand.orangeInk, bg: 'rgba(255, 196, 31, 0.12)' },
  up: { icon: <RiseOutlined />, color: brand.ok, bg: 'rgba(47, 125, 50, 0.1)' },
  warn: { icon: <WarningOutlined />, color: brand.maroon, bg: 'rgba(125, 25, 25, 0.1)' },
  idea: { icon: <BulbOutlined />, color: brand.orange, bg: 'rgba(250, 119, 0, 0.1)' },
  clock: { icon: <ClockCircleOutlined />, color: brand.olive, bg: 'rgba(77, 94, 33, 0.1)' },
};

const num = (n) => Math.round(Number(n) || 0).toLocaleString('en-IN');
const money = (n) => `₹${num(n)}`;
const pct = (part, whole) => (whole ? Math.round((part / whole) * 100) : 0);
const hourLabel = (h) => {
  if (h === 0) return '12a';
  if (h === 12) return '12p';
  return h > 12 ? `${h - 12}p` : `${h}a`;
};
const clock = (seconds) => {
  if (seconds == null) return '–';
  const s = Math.round(seconds);
  return `${Math.floor(s / 60)}m ${String(s % 60).padStart(2, '0')}s`;
};
const shortDate = (iso) => {
  const [, m, d] = String(iso).split('-');
  return `${Number(d)}/${Number(m)}`;
};

/** Change vs the previous period. `invert` = lower is better (kitchen time). */
const Delta = ({ current, previous, invert = false }) => {
  if (previous == null || !previous) return <span className="ins-flat">no earlier data</span>;
  const d = Math.round(((current - previous) / previous) * 100);
  if (!d) return <span className="ins-flat">same as before</span>;
  const good = invert ? d < 0 : d > 0;
  return (
    <span className={good ? 'ins-up' : 'ins-down'} style={{ fontWeight: 700 }}>
      {d > 0 ? '▲' : '▼'} {Math.abs(d)}% <span className="ins-flat" style={{ fontWeight: 500 }}>vs previous</span>
    </span>
  );
};
Delta.propTypes = { current: PropTypes.number, previous: PropTypes.number, invert: PropTypes.bool };

const KpiCard = ({ label, value, children }) => (
  <Card className="premium-card" styles={{ body: { padding: 20 } }} style={{ height: '100%' }}>
    <div className="ins-kpi-label">{label}</div>
    <div className="ins-kpi-value">{value}</div>
    <div style={{ fontSize: 12 }}>{children}</div>
  </Card>
);
KpiCard.propTypes = { label: PropTypes.string.isRequired, value: PropTypes.node.isRequired, children: PropTypes.node };

const Section = ({ title, sub, children, span = 12 }) => (
  <Col xs={24} lg={span} style={{ minWidth: 0 }}>
    <Card
      className="premium-card"
      style={{ height: '100%' }}
      styles={{ body: { padding: '16px 22px 22px' } }}
      title={
        <span style={{ color: brand.ink, fontWeight: 700, fontSize: 16 }}>
          {title}
          {sub && <span className="ins-sub">{sub}</span>}
        </span>
      }
    >
      {children}
    </Card>
  </Col>
);
Section.propTypes = {
  title: PropTypes.string.isRequired,
  sub: PropTypes.string,
  children: PropTypes.node,
  span: PropTypes.number,
};

const Nothing = ({ text }) => <Empty image={Empty.PRESENTED_IMAGE_SIMPLE} description={text} />;
Nothing.propTypes = { text: PropTypes.string.isRequired };

/** rows: [{ key, label, value, valueText, sub, tip, muted }] */
const HBars = ({ rows }) => {
  const max = Math.max(1, ...rows.map((r) => r.value));
  return (
    <div className="ins-hb">
      {rows.map((r) => (
        <Tooltip key={r.key} title={r.tip} placement="topLeft">
          <div className="ins-hb-row">
            <span className="ins-hb-label">{r.label}</span>
            <span className="ins-hb-track">
              <i
                className={`ins-hb-fill${r.muted ? ' muted' : ''}`}
                style={{ width: `${Math.max(2, (r.value / max) * 100)}%` }}
              />
            </span>
            <span className="ins-hb-value">{r.valueText ?? r.value}</span>
            {r.sub && <span className="ins-hb-sub">{r.sub}</span>}
          </div>
        </Tooltip>
      ))}
    </div>
  );
};
HBars.propTypes = { rows: PropTypes.arrayOf(PropTypes.object).isRequired };

const SplitRow = ({ label, dine, take, fmt }) => {
  const total = dine + take || 1;
  return (
    <Tooltip title={`Dine-in ${fmt(dine)} · Takeaway ${fmt(take)}`}>
      <div className="ins-split-row">
        <span className="ins-split-label">{label}</span>
        <div className="ins-split-bar">
          <i className="ins-dine" style={{ width: `${(dine / total) * 100}%` }} />
          <i className="ins-take" style={{ width: `${(take / total) * 100}%` }} />
        </div>
        <span className="ins-split-value">
          {fmt(dine)}
          <span>/</span>
          {fmt(take)}
        </span>
      </div>
    </Tooltip>
  );
};
SplitRow.propTypes = {
  label: PropTypes.string.isRequired,
  dine: PropTypes.number.isRequired,
  take: PropTypes.number.isRequired,
  fmt: PropTypes.func.isRequired,
};

const Heatmap = ({ cells }) => {
  const byKey = {};
  let max = 1;
  let lo = 7;
  let hi = 22;
  cells.forEach((c) => {
    byKey[`${c.weekday}|${c.hour}`] = c.orders;
    max = Math.max(max, c.orders);
    lo = Math.min(lo, c.hour);
    hi = Math.max(hi, c.hour);
  });
  const hours = [];
  for (let h = lo; h <= hi; h += 1) hours.push(h);
  return (
    <>
      <div className="ins-heat-scroll">
        <div className="ins-heat" style={{ gridTemplateColumns: `40px repeat(${hours.length}, minmax(22px, 1fr))` }}>
          <span />
          {hours.map((h) => (
            <span key={h} className="ins-heat-hour">{hourLabel(h)}</span>
          ))}
          {WEEKDAY_ORDER.map((w) => (
            <React.Fragment key={w}>
              <span className="ins-heat-day">{WEEKDAY_SHORT[w]}</span>
              {hours.map((h) => {
                const v = byKey[`${w}|${h}`] || 0;
                const level = v ? 0.12 + 0.88 * (v / max) : 0;
                return (
                  <Tooltip key={h} title={`${WEEKDAY_SHORT[w]} ${hourLabel(h)}: ${v} order${v === 1 ? '' : 's'}`}>
                    <span
                      className="ins-heat-cell"
                      style={v ? { background: `rgba(250, 119, 0, ${level.toFixed(2)})` } : undefined}
                    />
                  </Tooltip>
                );
              })}
            </React.Fragment>
          ))}
        </div>
      </div>
      <div className="ins-heat-key">
        <span>Fewer</span>
        <i />
        <span>More orders</span>
      </div>
    </>
  );
};
Heatmap.propTypes = { cells: PropTypes.arrayOf(PropTypes.object).isRequired };

const InsightsPage = () => {
  const { period, periodLabel, fromDate, toDate } = useDashboardPeriod();
  const { isMultiStore, selectedStoreCodes } = useStoreView();
  const [daypart, setDaypart] = useState('all');
  const [loading, setLoading] = useState(true);
  const [data, setData] = useState(null);

  useEffect(() => {
    let cancelled = false;
    const fetchInsights = async () => {
      setLoading(true);
      try {
        const response = await api.get(isMultiStore ? '/admin/analytics/insights' : '/analytics/insights', {
          params: {
            period,
            from_date: period === 'custom_range' ? fromDate : undefined,
            to_date: period === 'custom_range' ? toDate : undefined,
            daypart,
            active_only: isMultiStore ? true : undefined,
            store_codes: isMultiStore && selectedStoreCodes.length > 0 ? selectedStoreCodes.join(',') : undefined,
          },
        });
        if (!cancelled) setData(response.data);
      } catch (err) {
        console.error('Failed to fetch insights', err);
        if (!cancelled) {
          setData(null);
          message.error(formatApiError(err));
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    };
    fetchInsights();
    return () => {
      cancelled = true;
    };
  }, [period, fromDate, toDate, daypart, isMultiStore, selectedStoreCodes]);

  const k = data?.kpis;
  const pk = data?.previous_kpis;
  const hasOrders = Boolean(k?.orders);
  const days = Math.max(1, data?.window?.days || 1);
  const perDay = (q) => (q / days).toFixed(1);
  const hasPrevious = Boolean(pk?.orders);

  const renderBody = () => {
    const ot = data.order_types;
    const habits = data.habits;
    const habitRows = [
      ['order more than one item', habits.multi_item_orders],
      ['customise their order', habits.customised_orders],
      ['pick a kitchen option', habits.option_orders],
      ['leave a note', habits.note_orders],
      ['add a paid add-on', habits.addon_orders],
      ['use a discount', habits.discount_orders],
    ];
    const rising = data.movers.filter((m) => m.change_pct == null || m.change_pct > 0).slice(0, 4);
    const falling = data.movers
      .filter((m) => m.change_pct != null && m.change_pct < 0)
      .slice(-4)
      .reverse();
    const moverRows = [...rising, ...falling];
    const speedRows = data.categories
      .filter((c) => c.ready_seconds_avg != null)
      .sort((a, b) => b.ready_seconds_avg - a.ready_seconds_avg);
    const peakDay = data.daily.reduce((m, d) => Math.max(m, d.orders), 0);

    return (
      <Row gutter={[20, 20]}>
        <Section title="Smart suggestions" sub="rule-based, from the numbers below" span={24}>
          {data.suggestions.length ? (
            <div className="ins-smart">
              {data.suggestions.map((s) => {
                const st = SUGGESTION_STYLE[s.kind] || SUGGESTION_STYLE.idea;
                return (
                  <div key={s.text} className="ins-smart-item">
                    <span className="ins-smart-icon" style={{ color: st.color, background: st.bg }}>{st.icon}</span>
                    <p>{s.text}</p>
                  </div>
                );
              })}
            </div>
          ) : (
            <Nothing text="Not enough orders yet to suggest anything." />
          )}
        </Section>

        <Section title="Takeaway vs dine-in" span={24}>
          <Row gutter={[32, 16]}>
            <Col xs={24} md={12}>
              <div className="ins-split-legend">
                <span><i className="ins-dot ins-dine" />Dine-in</span>
                <span><i className="ins-dot ins-take" />Takeaway / parcel</span>
              </div>
              <SplitRow label="Orders" dine={ot.dine_in.orders} take={ot.takeaway.orders} fmt={num} />
              <SplitRow label="Sales" dine={ot.dine_in.revenue} take={ot.takeaway.revenue} fmt={money} />
              <SplitRow label="Items" dine={ot.dine_in.units} take={ot.takeaway.units} fmt={num} />
              <SplitRow
                label="Average order"
                dine={ot.dine_in.avg_order_value}
                take={ot.takeaway.avg_order_value}
                fmt={money}
              />
              <p className="ins-note">
                Packing charges collected: <strong>{money(ot.takeaway_charges_total)}</strong>
                {ot.mixed_orders > 0 && <> · {num(ot.mixed_orders)} mixed orders (dine-in with some items packed, or the reverse)</>}
                . Orders and sales follow the order type; items follow each line.
              </p>
            </Col>
            <Col xs={24} md={12}>
              <h3 className="ins-h3">Takeaway share by time of day</h3>
              {ot.by_daypart.map((p) => (
                <Tooltip key={p.daypart} title={`${p.takeaway_orders} of ${p.orders} orders were takeaway`}>
                  <div className="ins-split-row">
                    <span className="ins-split-label">{DAYPART_LABEL[p.daypart].split(' (')[0]}</span>
                    <div className="ins-split-bar">
                      <i className="ins-take" style={{ width: `${p.takeaway_share_pct}%` }} />
                    </div>
                    <span className="ins-split-value">{p.orders ? `${Math.round(p.takeaway_share_pct)}%` : '–'}</span>
                  </div>
                </Tooltip>
              ))}
              <h3 className="ins-h3" style={{ marginTop: 18 }}>Most packed dishes</h3>
              {ot.top_takeaway_items.length ? (
                <Space size={[8, 8]} wrap>
                  {ot.top_takeaway_items.map((it) => (
                    <Tag key={it.sku} color="gold" style={{ borderRadius: 8, padding: '2px 10px' }}>
                      {it.item_name} <strong>{it.quantity}</strong>
                    </Tag>
                  ))}
                </Space>
              ) : (
                <Text type="secondary">No takeaway items in this period.</Text>
              )}
            </Col>
          </Row>
        </Section>

        <Section title="Best sellers" sub="units sold">
          <HBars
            rows={data.best_sellers.map((x) => ({
              key: x.sku,
              label: x.item_name,
              value: x.quantity,
              sub: `${money(x.revenue)} · ${perDay(x.quantity)} a day`,
              tip: `${x.item_name}: ${x.quantity} sold in ${x.order_count} orders, ${money(x.revenue)}`,
            }))}
          />
        </Section>

        <Section title="Sell more of these" sub="slowest movers">
          {data.slow_movers.length ? (
            <>
              <HBars
                rows={data.slow_movers.map((x) => ({
                  key: x.sku,
                  label: x.item_name,
                  value: x.quantity,
                  muted: true,
                  sub: `${perDay(x.quantity)} a day · ${money(x.revenue)}`,
                  tip: `${x.item_name}: ${x.quantity} sold in ${x.order_count} orders`,
                }))}
              />
              <p className="ins-note">Only items that sold at least once in this period are listed.</p>
            </>
          ) : (
            <Nothing text="Needs more than 8 different items sold to rank the slowest." />
          )}
        </Section>

        <Section title="Rising and falling" sub="vs the previous period">
          {!data.previous_window && <Nothing text="No previous period to compare for this range." />}
          {data.previous_window && !hasPrevious && <Nothing text="No orders in the previous period to compare with." />}
          {hasPrevious && !moverRows.length && (
            <Nothing text="No item sold enough across both periods to compare." />
          )}
          {hasPrevious && moverRows.length > 0 && (
            <div className="ins-list">
              {moverRows.map((m) => {
                const up = m.change_pct == null || m.change_pct > 0;
                return (
                  <Tooltip key={m.sku} title={`${m.item_name}: ${m.previous_quantity} → ${m.quantity}`}>
                    <div className="ins-list-row">
                      <span className={up ? 'ins-up' : 'ins-down'}>{up ? <RiseOutlined /> : <FallOutlined />}</span>
                      <span className="ins-list-name">{m.item_name}</span>
                      <span className={`ins-list-value ${up ? 'ins-up' : 'ins-down'}`}>
                        {m.change_pct == null ? 'new' : `${m.change_pct > 0 ? '+' : ''}${Math.round(m.change_pct)}%`}
                      </span>
                    </div>
                  </Tooltip>
                );
              })}
            </div>
          )}
        </Section>

        <Section title="Revenue by category">
          <HBars
            rows={data.categories.map((c) => ({
              key: c.category_id,
              label: c.category_name,
              value: c.revenue,
              valueText: `${Math.round(c.revenue_share_pct)}%`,
              sub: `${money(c.revenue)} · in ${Math.round(c.order_share_pct)}% of orders`,
              tip: `${c.category_name}: ${money(c.revenue)} from ${c.quantity} items, in ${c.order_count} orders`,
            }))}
          />
          {!data.category_mapping_available && (
            <p className="ins-note">No menu catalog found for this store, so items could not be grouped into categories.</p>
          )}
        </Section>

        <Section title="When guests order" sub="orders per hour, by weekday (IST)" span={24}>
          <Heatmap cells={data.heatmap} />
        </Section>

        <Section title="Orders per day" sub={peakDay ? `peak ${peakDay} a day` : undefined} span={24}>
          <div style={{ height: 240, minWidth: 0 }}>
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={data.daily.map((d) => ({ ...d, label: shortDate(d.date) }))}>
                <defs>
                  <linearGradient id="insOrdersFill" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor={brand.orange} stopOpacity={0.25} />
                    <stop offset="95%" stopColor={brand.orange} stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke={brand.line} vertical={false} />
                <XAxis dataKey="label" stroke={brand.muted} axisLine={false} tickLine={false} dy={8} style={{ fontSize: 12 }} />
                <YAxis allowDecimals={false} stroke={brand.muted} axisLine={false} tickLine={false} style={{ fontSize: 12 }} />
                <ChartTooltip
                  formatter={(value, name, item) => [`${value} orders · ${money(item.payload.revenue)}`, 'Day total']}
                  contentStyle={{
                    backgroundColor: '#FFFFFF',
                    border: '1px solid var(--ktr-line)',
                    borderRadius: 10,
                    color: brand.ink,
                  }}
                  cursor={{ stroke: brand.orange, strokeWidth: 1 }}
                />
                <Area
                  type="monotone"
                  dataKey="orders"
                  stroke={brand.orange}
                  strokeWidth={2}
                  fill="url(#insOrdersFill)"
                  isAnimationActive={false}
                  dot={data.daily.length <= 31 ? { r: 3, fill: brand.orange } : false}
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </Section>

        <Section title="Ordering habits" sub="share of orders where guests…">
          <div className="ins-habits">
            {habitRows.map(([label, count]) => (
              <Tooltip key={label} title={`${num(count)} of ${num(habits.orders)} orders`}>
                <div>
                  <Progress type="circle" percent={pct(count, habits.orders)} size={76} strokeColor={brand.orange} format={(p) => `${p}%`} />
                  <span className="ins-habit-label">{label}</span>
                </div>
              </Tooltip>
            ))}
          </div>
        </Section>

        <Section title="Bought together">
          {data.pairs.length ? (
            <>
              <div className="ins-list">
                {data.pairs.map((p) => (
                  <Tooltip key={`${p.sku_a}+${p.sku_b}`} title={`${p.orders} orders had both`}>
                    <div className="ins-list-row">
                      <span className="ins-list-name">
                        {p.item_a} <span className="ins-pair-plus">+</span> {p.item_b}
                      </span>
                      <span className="ins-list-value" style={{ color: brand.orangeInk }}>{Math.round(p.share_pct)}%</span>
                    </div>
                  </Tooltip>
                ))}
              </div>
              <p className="ins-note">Share of all orders that had both.</p>
            </>
          ) : (
            <Nothing text="No orders with two different items yet." />
          )}
        </Section>

        <Section title="How guests customise">
          {data.customisations.length ? (
            <>
              <HBars
                rows={data.customisations.map((c) => ({
                  key: `${c.option}|${c.category_id}`,
                  label: `${c.option} · ${c.category_name}`,
                  value: c.quantity,
                  valueText: `${Math.round(c.share_pct)}%`,
                  tip: `${c.quantity} ${c.category_name} items were ordered "${c.option}"`,
                }))}
              />
              <p className="ins-note">Bar = how many items; % = share of that category ordered this way.</p>
            </>
          ) : (
            <Nothing text="No item options were chosen in this period." />
          )}
        </Section>

        <Section title="Kitchen speed" sub="sent to kitchen → marked ready">
          {speedRows.length ? (
            <>
              <HBars
                rows={speedRows.map((c) => ({
                  key: c.category_id,
                  label: c.category_name,
                  value: c.ready_seconds_avg,
                  valueText: clock(c.ready_seconds_avg),
                  tip: `${c.category_name}: ${clock(c.ready_seconds_avg)} on average over ${c.timed_lines} order lines`,
                }))}
              />
              <p className="ins-note">
                Average per order line, from payment (when the kitchen gets it) until staff mark it ready on the KDS.
              </p>
            </>
          ) : (
            <Nothing text="Ready times appear once staff mark orders ready on the KDS." />
          )}
        </Section>
      </Row>
    );
  };

  return (
    <Spin spinning={loading} delay={200}>
      <div style={{ paddingBottom: 24 }}>
        <div
          className="glass-panel"
          style={{
            padding: '28px 32px',
            borderRadius: 16,
            marginBottom: 24,
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            flexWrap: 'wrap',
            gap: 16,
            background: 'linear-gradient(135deg, rgba(250, 119, 0, 0.08) 0%, rgba(255, 255, 255, 0.95) 55%)',
            border: '1px solid rgba(250, 119, 0, 0.15)',
          }}
        >
          <div>
            <Space align="center" style={{ marginBottom: 8 }} wrap>
              <Tag icon={<BulbOutlined />} color="processing" style={{ borderRadius: 20, fontWeight: 700, border: 'none', padding: '2px 12px' }}>
                Insights
              </Tag>
              <Text type="secondary" style={{ fontSize: 13 }}>
                Period: <strong style={{ color: brand.ink }}>{periodLabel}</strong> (IST)
                {daypart !== 'all' && <> · {DAYPART_LABEL[daypart]}</>}
              </Text>
            </Space>
            <Title level={2} style={{ margin: 0, color: brand.ink, fontSize: 28, fontWeight: 800 }}>
              Customer insights
            </Title>
            <Text type="secondary" style={{ fontSize: 15 }}>
              How guests order, what they choose, and what to push or rethink — completed orders only
              {isMultiStore ? ', across selected stores.' : '.'}
            </Text>
          </div>
          <Segmented value={daypart} onChange={setDaypart} options={DAYPART_OPTIONS} />
        </div>

        {k && (
          <Row gutter={[20, 20]} style={{ marginBottom: 20 }}>
            <Col xs={12} md={8} xl={4}>
              <KpiCard label="Orders" value={num(k.orders)}>
                <Delta current={k.orders} previous={pk?.orders} />
              </KpiCard>
            </Col>
            <Col xs={12} md={8} xl={4}>
              <KpiCard label="Sales" value={money(k.revenue)}>
                <Delta current={k.revenue} previous={pk?.revenue} />
              </KpiCard>
            </Col>
            <Col xs={12} md={8} xl={4}>
              <KpiCard label="Average order" value={money(k.avg_order_value)}>
                <Delta current={k.avg_order_value} previous={hasPrevious ? pk.avg_order_value : null} />
              </KpiCard>
            </Col>
            <Col xs={12} md={8} xl={4}>
              <KpiCard label="Items per order" value={k.items_per_order.toFixed(1)}>
                <Delta current={k.items_per_order} previous={hasPrevious ? pk.items_per_order : null} />
              </KpiCard>
            </Col>
            <Col xs={12} md={8} xl={4}>
              <KpiCard label="Paid to ready" value={clock(k.ready_seconds_median)}>
                {k.ready_seconds_median != null ? (
                  <Tooltip title={`Median over ${num(k.timed_orders)} orders fully marked ready. Average ${clock(k.ready_seconds_avg)}.`}>
                    <span>
                      <Delta current={k.ready_seconds_median} previous={pk?.ready_seconds_median} invert />
                    </span>
                  </Tooltip>
                ) : (
                  <span className="ins-flat">no ready times recorded</span>
                )}
              </KpiCard>
            </Col>
            <Col xs={12} md={8} xl={4}>
              <KpiCard label="Takeaway orders" value={`${Math.round(k.takeaway_share_pct)}%`}>
                <span className="ins-flat">{num(k.takeaway_orders)} of {num(k.orders)} orders</span>
              </KpiCard>
            </Col>
          </Row>
        )}

        {data && hasOrders && renderBody()}
        {data && !hasOrders && (
          <Card className="premium-card">
            <Nothing text={`No completed orders in this period${daypart !== 'all' ? ' for this time of day' : ''}.`} />
          </Card>
        )}
        {!data && !loading && (
          <Card className="premium-card">
            <Nothing text="Insights could not be loaded." />
          </Card>
        )}
      </div>
    </Spin>
  );
};

export default InsightsPage;
