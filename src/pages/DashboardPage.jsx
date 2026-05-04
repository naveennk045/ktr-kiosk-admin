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

const { Title, Text } = Typography;

const DashboardPage = () => {
  const { period, periodLabel, fromDate, toDate } = useDashboardPeriod();
  const { isMultiStore, selectedStoreCodes } = useStoreView();
  const [loading, setLoading] = useState(true);
  const [summary, setSummary] = useState(null);

  const chartData = [
    { name: '10 AM', orders: 4 },
    { name: '11 AM', orders: 8 },
    { name: '12 PM', orders: 15 },
    { name: '1 PM', orders: 22 },
    { name: '2 PM', orders: 14 },
    { name: '3 PM', orders: 9 },
    { name: '4 PM', orders: 12 },
    { name: '5 PM', orders: 18 },
  ];

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
    <span style={{ color: '#64748B', fontWeight: 600, fontSize: 12, textTransform: 'uppercase', letterSpacing: '0.06em' }}>
      {label}
    </span>
  );

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
          background: 'linear-gradient(135deg, rgba(99, 102, 241, 0.08) 0%, rgba(255, 255, 255, 0.95) 55%)',
          border: '1px solid rgba(99, 102, 241, 0.15)',
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
              Period: <strong style={{ color: '#0F172A' }}>{periodLabel}</strong> (IST)
            </Text>
          </Space>
          <Title level={2} style={{ margin: 0, color: '#0F172A', fontSize: 28, fontWeight: 800 }}>
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
                  background: 'rgba(99, 102, 241, 0.1)',
                  color: '#6366F1',
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
              valueStyle={{ color: '#0F172A', fontWeight: 800, fontSize: 26 }}
            />
          </Card>
        </Col>

        <Col xs={24} sm={12} lg={6}>
          <Card className="premium-card" styles={{ body: { padding: 22 } }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 16 }}>
              <div
                style={{
                  background: 'rgba(16, 185, 129, 0.1)',
                  color: '#059669',
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
              valueStyle={{ color: '#0F172A', fontWeight: 800, fontSize: 26 }}
            />
          </Card>
        </Col>

        <Col xs={24} sm={12} lg={6}>
          <Card className="premium-card" styles={{ body: { padding: 22 } }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 16 }}>
              <div
                style={{
                  background: 'rgba(14, 165, 233, 0.1)',
                  color: '#0284C7',
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
              valueStyle={{ color: '#0F172A', fontWeight: 800, fontSize: 26 }}
            />
          </Card>
        </Col>

        <Col xs={24} sm={12} lg={6}>
          <Card className="premium-card" styles={{ body: { padding: 22 } }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 16 }}>
              <div
                style={{
                  background: 'rgba(245, 158, 11, 0.12)',
                  color: '#D97706',
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
              valueStyle={{ color: '#0F172A', fontWeight: 800, fontSize: 26 }}
            />
          </Card>
        </Col>

        <Col xs={24} md={8}>
          <Card className="premium-card" styles={{ body: { padding: 22 } }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 12 }}>
              <QrcodeOutlined style={{ fontSize: 22, color: '#6366F1' }} />
              <Text strong style={{ color: '#0F172A' }}>
                UPI (QR)
              </Text>
            </div>
            <Statistic
              title={statTitle('Completed')}
              value={summary?.upiRupees ?? 0}
              formatter={(val) => formatInr(val)}
              valueStyle={{ color: '#0F172A', fontWeight: 800, fontSize: 22 }}
            />
          </Card>
        </Col>

        <Col xs={24} md={8}>
          <Card className="premium-card" styles={{ body: { padding: 22 } }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 12 }}>
              <CreditCardOutlined style={{ fontSize: 22, color: '#6366F1' }} />
              <Text strong style={{ color: '#0F172A' }}>
                Card
              </Text>
            </div>
            <Statistic
              title={statTitle('Completed')}
              value={summary?.cardRupees ?? 0}
              formatter={(val) => formatInr(val)}
              valueStyle={{ color: '#0F172A', fontWeight: 800, fontSize: 22 }}
            />
          </Card>
        </Col>

        <Col xs={24} md={8}>
          <Card className="premium-card" styles={{ body: { padding: 22 } }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 12 }}>
              <BankOutlined style={{ fontSize: 22, color: '#6366F1' }} />
              <Text strong style={{ color: '#0F172A' }}>
                Cash + manual
              </Text>
            </div>
            <Statistic
              title={statTitle('Completed')}
              value={summary?.cashRupees ?? 0}
              formatter={(val) => formatInr(val)}
              valueStyle={{ color: '#0F172A', fontWeight: 800, fontSize: 22 }}
            />
            <Text type="secondary" style={{ fontSize: 11, marginTop: 8, display: 'block' }}>
              Manual amounts are grouped with cash in KPIs.
            </Text>
          </Card>
        </Col>

        <Col span={24} style={{ minWidth: 0 }}>
          <Card
            title={<span style={{ color: '#0F172A', fontWeight: 700, fontSize: 17 }}>Activity (sample)</span>}
            className="premium-card"
            styles={{ body: { padding: '8px 20px 24px' } }}
          >
            <Text type="secondary" style={{ display: 'block', marginBottom: 8, fontSize: 12 }}>
              Illustrative hourly curve — wire to a time-series endpoint when available.
            </Text>
            <div style={{ height: 360, marginTop: 8, minWidth: 0 }}>
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={chartData}>
                  <defs>
                    <linearGradient id="colorOrdersLight" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#6366F1" stopOpacity={0.25} />
                      <stop offset="95%" stopColor="#6366F1" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="#E2E8F0" vertical={false} />
                  <XAxis
                    dataKey="name"
                    stroke="#94A3B8"
                    axisLine={false}
                    tickLine={false}
                    dy={8}
                    style={{ fontSize: 12 }}
                  />
                  <YAxis stroke="#94A3B8" axisLine={false} tickLine={false} style={{ fontSize: 12 }} />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: '#FFFFFF',
                      border: '1px solid #E2E8F0',
                      borderRadius: 10,
                      boxShadow: '0 10px 40px -10px rgb(15 23 42 / 0.15)',
                      color: '#0F172A',
                    }}
                    itemStyle={{ color: '#6366F1' }}
                    cursor={{ stroke: '#6366F1', strokeWidth: 1 }}
                  />
                  <Area
                    type="monotone"
                    dataKey="orders"
                    stroke="#6366F1"
                    strokeWidth={3}
                    fillOpacity={1}
                    fill="url(#colorOrdersLight)"
                    animationDuration={1500}
                  />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </Card>
        </Col>
      </Row>
    </div>
    </Spin>
  );
};

export default DashboardPage;
