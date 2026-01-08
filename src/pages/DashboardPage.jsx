import React, { useEffect, useState } from 'react';
import { Card, Row, Col, Statistic, Typography, Spin, Avatar } from 'antd';
import { CreditCardOutlined, ShoppingOutlined, WarningOutlined } from '@ant-design/icons';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, AreaChart, Area } from 'recharts';
import api from '../api';

const { Title, Text } = Typography;

const DashboardPage = () => {
  const [loading, setLoading] = useState(true);
  const [summary, setSummary] = useState(null);

  // Mock data for charts
  const chartData = [
    { name: '10 AM', orders: 4 }, { name: '11 AM', orders: 8 },
    { name: '12 PM', orders: 15 }, { name: '1 PM', orders: 22 },
    { name: '2 PM', orders: 14 }, { name: '3 PM', orders: 9 },
    { name: '4 PM', orders: 12 }, { name: '5 PM', orders: 18 },
  ];

  useEffect(() => {
    const fetchSummary = async () => {
      try {
        const response = await api.get('/analytics/summary');
        setSummary(response.data);
      } catch (err) {
        console.error("Failed to fetch analytics", err);
        setSummary({
          totalRevenue: 42500.00,
          totalOrders: 120,
          pendingPayments: 3,
          syncFailures: 5
        });
      } finally {
        setLoading(false);
      }
    };
    fetchSummary();
  }, []);

  const cardStyle = {
    borderRadius: 16,
    border: 'none',
    overflow: 'hidden',
    height: '100%',
    color: '#1A1D1F', // Dark text
    background: '#ffffff',
    boxShadow: '0 4px 12px rgba(0,0,0,0.03)'
  };

  const iconBoxStyle = {
    width: 48,
    height: 48,
    borderRadius: 12,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
    fontSize: 24,
  }

  if (loading) return <div style={{ display: 'flex', justifyContent: 'center', marginTop: 100 }}><Spin size="large" /></div>;

  return (
    <div style={{ padding: '0 0 24px 0' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 32 }}>
        <div>
          <Title level={2} style={{ margin: 0, color: '#1A1D1F', fontSize: '28px', fontWeight: 700 }}>Dashboard</Title>
          <Text style={{ color: '#6F767E' }}>Overview of your kiosk performance</Text>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <div style={{ textAlign: 'right' }}>
            <Text strong style={{ display: 'block', color: '#1A1D1F' }}>KTR Admin</Text>
            <Text style={{ fontSize: '12px', color: '#6F767E' }}>Store Manager</Text>
          </div>
          <Avatar size={48} style={{ backgroundColor: '#F4F5F7', color: '#6C5DD3', border: '2px solid #fff', boxShadow: '0 2px 8px rgba(0,0,0,0.1)' }}>K</Avatar>
        </div>
      </div>

      <Row gutter={[24, 24]}>
        {/* KPI Cards - Clean White Style */}
        <Col xs={24} sm={12} lg={6}>
          <Card style={cardStyle} bordered={false}>
            <div style={{ ...iconBoxStyle, background: 'rgba(108, 93, 211, 0.1)', color: '#6C5DD3' }}>
              <span style={{ fontSize: 20 }}>₹</span>
            </div>
            <Statistic
              title={<span style={{ color: '#6F767E', fontWeight: 500 }}>Total Revenue</span>}
              value={summary?.totalRevenue}
              precision={2}
              prefix="₹"
              valueStyle={{ color: '#1A1D1F', fontWeight: 'bold', fontSize: 28 }}
            />
          </Card>
        </Col>
        <Col xs={24} sm={12} lg={6}>
          <Card style={cardStyle} bordered={false}>
            <div style={{ ...iconBoxStyle, background: 'rgba(255, 117, 76, 0.1)', color: '#FF754C' }}>
              <ShoppingOutlined />
            </div>
            <Statistic
              title={<span style={{ color: '#6F767E', fontWeight: 500 }}>Total Orders</span>}
              value={summary?.totalOrders}
              valueStyle={{ color: '#1A1D1F', fontWeight: 'bold', fontSize: 28 }}
            />
          </Card>
        </Col>
        <Col xs={24} sm={12} lg={6}>
          <Card style={cardStyle} bordered={false}>
            <div style={{ ...iconBoxStyle, background: 'rgba(51, 214, 159, 0.1)', color: '#33D69F' }}>
              <CreditCardOutlined />
            </div>
            <Statistic
              title={<span style={{ color: '#6F767E', fontWeight: 500 }}>Pending Payments</span>}
              value={summary?.pendingPayments}
              valueStyle={{ color: '#1A1D1F', fontWeight: 'bold', fontSize: 28 }}
            />
          </Card>
        </Col>
        <Col xs={24} sm={12} lg={6}>
          <Card style={cardStyle} bordered={false}>
            <div style={{ ...iconBoxStyle, background: 'rgba(255, 77, 79, 0.1)', color: '#FF4D4F' }}>
              <WarningOutlined />
            </div>
            <Statistic
              title={<span style={{ color: '#6F767E', fontWeight: 500 }}>Sync Failures</span>}
              value={summary?.syncFailures}
              valueStyle={{ color: '#1A1D1F', fontWeight: 'bold', fontSize: 28 }}
            />
          </Card>
        </Col>

        {/* Charts - Expanded to Full Width since Quick Actions removed */}
        <Col span={24}>
          <Card title={<span style={{ color: '#1A1D1F', fontWeight: 600 }}>Order Activity</span>} bordered={false} style={cardStyle}>
            <div style={{ height: 350, marginTop: 16 }}>
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={chartData}>
                  <defs>
                    <linearGradient id="colorOrders" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#6C5DD3" stopOpacity={0.3} />
                      <stop offset="95%" stopColor="#6C5DD3" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="#EFEFEF" vertical={false} />
                  <XAxis dataKey="name" stroke="#9A9FA5" axisLine={false} tickLine={false} dy={10} />
                  <YAxis stroke="#9A9FA5" axisLine={false} tickLine={false} />
                  <Tooltip
                    contentStyle={{ backgroundColor: '#fff', border: 'none', borderRadius: 12, boxShadow: '0 8px 30px rgba(0,0,0,0.12)', color: '#1A1D1F' }}
                    itemStyle={{ color: '#1A1D1F' }}
                    cursor={{ stroke: '#6C5DD3', strokeWidth: 1 }}
                  />
                  <Area type="monotone" dataKey="orders" stroke="#6C5DD3" strokeWidth={3} fillOpacity={1} fill="url(#colorOrders)" />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </Card>
        </Col>
      </Row>
    </div>
  );
};

export default DashboardPage;
