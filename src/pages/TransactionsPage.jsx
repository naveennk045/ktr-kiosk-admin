import React, { useState, useEffect } from 'react';
import { Table, Tag, Badge, Input, Button, Card, message } from 'antd';
import { SearchOutlined, EyeOutlined } from '@ant-design/icons';
import api from '../api';
import OrderDetailsDrawer from '../components/OrderDetailsDrawer';

const TransactionsPage = () => {
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(false);
  const [pagination, setPagination] = useState({ current: 1, pageSize: 20, total: 0 });
  const [searchText, setSearchText] = useState('');
  const [selectedOrder, setSelectedOrder] = useState(null);
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [sortField, setSortField] = useState('created_at');
  const [sortOrder, setSortOrder] = useState('desc');

  const fetchData = async (page = 1, pageSize = 20, search = '', sort = 'created_at', dir = 'desc') => {
    setLoading(true);
    try {
      if (search) {
        // Search by ID using the detail endpoint as requested
        try {
          const response = await api.get(`/orders/${search}`);
          // The endpoint returns a single object, wrap it in array
          setData([response.data]);
          setPagination({
            current: 1,
            pageSize: 20, // arbitrary
            total: 1
          });
        } catch (error) {
          // If 404 or other error, likely not found
          console.warn("Search failed", error);
          setData([]);
          setPagination({ current: 1, pageSize: 20, total: 0 });
          if (error.response && error.response.status === 404) {
            message.warning("Order not found");
          }
        }
      } else {
        // Normal list fetch
        const params = {
          page: page - 1, // API is 0-indexed
          size: pageSize,
          sortBy: sort,
          sortDir: dir,
        };
        const response = await api.get('/orders', { params });
        setData(response.data.content);
        setPagination({
          current: page,
          pageSize: pageSize,
          total: response.data.totalElements
        });
      }
    } catch (error) {
      console.error("Fetch orders failed", error);
      message.error("Failed to fetch orders");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData(1, pagination.pageSize, searchText, sortField, sortOrder);
  }, [searchText]);

  const handleTableChange = (newPagination, filters, sorter) => {
    // We only fetch new data on pagination or sorting changes,
    // filtering is local (onFilter) so we don't reload from server for it.

    // Check if pagination/sort actually changed or if it's just a filter event
    const sortChanged = sorter.field !== sortField || (sorter.order === 'ascend' ? 'asc' : 'desc') !== sortOrder;
    const pageChanged = newPagination.current !== pagination.current || newPagination.pageSize !== pagination.pageSize;

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
      key: 'order_id', // sort key
    },
    {
      title: 'Location',
      dataIndex: 'location',
      key: 'location',
    },
    {
      title: 'Date',
      dataIndex: 'createdAt',
      key: 'created_at',
      render: (text) => new Date(text).toLocaleString(),
      sorter: true,
    },
    {
      title: 'Amount',
      dataIndex: 'amount',
      key: 'total_amount', // sort key
      align: 'right',
      render: (amount) => `₹${Number(amount).toFixed(2)}`,
      sorter: true,
    },
    {
      title: 'Payment Status',
      dataIndex: 'paymentStatus',
      key: 'paymentStatus',
      filters: [
        { text: 'COMPLETED', value: 'COMPLETED' },
        { text: 'PENDING', value: 'PENDING' },
        { text: 'FAILED', value: 'FAILED' },
      ],
      onFilter: (value, record) => record.paymentStatus === value,
      render: (status) => {
        let badgeStatus = 'default';
        if (status === 'COMPLETED') badgeStatus = 'success';
        if (status === 'PENDING') badgeStatus = 'processing';
        if (status === 'FAILED') badgeStatus = 'error';
        return <Badge status={badgeStatus} text={status} />;
      },
    },
    {
      title: 'ERP Status',
      dataIndex: 'erpStatus',
      key: 'erpStatus',
      filters: [
        { text: 'POSTED', value: 'POSTED' },
        { text: 'NOT_POSTED', value: 'NOT_POSTED' },
        { text: 'FAILED', value: 'FAILED' },
      ],
      onFilter: (value, record) => record.erpStatus === value,
      render: (status) => (
        <Tag color={status === 'POSTED' ? 'success' : 'red'}>
          {status}
        </Tag>
      ),
    },
    {
      title: 'Action',
      key: 'action',
      render: (_, record) => (
        <Button
          type="link"
          icon={<EyeOutlined />}
          onClick={() => {
            setSelectedOrder(record); // Pass the summary object, Drawer will fetch details if needed
            setDrawerOpen(true);
          }}
        >
          View
        </Button>
      ),
    },
  ];

  return (
    <div style={{ paddingBottom: 24 }}>
      <Card bordered={false} title="Transaction History" extra={
        <Input
          placeholder="Search Order ID"
          prefix={<SearchOutlined />}
          onPressEnter={e => setSearchText(e.target.value)}
          onChange={e => { if (!e.target.value) setSearchText('') }} // clear search
          style={{ width: 300, backgroundColor: '#fff', color: '#000' }}
        />
      }>
        <Table
          columns={columns}
          dataSource={data}
          rowKey="orderRefId"
          pagination={pagination}
          loading={loading}
          onChange={handleTableChange}
          rowClassName={(record) => record.paymentStatus === 'PENDING' ? 'bg-warning-dim' : ''}
        />
      </Card>

      <OrderDetailsDrawer
        open={drawerOpen}
        onClose={() => setDrawerOpen(false)}
        initialOrder={selectedOrder}
      />
    </div>
  );
};

export default TransactionsPage;
