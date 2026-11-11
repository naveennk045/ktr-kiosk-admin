import React, { useEffect, useState } from 'react';
import { Card, Row, Col, Statistic, Typography, Spin, Space, Tag, message } from 'antd';
import {
  CreditCardOutlined,
  ShoppingOutlined,
  ArrowUpOutlined,
  RocketFilled,
  WalletOutlined,
  BankOutlined,
  QrcodeOutlined,
} from '@ant-design/icons';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import api from '../api';
import { useDashboardPeriod } from '../context/DashboardPeriodContext';
import { useStoreView } from '../context/StoreViewContext';
import { formatInr } from '../utils/orderFields';
import { formatApiError } from '../utils/formatApiError';
import RightNowStrip from '../components/RightNowStrip';
import { brand } from '../theme';

const { Title, Text } = Typography;

const DashboardPage = () => {
  const { period, periodLabel, fromDate, toDate } = useDashboardPeriod();
  const { isMultiStore, selectedStoreCodes } = useStoreView();
  const [loading, setLoading] = useState(true);
  const [summary, setSummary] = useState(null);

  // Orders by hour of day (IST) for the selected period, from the insights endpoint.
  const [activity, setActivity] = useState({ loading: true, points: [] });

  useEffect(() => {
    let cancelled = false;
    setActivity((cur) => ({ ...cur, loading: true }));
    api
      .get(isMultiStore ? '/admin/analytics/insights' : '/analytics/insights', {
        params: {
          period,
          from_date: period === 'custom_range' ? fromDate : undefined,
          to_date: period === 'custom_range' ? toDate : undefined,
          active_only: isMultiStore ? true : undefined,
          store_codes: isMultiStore && selectedStoreCodes.length > 0 ? selectedStoreCodes.join(',') : undefined,
        },
      })
      .then((response) => {
        if (cancelled) return;
        const byHour = new Map();
        for (const cell of response.data?.heatmap || []) {
          byHour.set(cell.hour, (byHour.get(cell.hour) || 0) + (cell.orders || 0));
        }
        const hours = [...byHour.keys()];
        const points = [];
        if (hours.length) {
          for (let h = Math.min(...hours); h <= Math.max(...hours); h += 1) {
            const label = `${h % 12 === 0 ? 12 : h % 12} ${h < 12 ? 'AM' : 'PM'}`;
            points.push({ name: label, orders: byHour.get(h) || 0 });
          }
        }
        setActivity({ loading: false, points });
      })
      .catch((err) => {
        // The KPI cards have their own error message; the chart just shows its empty state.
        console.error('Failed to fetch activity', err);
        if (!cancelled) setActivity({ loading: false, points: [] });
      });
    return () => {
      cancelled = true;
    };
  }, [period, fromDate, toDate, isMultiStore, selectedStoreCodes]);
  const chartData = activity.points;

  useEffect(() => {
    let cancelled = false;
    const fetchSummary = async () => {
      setLoading(true);
      try {
        const response = await api.get(isMultiStore ? '/admin/analytics/summary' : '/analytics/summary', {
          params: {
            period,
            from_date: period === 'custom_range' ? fromDate : undefined,
            to_date: period === 'custom_range' ? toDate : undefined,
            active_only: true,
            store_codes: isMultiStore && selectedStoreCodes.length > 0 ? selectedStoreCodes.join(',') : undefined,
          },
        });
        if (!cancelled) setSummary(response.data);
      } catch (err) {
        console.error('Failed to fetch analytics', err);
        if (!cancelled) {
          setSummary(null);
          message.error(formatApiError(err));
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    };
    fetchSummary();
    return () => {
      cancelled = true;
    };
  }, [period, fromDate, toDate, isMultiStore, selectedStoreCodes]);

  const statTitle = (label) => (
    <span style={{ color: brand.muted, fontWeight: 600, fontSize: 12, textTransform: 'uppercase', letterSpacing: '0.06em' }}>
      {label}
    </span>
  );

  return (
    <Spin spinning={loading} delay={200}>
    <div style={{ paddingBottom: 24 }}>
      <RightNowStrip />
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
            <Tag
              icon={<RocketFilled />}
              color="processing"
              style={{ borderRadius: 20, fontWeight: 700, border: 'none', padding: '2px 12px' }}
            >
              Live
            </Tag>
            <Text type="secondary" style={{ fontSize: 13 }}>
              Period: <strong style={{ color: brand.ink }}>{periodLabel}</strong> (IST)
            </Text>
          </Space>
          <Title level={2} style={{ margin: 0, color: brand.ink, fontSize: 28, fontWeight: 800 }}>
            Analytics overview
          </Title>
          <Text type="secondary" style={{ fontSize: 15 }}>
            Completed orders only — revenue and payment mix for the selected window
            {isMultiStore ? ' across selected stores.' : '.'}
          </Text>
        </div>
      </div>

      <Row gutter={[20, 20]}>
        <Col xs={24} sm={12} lg={6}>
          <Card className="premium-card" styles={{ body: { padding: 22 } }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 16 }}>
              <div
                style={{
                  background: 'rgba(250, 119, 0, 0.1)',
                  color: brand.orange,
                  width: 44,
                  height: 44,
                  borderRadius: 12,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontSize: 20,
                  fontWeight: 700,
                }}
              >
                ₹
              </div>
              <Tag color="success" icon={<ArrowUpOutlined />} style={{ borderRadius: 6, fontWeight: 600 }}>
                KPI
              </Tag>
            </div>
            <Statistic
              title={statTitle('Total revenue')}
              value={summary?.totalRevenue ?? 0}
              formatter={(val) => formatInr(val)}
              valueStyle={{ color: brand.ink, fontWeight: 800, fontSize: 26 }}
            />
          </Card>
        </Col>

        <Col xs={24} sm={12} lg={6}>
          <Card className="premium-card" styles={{ body: { padding: 22 } }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 16 }}>
              <div
                style={{
                  background: 'rgba(47, 125, 50, 0.1)',
                  color: brand.ok,
                  width: 44,
                  height: 44,
                  borderRadius: 12,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontSize: 22,
                }}
              >
                <ShoppingOutlined />
              </div>
            </div>
            <Statistic
              title={statTitle('Total orders')}
              value={summary?.totalOrders ?? 0}
              valueStyle={{ color: brand.ink, fontWeight: 800, fontSize: 26 }}
            />
          </Card>
        </Col>

        <Col xs={24} sm={12} lg={6}>
          <Card className="premium-card" styles={{ body: { padding: 22 } }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 16 }}>
              <div
                style={{
                  background: 'rgba(77, 94, 33, 0.1)',
                  color: brand.olive,
                  width: 44,
                  height: 44,
                  borderRadius: 12,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontSize: 22,
                }}
              >
                <WalletOutlined />
              </div>
            </div>
            <Statistic
              title={statTitle('Dine-in')}
              value={summary?.dineInOrders ?? 0}
              valueStyle={{ color: brand.ink, fontWeight: 800, fontSize: 26 }}
            />
          </Card>
        </Col>

        <Col xs={24} sm={12} lg={6}>
          <Card className="premium-card" styles={{ body: { padding: 22 } }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 16 }}>
              <div
                style={{
                  background: 'rgba(255, 196, 31, 0.12)',
                  color: brand.orangeInk,
                  width: 44,
                  height: 44,
                  borderRadius: 12,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontSize: 22,
                }}
              >
                <ShoppingOutlined />
              </div>
            </div>
            <Statistic
              title={statTitle('Takeaway')}
              value={summary?.takeAwayOrders ?? 0}
              valueStyle={{ color: brand.ink, fontWeight: 800, fontSize: 26 }}
            />
          </Card>
        </Col>

        <Col xs={24} md={8}>
          <Card className="premium-card" styles={{ body: { padding: 22 } }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 12 }}>
              <QrcodeOutlined style={{ fontSize: 22, color: brand.orange }} />
              <Text strong style={{ color: brand.ink }}>
                UPI (QR)
              </Text>
            </div>
            <Statistic
              title={statTitle('Completed')}
              value={summary?.upiRupees ?? 0}
              formatter={(val) => formatInr(val)}
              valueStyle={{ color: brand.ink, fontWeight: 800, fontSize: 22 }}
            />
          </Card>
        </Col>

        <Col xs={24} md={8}>
          <Card className="premium-card" styles={{ body: { padding: 22 } }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 12 }}>
              <CreditCardOutlined style={{ fontSize: 22, color: brand.orange }} />
              <Text strong style={{ color: brand.ink }}>
                Card
              </Text>
            </div>
            <Statistic
              title={statTitle('Completed')}
              value={summary?.cardRupees ?? 0}
              formatter={(val) => formatInr(val)}
              valueStyle={{ color: brand.ink, fontWeight: 800, fontSize: 22 }}
            />
          </Card>
        </Col>

        <Col xs={24} md={8}>
          <Card className="premium-card" styles={{ body: { padding: 22 } }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 12 }}>
              <BankOutlined style={{ fontSize: 22, color: brand.orange }} />
              <Text strong style={{ color: brand.ink }}>
                Cash + manual
              </Text>
            </div>
            <Statistic
              title={statTitle('Completed')}
              value={summary?.cashRupees ?? 0}
              formatter={(val) => formatInr(val)}
              valueStyle={{ color: brand.ink, fontWeight: 800, fontSize: 22 }}
            />
            <Text type="secondary" style={{ fontSize: 11, marginTop: 8, display: 'block' }}>
              Manual amounts are grouped with cash in KPIs.
            </Text>
          </Card>
        </Col>

        <Col span={24} style={{ minWidth: 0 }}>
          <Card
            title={<span style={{ color: brand.ink, fontWeight: 700, fontSize: 17 }}>Orders by hour</span>}
            className="premium-card"
            styles={{ body: { padding: '8px 20px 24px' } }}
          >
            <Text type="secondary" style={{ display: 'block', marginBottom: 8, fontSize: 12 }}>
              Completed orders by hour of day (IST) for {periodLabel}.
            </Text>
            {chartData.length === 0 ? (
              <div style={{ height: 360, marginTop: 8, display: 'grid', placeItems: 'center' }}>
                <Text type="secondary">{activity.loading ? 'Loading activity…' : 'No completed orders in this period.'}</Text>
              </div>
            ) : (
            <div style={{ height: 360, marginTop: 8, minWidth: 0 }}>
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={chartData}>
                  <defs>
                    <linearGradient id="colorOrdersLight" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor={brand.orange} stopOpacity={0.25} />
                      <stop offset="95%" stopColor={brand.orange} stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke={brand.line} vertical={false} />
                  <XAxis
                    dataKey="name"
                    stroke={brand.muted}
                    axisLine={false}
                    tickLine={false}
                    dy={8}
                    style={{ fontSize: 12 }}
                  />
                  <YAxis allowDecimals={false} stroke={brand.muted} axisLine={false} tickLine={false} style={{ fontSize: 12 }} />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: '#FFFFFF',
                      border: '1px solid var(--ktr-line)',
                      borderRadius: 10,
                      boxShadow: '0 10px 40px -10px rgba(77, 40, 10, 0.15)',
                      color: brand.ink,
                    }}
                    itemStyle={{ color: brand.orange }}
                    cursor={{ stroke: brand.orange, strokeWidth: 1 }}
                  />
                  <Area
                    type="monotone"
                    dataKey="orders"
                    stroke={brand.orange}
                    strokeWidth={3}
                    fillOpacity={1}
                    fill="url(#colorOrdersLight)"
                    animationDuration={1500}
                  />
                </AreaChart>
              </ResponsiveContainer>
            </div>
            )}
          </Card>
        </Col>
      </Row>
    </div>
    </Spin>
  );
};

export default DashboardPage;
