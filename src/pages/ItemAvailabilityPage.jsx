import React, { useState, useEffect } from 'react';
import { Table, Switch, Input, Card, Typography, Space, Tag, message, Spin } from 'antd';
import { SearchOutlined, CheckCircleOutlined, CloseCircleOutlined } from '@ant-design/icons';
import api from '../api';

const { Title, Text } = Typography;

const ItemAvailabilityPage = () => {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchText, setSearchText] = useState('');
  const [updatingIds, setUpdatingIds] = useState(new Set());

  const fetchData = async () => {
    setLoading(true);
    try {
      // 1. Fetch full catalog
      const catalogRes = await api.get('/catalog?channel=ADMIN');
      const catalogItems = catalogRes.data.items || [];

      // 2. Fetch overrides
      const overridesRes = await api.get('/admin/catalog/availability');
      const overrides = overridesRes.data || [];

      // Combine data
      // Map overrides for quick lookup
      const overrideMap = new Map(overrides.map(o => [o.sku_code, o.is_available]));

      const processedItems = catalogItems.map(item => {
        const overrideValue = overrideMap.get(item.itemId); // Backend says itemId maps to skuCode
        return {
          ...item,
          key: item.itemId,
          current_availability: overrideValue !== undefined ? overrideValue : (item.status === 'Active')
        };
      });

      setItems(processedItems);
    } catch (err) {
      console.error('Failed to fetch data', err);
      message.error('Failed to load catalog data');
      
      // Fallback/Mock for testing if API fails
      setItems([
        { itemId: '10550557', itemName: 'Masala Dosa', categoryName: 'Breakfast', current_availability: true },
        { itemId: '10550558', itemName: 'Idli Vada', categoryName: 'Breakfast', current_availability: false },
      ]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleToggle = async (itemId, checked) => {
    setUpdatingIds(prev => new Set(prev).add(itemId));
    try {
      await api.post('/admin/catalog/availability', {
        sku_code: itemId,
        is_available: checked
      });
      
      setItems(prev => prev.map(item => 
        item.itemId === itemId ? { ...item, current_availability: checked } : item
      ));
      
      message.success(`${checked ? 'Enabled' : 'Disabled'} item successfully`);
    } catch (err) {
      console.error('Toggle failed', err);
      message.error('Failed to update availability');
    } finally {
      setUpdatingIds(prev => {
        const next = new Set(prev);
        next.delete(itemId);
        return next;
      });
    }
  };

  const filteredItems = items.filter(item => 
    item.itemName.toLowerCase().includes(searchText.toLowerCase()) ||
    (item.skuCode && item.skuCode.toLowerCase().includes(searchText.toLowerCase())) ||
    item.itemId.toLowerCase().includes(searchText.toLowerCase())
  );

  const columns = [
    {
      title: 'Item Name',
      dataIndex: 'itemName',
      key: 'itemName',
      render: (text) => <Text strong>{text}</Text>,
      sorter: (a, b) => a.itemName.localeCompare(b.itemName),
    },
    {
      title: 'Category',
      dataIndex: 'categoryName',
      key: 'categoryName',
      render: (text) => <Tag color="blue">{text}</Tag>,
      filters: Array.from(new Set(items.map(i => i.categoryName))).map(c => ({ text: c, value: c })),
      onFilter: (value, record) => record.categoryName === value,
    },
    {
      title: 'SKU / ID',
      dataIndex: 'itemId',
      key: 'itemId',
      render: (text) => <Text type="secondary">{text}</Text>,
    },
    {
      title: 'Status',
      key: 'status',
      render: (_, record) => (
        record.current_availability ? 
        <Tag icon={<CheckCircleOutlined />} color="success">Available</Tag> : 
        <Tag icon={<CloseCircleOutlined />} color="error">Sold Out</Tag>
      ),
    },
    {
      title: 'Action',
      key: 'action',
      render: (_, record) => (
        <Space size="middle">
          <Switch 
            checked={record.current_availability} 
            onChange={(checked) => handleToggle(record.itemId, checked)}
            loading={updatingIds.has(record.itemId)}
          />
          <Text>{record.current_availability ? 'ON' : 'OFF'}</Text>
        </Space>
      ),
    },
  ];

  return (
    <div style={{ padding: '0 0 24px 0' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 32 }}>
        <div>
          <Title level={2} style={{ margin: 0, color: '#1A1D1F', fontSize: '28px', fontWeight: 700 }}>Item Availability</Title>
          <Text style={{ color: '#6F767E' }}>Manage menu items status in real-time</Text>
        </div>
        <Input
          placeholder="Search items by name or SKU..."
          prefix={<SearchOutlined style={{ color: '#6F767E' }} />}
          style={{ width: 350, height: 48, borderRadius: 12 }}
          onChange={e => setSearchText(e.target.value)}
        />
      </div>

      <Card style={{ borderRadius: 16, border: 'none', boxShadow: '0 4px 12px rgba(0,0,0,0.03)' }}>
        <Table 
          columns={columns} 
          dataSource={filteredItems} 
          loading={loading}
          pagination={{ pageSize: 10, showSizeChanger: true }}
          responsive={['xs', 'sm', 'md', 'lg']}
        />
      </Card>
    </div>
  );
};

export default ItemAvailabilityPage;
