import React, { useState, useEffect, useCallback } from 'react';
import { Table, Tag, Input, Button, Card, message, Typography, Space, Tooltip, Spin } from 'antd';
import {
  SearchOutlined,
  EyeOutlined,
  ReloadOutlined,
  TransactionOutlined,
} from '@ant-design/icons';
import api from '../api';
import OrderDetailsDrawer from '../components/OrderDetailsDrawer';
import { formatIst, formatInr, getKotCode, getOrderType, getPaymentType } from '../utils/orderFields';
import { useDashboardPeriod } from '../context/DashboardPeriodContext';

const { Title, Text } = Typography;

const TransactionsPage = () => {
  const { period, periodLabel } = useDashboardPeriod();
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(false);
  const [pagination, setPagination] = useState({ current: 1, pageSize: 20, total: 0 });
  const [searchText, setSearchText] = useState('');
  const [selectedOrder, setSelectedOrder] = useState(null);
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [sortField, setSortField] = useState('created_at');
  const [sortOrder, setSortOrder] = useState('desc');

  const fetchData = useCallback(
    async (page = 1, pageSize = 20, search = '', sort = 'created_at', dir = 'desc') => {
      setLoading(true);
      try {
        const params = {
          page: page - 1,
          size: pageSize,
          sortBy: sort,
          sortDir: dir,
          status: 'COMPLETED',
          period,
        };
        if (search && String(search).trim()) {
          params.search = String(search).trim();
        }
        const response = await api.get('/orders', { params });
        setData(response.data.content || []);
        setPagination({
          current: page,
          pageSize,
          total: response.data.totalElements ?? 0,
        });
      } catch (error) {
        console.error('Fetch orders failed', error);
        message.error('Failed to fetch orders');
        setData([]);
      } finally {
        setLoading(false);
      }
    },
    [period]
  );

  useEffect(() => {
    fetchData(1, pagination.pageSize, searchText, sortField, sortOrder);
    // eslint-disable-next-line react-hooks/exhaustive-deps -- intentional: refetch when period/search changes; sort & page size handled via table onChange
  }, [searchText, period, fetchData]);

  const handleTableChange = (newPagination, _filters, sorter) => {
    const sortChanged =
      sorter.field !== sortField || (sorter.order === 'ascend' ? 'asc' : 'desc') !== sortOrder;
    const pageChanged =
      newPagination.current !== pagination.current ||
      newPagination.pageSize !== pagination.pageSize;

    if (sortChanged || pageChanged) {
      const field = sorter.field || 'created_at';
      const order = sorter.order === 'ascend' ? 'asc' : 'desc';
      setSortField(field);
      setSortOrder(order);
      fetchData(newPagination.current, newPagination.pageSize, searchText, field, order);
    }
  };

  const columns = [
    {
      title: 'Order ID',
      dataIndex: 'orderRefId',
      key: 'orderRefId',
      width: 200,
      render: (id) => (
        <Text
          strong
          style={{
            fontSize: '13px',
            fontFamily: 'ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace',
            color: '#0F172A',
          }}
        >
          {id}
        </Text>
      ),
    },
    {
      title: 'KOT code',
      key: 'kot',
      width: 120,
      render: (_, record) => (
        <Text style={{ color: '#334155', fontSize: '13px' }}>{getKotCode(record)}</Text>
      ),
    },
    {
      title: 'Date',
      dataIndex: 'createdAt',
      key: 'createdAt',
      width: 200,
      render: (text) => <Text style={{ color: '#0F172A', fontSize: '13px' }}>{formatIst(text)}</Text>,
      sorter: true,
    },
    {
      title: 'Order type',
      key: 'orderType',
      width: 130,
      render: (_, record) => (
        <Tag
          style={{
            margin: 0,
            background: 'rgba(99, 102, 241, 0.1)',
            border: '1px solid rgba(99, 102, 241, 0.2)',
            color: '#4F46E5',
            borderRadius: 6,
            fontWeight: 600,
            fontSize: '12px',
          }}
        >
          {getOrderType(record)}
        </Tag>
      ),
    },
    {
      title: 'Payment type',
      key: 'paymentType',
      width: 130,
      render: (_, record) => (
        <Text style={{ color: '#64748B', fontSize: '13px', fontWeight: 600 }}>
          {getPaymentType(record)}
        </Text>
      ),
    },
    {
      title: 'Amount',
      dataIndex: 'amount',
      key: 'amount',
      align: 'right',
      width: 120,
      render: (amount) => (
        <Text strong style={{ color: '#0F172A', fontSize: '14px' }}>
          {formatInr(amount)}
        </Text>
      ),
      sorter: true,
    },
    {
      title: '',
      key: 'action',
      width: 140,
      align: 'right',
      render: (_, record) => (
        <Button
          type="primary"
          icon={<EyeOutlined />}
          onClick={() => {
            setSelectedOrder(record);
            setDrawerOpen(true);
          }}
          style={{ borderRadius: 8, fontWeight: 600 }}
        >
          View details
        </Button>
      ),
    },
  ];

  return (
    <div className="animate-fade-in" style={{ paddingBottom: 24 }}>
      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'flex-end',
          marginBottom: 24,
          flexWrap: 'wrap',
          gap: 16,
        }}
      >
        <div>
          <Space align="center" style={{ marginBottom: 4 }}>
            <TransactionOutlined style={{ color: '#6366F1' }} />
            <Text
              style={{
                color: '#6366F1',
                fontWeight: 800,
                fontSize: '12px',
                letterSpacing: '1px',
                textTransform: 'uppercase',
              }}
            >
              Orders
            </Text>
          </Space>
          <Title level={2} style={{ margin: 0, color: '#0F172A', fontSize: '28px', fontWeight: 800 }}>
            Transactions
          </Title>
          <Text type="secondary">
            Paid orders only · same period as the header: <strong>{periodLabel}</strong> (IST). Search by order ID.
          </Text>
        </div>

        <Space size={16} wrap>
          <Input
            placeholder="Search order ID…"
            prefix={<SearchOutlined style={{ color: '#94A3B8' }} />}
            allowClear
            style={{
              width: 320,
              height: 44,
              borderRadius: 10,
            }}
            onPressEnter={(e) => setSearchText(e.target.value)}
            onChange={(e) => {
              if (!e.target.value) setSearchText('');
            }}
          />
          <Tooltip title="Refresh">
            <Button
              icon={<ReloadOutlined />}
              onClick={() =>
                fetchData(pagination.current, pagination.pageSize, searchText, sortField, sortOrder)
              }
              style={{ height: 44, width: 44, borderRadius: 10 }}
            />
          </Tooltip>
        </Space>
      </div>

      <Spin spinning={loading} delay={120}>
        <Card className="premium-card" styles={{ body: { padding: 8 } }}>
          <Table
            columns={columns}
            dataSource={data}
            rowKey="orderRefId"
            pagination={{
              ...pagination,
              style: { marginRight: 16 },
              showSizeChanger: true,
            }}
            onChange={handleTableChange}
            scroll={{ x: 960 }}
          />
        </Card>
      </Spin>

      <OrderDetailsDrawer
        open={drawerOpen}
        onClose={() => setDrawerOpen(false)}
        initialOrder={selectedOrder}
      />
    </div>
  );
};

export default TransactionsPage;
