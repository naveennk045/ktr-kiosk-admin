import React, { useEffect, useState } from 'react';
import { Card, Table, Typography, Space, Tag, Spin, message, Row, Col, Tabs } from 'antd';
import {
  ShoppingOutlined,
  TrophyOutlined,
  AppstoreOutlined,
  PieChartOutlined,
  LineChartOutlined
} from '@ant-design/icons';
import {
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend
} from 'recharts';
import api from '../api';
import { useDashboardPeriod } from '../context/DashboardPeriodContext';
import { useStoreView } from '../context/StoreViewContext';
import { formatInr } from '../utils/orderFields';
import { formatApiError } from '../utils/formatApiError';

const { Title, Text } = Typography;

const CHART_COLORS = [
  '#6366F1', // Indigo
  '#10B981', // Emerald
  '#F59E0B', // Amber
  '#EF4444', // Red
  '#8B5CF6', // Purple
  '#EC4899', // Pink
  '#06B6D4', // Cyan
  '#14B8A6', // Teal
  '#64748B'  // Slate
];

const ItemAnalysisPage = () => {
  const { period, periodLabel, fromDate, toDate } = useDashboardPeriod();
  const { isMultiStore, selectedStoreCodes } = useStoreView();
  
  // Default to 'categories' as requested
  const [activeTab, setActiveTab] = useState('categories');

  // Item states
  const [itemsLoading, setItemsLoading] = useState(false);
  const [items, setItems] = useState([]);
  const [itemsSummary, setItemsSummary] = useState(null);

  // Category states
  const [categoriesLoading, setCategoriesLoading] = useState(false);
  const [categories, setCategories] = useState([]);

  // Fetch Items summary
  useEffect(() => {
    let cancelled = false;
    const fetchItemAnalysis = async () => {
      setItemsLoading(true);
      try {
        const response = await api.get('/analytics/items/summary', {
          params: {
            period,
            from_date: period === 'custom_range' ? fromDate : undefined,
            to_date: period === 'custom_range' ? toDate : undefined,
          },
        });
        if (!cancelled) {
          setItems(response.data.items || []);
          setItemsSummary({
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
        if (!cancelled) setItemsLoading(false);
      }
    };

    fetchItemAnalysis();
    return () => {
      cancelled = true;
    };
  }, [period, fromDate, toDate, isMultiStore, selectedStoreCodes]);

  // Fetch Category summary
  useEffect(() => {
    let cancelled = false;
    const fetchCategoryAnalysis = async () => {
      setCategoriesLoading(true);
      try {
        const response = await api.get('/analytics/categories/summary', {
          params: {
            period,
            from_date: period === 'custom_range' ? fromDate : undefined,
            to_date: period === 'custom_range' ? toDate : undefined,
          },
        });
        if (!cancelled) {
          setCategories(response.data.categories || []);
        }
      } catch (err) {
        console.error('Failed to fetch category analysis', err);
        if (!cancelled) {
          setCategories([]);
          message.error(formatApiError(err));
        }
      } finally {
        if (!cancelled) setCategoriesLoading(false);
      }
    };

    fetchCategoryAnalysis();
    return () => {
      cancelled = true;
    };
  }, [period, fromDate, toDate, isMultiStore, selectedStoreCodes]);

  // Item columns
  const itemColumns = [
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
      render: (val) => <Tag color="blue" style={{ fontWeight: 600 }}>{val}</Tag>,
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

  // Category columns
  const categoryColumns = [
    {
      title: 'Category Name',
      dataIndex: 'category_name',
      key: 'category_name',
      width: '40%',
      render: (text) => <Text strong style={{ color: '#0F172A' }}>{text}</Text>,
    },
    {
      title: 'Total Qty Sold',
      dataIndex: 'total_quantity',
      key: 'total_quantity',
      width: '20%',
      sorter: (a, b) => a.total_quantity - b.total_quantity,
      render: (val) => <Tag color="indigo" style={{ fontWeight: 600 }}>{val}</Tag>,
    },
    {
      title: 'Total Revenue',
      dataIndex: 'total_revenue',
      key: 'total_revenue',
      width: '20%',
      sorter: (a, b) => a.total_revenue - b.total_revenue,
      render: (val) => formatInr(val),
      align: 'right',
    },
    {
      title: 'Order Count',
      dataIndex: 'order_count',
      key: 'order_count',
      width: '20%',
      sorter: (a, b) => a.order_count - b.order_count,
      align: 'right',
    },
  ];

  // Expanded row showing items within a category
  const expandedRowRender = (categoryRecord) => {
    const nestedItemColumns = [
      {
        title: 'Item Name',
        dataIndex: 'item_name',
        key: 'item_name',
        width: '40%',
        render: (text, item) => (
          <Space direction="vertical" size={0}>
            <Text style={{ color: '#334155', fontWeight: 600 }}>{text}</Text>
            <Text type="secondary" style={{ fontSize: 11 }} code>{item.sku}</Text>
          </Space>
        ),
      },
      {
        title: 'Qty Sold',
        dataIndex: 'total_quantity',
        key: 'total_quantity',
        width: '20%',
        render: (val) => <Tag color="default" style={{ fontWeight: 500 }}>{val}</Tag>,
      },
      {
        title: 'Revenue',
        dataIndex: 'total_revenue',
        key: 'total_revenue',
        width: '20%',
        render: (val) => <Text style={{ color: '#475569', fontWeight: 500 }}>{formatInr(val)}</Text>,
        align: 'right',
      },
      {
        title: 'Order Count',
        dataIndex: 'order_count',
        key: 'order_count',
        width: '20%',
        render: (val) => <Text style={{ color: '#475569', fontWeight: 500 }}>{val}</Text>,
        align: 'right',
      },
    ];

    return (
      <Table
        columns={nestedItemColumns}
        dataSource={categoryRecord.items}
        rowKey="sku"
        pagination={false}
        size="small"
        showHeader={false} // Clean: hide the repeated headers
        bordered={false}
        style={{
          margin: '4px 0',
          backgroundColor: '#F8FAFC',
          borderRadius: 8,
          border: '1px solid #EEF2F6'
        }}
      />
    );
  };

  // Compute category statistics
  const totalCategories = categories.length;
  const topCategoryByQuantity = categories[0] || null;
  const topCategoryByRevenue = [...categories].sort((a, b) => b.total_revenue - a.total_revenue)[0] || null;

  // Prepare Recharts data
  const pieData = categories.map(cat => ({
    name: cat.category_name,
    value: cat.total_revenue,
  }));

  const barData = categories.map(cat => ({
    name: cat.category_name,
    quantity: cat.total_quantity,
    revenue: cat.total_revenue,
  }));

  const renderItemTab = () => (
    <Spin spinning={itemsLoading}>
      <Row gutter={[20, 20]} style={{ marginBottom: 24 }}>
        <Col xs={24} sm={12}>
          <Card className="premium-card" styles={{ body: { padding: 22 } }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 12 }}>
              <ShoppingOutlined style={{ fontSize: 22, color: '#6366F1' }} />
              <Text strong style={{ color: '#0F172A' }}>Total Units Sold</Text>
            </div>
            <Title level={3} style={{ margin: 0, color: '#0F172A', fontWeight: 800 }}>
              {itemsSummary?.totalItemsSold ?? 0}
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
              {itemsSummary?.uniqueItems ?? 0}
            </Title>
          </Card>
        </Col>
      </Row>

      <Card className="premium-card">
        <Table
          dataSource={items}
          columns={itemColumns}
          rowKey="sku"
          pagination={{ pageSize: 10, showSizeChanger: true }}
        />
      </Card>
    </Spin>
  );

  const renderCategoryTab = () => (
    <Spin spinning={categoriesLoading}>
      <Row gutter={[20, 20]} style={{ marginBottom: 24 }}>
        <Col xs={24} md={8}>
          <Card className="premium-card" styles={{ body: { padding: 22 } }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 12 }}>
              <AppstoreOutlined style={{ fontSize: 22, color: '#6366F1' }} />
              <Text strong style={{ color: '#0F172A' }}>Total Categories Sold</Text>
            </div>
            <Title level={3} style={{ margin: 0, color: '#0F172A', fontWeight: 800 }}>
              {totalCategories}
            </Title>
          </Card>
        </Col>
        <Col xs={24} md={8}>
          <Card className="premium-card" styles={{ body: { padding: 22 } }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 12 }}>
              <TrophyOutlined style={{ fontSize: 22, color: '#10B981' }} />
              <Text strong style={{ color: '#0F172A' }}>Top Category (Qty)</Text>
            </div>
            <Title level={3} style={{ margin: 0, color: '#0F172A', fontWeight: 800 }}>
              {topCategoryByQuantity ? (
                <>
                  {topCategoryByQuantity.category_name}{' '}
                  <span style={{ fontSize: 14, color: '#64748B', fontWeight: 500 }}>
                    ({topCategoryByQuantity.total_quantity} sold)
                  </span>
                </>
              ) : (
                'N/A'
              )}
            </Title>
          </Card>
        </Col>
        <Col xs={24} md={8}>
          <Card className="premium-card" styles={{ body: { padding: 22 } }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 12 }}>
              <PieChartOutlined style={{ fontSize: 22, color: '#F59E0B' }} />
              <Text strong style={{ color: '#0F172A' }}>Top Category (Rev)</Text>
            </div>
            <Title level={3} style={{ margin: 0, color: '#0F172A', fontWeight: 800 }}>
              {topCategoryByRevenue ? (
                <>
                  {topCategoryByRevenue.category_name}{' '}
                  <span style={{ fontSize: 14, color: '#64748B', fontWeight: 500 }}>
                    ({formatInr(topCategoryByRevenue.total_revenue)})
                  </span>
                </>
              ) : (
                'N/A'
              )}
            </Title>
          </Card>
        </Col>
      </Row>

      {totalCategories > 0 && (
        <Row gutter={[20, 20]} style={{ marginBottom: 24 }}>
          {/* Donut Chart: Revenue Share (Using a clean side-by-side design to avoid overlapped labels) */}
          <Col xs={24} lg={10}>
            <Card
              title={<span style={{ color: '#0F172A', fontWeight: 700, fontSize: 16 }}>Revenue Share by Category</span>}
              className="premium-card"
              styles={{ body: { padding: '16px 20px 24px' } }}
            >
              <Row gutter={[12, 12]} align="middle" style={{ minHeight: 320 }}>
                <Col xs={24} sm={13}>
                  <div style={{ height: 260 }}>
                    <ResponsiveContainer width="100%" height="100%">
                      <PieChart>
                        <Pie
                          data={pieData}
                          cx="50%"
                          cy="50%"
                          innerRadius={60}
                          outerRadius={85}
                          paddingAngle={3}
                          dataKey="value"
                          label={false} // Disable overlapping chart labels
                        >
                          {pieData.map((entry, index) => (
                            <Cell key={`cell-${index}`} fill={CHART_COLORS[index % CHART_COLORS.length]} />
                          ))}
                        </Pie>
                        <Tooltip formatter={(value) => formatInr(value)} />
                      </PieChart>
                    </ResponsiveContainer>
                  </div>
                </Col>
                <Col xs={24} sm={11}>
                  <div style={{ maxHeight: 260, overflowY: 'auto', paddingRight: 4 }}>
                    {pieData.map((entry, index) => (
                      <div key={entry.name} style={{ display: 'flex', alignItems: 'center', marginBottom: 8, fontSize: 12 }}>
                        <div
                          style={{
                            width: 10,
                            height: 10,
                            borderRadius: '50%',
                            backgroundColor: CHART_COLORS[index % CHART_COLORS.length],
                            marginRight: 8,
                            flexShrink: 0
                          }}
                        />
                        <span style={{ fontWeight: 500, color: '#475569', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', maxWidth: 85 }} title={entry.name}>
                          {entry.name}
                        </span>
                        <span style={{ marginLeft: 'auto', fontWeight: 600, color: '#0F172A' }}>
                          {formatInr(entry.value)}
                        </span>
                      </div>
                    ))}
                  </div>
                </Col>
              </Row>
            </Card>
          </Col>

          {/* Bar Chart: Units vs Revenue */}
          <Col xs={24} lg={14}>
            <Card
              title={<span style={{ color: '#0F172A', fontWeight: 700, fontSize: 16 }}>Sales & Revenue by Category</span>}
              className="premium-card"
              styles={{ body: { padding: '16px 20px 24px' } }}
            >
              <div style={{ height: 320 }}>
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={barData} margin={{ top: 10, right: 10, left: 10, bottom: 10 }}>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#EEF2F6" />
                    <XAxis dataKey="name" stroke="#94A3B8" tickLine={false} style={{ fontSize: 11 }} />
                    <YAxis yAxisId="left" orientation="left" stroke="#6366F1" tickLine={false} style={{ fontSize: 11 }} />
                    <YAxis yAxisId="right" orientation="right" stroke="#10B981" tickLine={false} style={{ fontSize: 11 }} />
                    <Tooltip
                      formatter={(value, name, props) => {
                        // Check props.dataKey directly for robust formatting
                        if (props.dataKey === 'revenue') {
                          return [formatInr(value), 'Revenue'];
                        }
                        return [value, 'Units Sold'];
                      }}
                      contentStyle={{ borderRadius: 8, border: '1px solid #E2E8F0', backgroundColor: '#FFFFFF' }}
                    />
                    <Legend />
                    <Bar yAxisId="left" dataKey="quantity" name="Units Sold" fill="#6366F1" radius={[4, 4, 0, 0]} />
                    <Bar yAxisId="right" dataKey="revenue" name="Revenue" fill="#10B981" radius={[4, 4, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </Card>
          </Col>
        </Row>
      )}

      <Card className="premium-card">
        <Table
          dataSource={categories}
          columns={categoryColumns}
          rowKey="category_id"
          expandable={{
            expandedRowRender,
            rowExpandable: (record) => record.items && record.items.length > 0
          }}
          pagination={{ pageSize: 10, showSizeChanger: true }}
        />
      </Card>
    </Spin>
  );

  return (
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
              icon={<LineChartOutlined />}
              color="purple"
              style={{ borderRadius: 20, fontWeight: 700, border: 'none', padding: '2px 12px' }}
            >
              Sales Analytics
            </Tag>
            <Text type="secondary" style={{ fontSize: 13 }}>
              Period: <strong style={{ color: '#0F172A' }}>{periodLabel}</strong> (IST)
            </Text>
          </Space>
          <Title level={2} style={{ margin: 0, color: '#0F172A', fontSize: 28, fontWeight: 800 }}>
            Product Performance
          </Title>
          <Text type="secondary" style={{ fontSize: 15 }}>
            Discover bestsellers and explore performance patterns across products and menu categories.
          </Text>
        </div>
      </div>

      <Card
        className="glass-panel"
        styles={{ body: { padding: '12px 24px 0px 24px' } }}
        style={{
          marginBottom: 20,
          border: '1px solid rgba(99, 102, 241, 0.08)',
          boxShadow: 'none'
        }}
      >
        <Tabs
          activeKey={activeTab}
          onChange={setActiveTab}
          size="large"
          tabBarStyle={{ marginBottom: 0, borderBottom: 'none' }}
          items={[
            {
              key: 'categories',
              label: (
                <span style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  <AppstoreOutlined />
                  Category Analysis
                </span>
              )
            },
            {
              key: 'items',
              label: (
                <span style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  <ShoppingOutlined />
                  Item Analysis
                </span>
              )
            }
          ]}
        />
      </Card>

      {activeTab === 'items' ? renderItemTab() : renderCategoryTab()}
    </div>
  );
};

export default ItemAnalysisPage;
