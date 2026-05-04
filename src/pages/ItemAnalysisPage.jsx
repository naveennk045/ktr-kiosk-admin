import React, { useEffect, useState } from 'react';
import { Card, Table, Typography, Space, Tag, Spin, message, Row, Col } from 'antd';
import { ShoppingOutlined, TrophyOutlined } from '@ant-design/icons';
import api from '../api';
import { useDashboardPeriod } from '../context/DashboardPeriodContext';
import { useStoreView } from '../context/StoreViewContext';
import { formatInr } from '../utils/orderFields';
import { formatApiError } from '../utils/formatApiError';

const { Title, Text } = Typography;

const ItemAnalysisPage = () => {
  const { period, periodLabel, fromDate, toDate } = useDashboardPeriod();
  const { isMultiStore, selectedStoreCodes } = useStoreView();
  const [loading, setLoading] = useState(false);
  const [items, setItems] = useState([]);
  const [summaryData, setSummaryData] = useState(null);

  useEffect(() => {
    let cancelled = false;
    const fetchItemAnalysis = async () => {
      setLoading(true);
      try {
        // Multi-store item analysis might use a different endpoint or aggregate,
        // but for now we'll use the items/summary endpoint.
        const response = await api.get('/analytics/items/summary', {
          params: {
            period,
            from_date: period === 'custom_range' ? fromDate : undefined,
            to_date: period === 'custom_range' ? toDate : undefined,
          },
        });
        if (!cancelled) {
          setItems(response.data.items || []);
          setSummaryData({
            totalItemsSold: response.data.total_items_sold || 0,
            uniqueItems: response.data.unique_items || 0,
          });
        }
      } catch (err) {
        console.error('Failed to fetch item analysis', err);
        if (!cancelled) {
          setItems([]);
          message.error(formatApiError(err));
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    };
    fetchItemAnalysis();
    return () => {
      cancelled = true;
    };
  }, [period, fromDate, toDate, isMultiStore, selectedStoreCodes]);

  const columns = [
    {
      title: 'Item Name',
      dataIndex: 'item_name',
      key: 'item_name',
      render: (text) => <Text strong style={{ color: '#0F172A' }}>{text}</Text>,
    },
    {
      title: 'SKU',
      dataIndex: 'sku',
      key: 'sku',
      render: (text) => <Text type="secondary" code>{text}</Text>,
    },
    {
      title: 'Qty Sold',
      dataIndex: 'total_quantity',
      key: 'total_quantity',
      sorter: (a, b) => a.total_quantity - b.total_quantity,
      defaultSortOrder: 'descend',
      render: (val) => <Tag color="blue">{val}</Tag>,
    },
    {
      title: 'Revenue',
      dataIndex: 'total_revenue',
      key: 'total_revenue',
      sorter: (a, b) => a.total_revenue - b.total_revenue,
      render: (val) => formatInr(val),
      align: 'right',
    },
    {
      title: 'Order Count',
      dataIndex: 'order_count',
      key: 'order_count',
      sorter: (a, b) => a.order_count - b.order_count,
      align: 'right',
    },
  ];

  return (
    <Spin spinning={loading}>
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
                icon={<TrophyOutlined />}
                color="gold"
                style={{ borderRadius: 20, fontWeight: 700, border: 'none', padding: '2px 12px' }}
              >
                Item Performance
              </Tag>
              <Text type="secondary" style={{ fontSize: 13 }}>
                Period: <strong style={{ color: '#0F172A' }}>{periodLabel}</strong> (IST)
              </Text>
            </Space>
            <Title level={2} style={{ margin: 0, color: '#0F172A', fontSize: 28, fontWeight: 800 }}>
              Item Analysis
            </Title>
            <Text type="secondary" style={{ fontSize: 15 }}>
              Discover your bestsellers and product performance.
            </Text>
          </div>
        </div>

        <Row gutter={[20, 20]} style={{ marginBottom: 24 }}>
          <Col xs={24} sm={12}>
            <Card className="premium-card" styles={{ body: { padding: 22 } }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 12 }}>
                <ShoppingOutlined style={{ fontSize: 22, color: '#6366F1' }} />
                <Text strong style={{ color: '#0F172A' }}>Total Units Sold</Text>
              </div>
              <Title level={3} style={{ margin: 0, color: '#0F172A', fontWeight: 800 }}>
                {summaryData?.totalItemsSold ?? 0}
              </Title>
            </Card>
          </Col>
          <Col xs={24} sm={12}>
            <Card className="premium-card" styles={{ body: { padding: 22 } }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 12 }}>
                <TrophyOutlined style={{ fontSize: 22, color: '#F59E0B' }} />
                <Text strong style={{ color: '#0F172A' }}>Unique Items Sold</Text>
              </div>
              <Title level={3} style={{ margin: 0, color: '#0F172A', fontWeight: 800 }}>
                {summaryData?.uniqueItems ?? 0}
              </Title>
            </Card>
          </Col>
        </Row>

        <Card className="premium-card">
          <Table
            dataSource={items}
            columns={columns}
            rowKey="sku"
            pagination={{ pageSize: 10, showSizeChanger: true }}
          />
        </Card>
      </div>
    </Spin>
  );
};

export default ItemAnalysisPage;
