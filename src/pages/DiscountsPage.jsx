import React, { useState, useEffect } from 'react';
import { Card, Table, Button, Modal, Form, Input, Select, InputNumber, DatePicker, Switch, message, Tag, Space, Typography, Tooltip } from 'antd';
import { PlusOutlined, EditOutlined, DeleteOutlined, GiftOutlined } from '@ant-design/icons';
import dayjs from 'dayjs';
import api from '../api';
import { formatApiError } from '../utils/formatApiError';

const { Title } = Typography;
const { Option } = Select;
const { RangePicker } = DatePicker;

const DiscountsPage = () => {
  const [discounts, setDiscounts] = useState([]);
  const [loading, setLoading] = useState(false);
  const [modalVisible, setModalVisible] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [form] = Form.useForm();
  
  const [pagination, setPagination] = useState({ current: 1, pageSize: 10, total: 0 });

  const fetchDiscounts = async (page = 1, pageSize = 10) => {
    setLoading(true);
    try {
      const response = await api.get('/discounts', {
        params: { page, limit: pageSize, application_type: 'COUPON' }
      });
      // Assuming response.data contains items and total
      if (Array.isArray(response.data)) {
         setDiscounts(response.data);
         setPagination(prev => ({ ...prev, current: page, pageSize, total: response.data.length })); // Fallback if no total returned
      } else if (response.data && Array.isArray(response.data.items)) {
         setDiscounts(response.data.items);
         setPagination(prev => ({ ...prev, current: page, pageSize, total: response.data.total || response.data.items.length }));
      }
    } catch (error) {
      message.error(formatApiError(error));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDiscounts();
  }, []);

  const handleTableChange = (paginationResult) => {
    fetchDiscounts(paginationResult.current, paginationResult.pageSize);
  };

  const handleCreate = () => {
    setEditingId(null);
    form.resetFields();
    form.setFieldsValue({
      application_type: 'COUPON',
      discount_type: 'PERCENTAGE',
      is_active: true,
    });
    setModalVisible(true);
  };

  const handleEdit = (record) => {
    setEditingId(record.id);
    form.setFieldsValue({
      ...record,
      dates: record.start_date && record.end_date ? [dayjs(record.start_date), dayjs(record.end_date)] : null,
    });
    setModalVisible(true);
  };

  const handleStatusChange = async (checked, record) => {
    try {
      await api.patch(`/discounts/${record.id}/status`, { is_active: checked });
      message.success(`Discount ${checked ? 'activated' : 'deactivated'} successfully`);
      fetchDiscounts(pagination.current, pagination.pageSize);
    } catch (error) {
      message.error(formatApiError(error));
    }
  };

  const handleDelete = (id) => {
    Modal.confirm({
      title: 'Are you sure you want to delete this discount?',
      content: 'This action will soft delete the discount.',
      okText: 'Yes, Delete',
      okType: 'danger',
      cancelText: 'Cancel',
      onOk: async () => {
        try {
          await api.delete(`/discounts/${id}`);
          message.success('Discount deleted successfully');
          fetchDiscounts(pagination.current, pagination.pageSize);
        } catch (error) {
          message.error(formatApiError(error));
        }
      },
    });
  };

  const onFinish = async (values) => {
    try {
      const payload = {
        ...values,
        start_date: values.dates ? values.dates[0].toISOString() : null,
        end_date: values.dates ? values.dates[1].toISOString() : null,
      };
      delete payload.dates;

      if (editingId) {
        await api.put(`/discounts/${editingId}`, payload);
        message.success('Discount updated successfully');
      } else {
        await api.post('/discounts', payload);
        message.success('Discount created successfully');
      }
      setModalVisible(false);
      fetchDiscounts(pagination.current, pagination.pageSize);
    } catch (error) {
      message.error(formatApiError(error));
    }
  };

  const columns = [
    {
      title: 'Name',
      dataIndex: 'name',
      key: 'name',
      render: (text) => <strong>{text}</strong>,
    },
    {
      title: 'Code',
      dataIndex: 'code',
      key: 'code',
      render: (text) => <Tag color="blue">{text}</Tag>,
    },
    {
      title: 'Discount Type',
      dataIndex: 'discount_type',
      key: 'discount_type',
    },
    {
      title: 'Value',
      dataIndex: 'value',
      key: 'value',
      render: (val, record) => {
        if (record.discount_type === 'PERCENTAGE') return `${val}%`;
        return `₹${val}`;
      }
    },
    {
      title: 'Min Order Amount',
      dataIndex: 'min_order_amount',
      key: 'min_order_amount',
      render: (val) => val ? `₹${val}` : '-',
    },
    {
      title: 'Usage Limit',
      dataIndex: 'usage_limit',
      key: 'usage_limit',
      render: (val) => val || 'Unlimited',
    },
    {
      title: 'Status',
      dataIndex: 'is_active',
      key: 'is_active',
      render: (isActive, record) => (
        <Switch 
          checked={isActive} 
          onChange={(checked) => handleStatusChange(checked, record)} 
        />
      ),
    },
    {
      title: 'Actions',
      key: 'actions',
      render: (_, record) => (
        <Space size="middle">
          <Tooltip title="Edit">
            <Button type="text" icon={<EditOutlined />} onClick={() => handleEdit(record)} />
          </Tooltip>
          <Tooltip title="Delete">
            <Button type="text" danger icon={<DeleteOutlined />} onClick={() => handleDelete(record.id)} />
          </Tooltip>
        </Space>
      ),
    },
  ];

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
        <Title level={4} style={{ margin: 0 }}>
          <GiftOutlined style={{ marginRight: 8, color: '#6366F1' }} />
          Discount Management
        </Title>
        <Button type="primary" icon={<PlusOutlined />} onClick={handleCreate}>
          Create Coupon
        </Button>
      </div>

      <Card bordered={false} className="shadow-md">
        <Table
          columns={columns}
          dataSource={discounts}
          rowKey="id"
          loading={loading}
          pagination={pagination}
          onChange={handleTableChange}
        />
      </Card>

      <Modal
        title={editingId ? 'Edit Coupon' : 'Create New Coupon'}
        open={modalVisible}
        onCancel={() => setModalVisible(false)}
        footer={null}
        destroyOnClose
        width={600}
      >
        <Form
          form={form}
          layout="vertical"
          onFinish={onFinish}
          initialValues={{ is_active: true, application_type: 'COUPON', discount_type: 'PERCENTAGE' }}
        >
          <Form.Item
            name="name"
            label="Name (Description)"
            rules={[{ required: true, message: 'Please enter a name' }]}
          >
            <Input placeholder="e.g. Welcome Offer" />
          </Form.Item>

          <Form.Item
            name="code"
            label="Coupon Code"
            rules={[{ required: true, message: 'Please enter a coupon code' }]}
          >
            <Input placeholder="e.g. WELCOME10" style={{ textTransform: 'uppercase' }} />
          </Form.Item>

          <Form.Item name="application_type" hidden>
            <Input />
          </Form.Item>

          <div style={{ display: 'flex', gap: 16 }}>
            <Form.Item
              name="discount_type"
              label="Discount Type"
              style={{ flex: 1 }}
              rules={[{ required: true }]}
            >
              <Select>
                <Option value="PERCENTAGE">Percentage (%)</Option>
                <Option value="FIXED_AMOUNT">Fixed Amount (₹)</Option>
              </Select>
            </Form.Item>

            <Form.Item
              name="value"
              label="Discount Value"
              style={{ flex: 1 }}
              rules={[{ required: true, message: 'Required' }]}
            >
              <InputNumber style={{ width: '100%' }} min={0} />
            </Form.Item>
          </div>

          <div style={{ display: 'flex', gap: 16 }}>
            <Form.Item
              name="min_order_amount"
              label="Minimum Order Amount (₹)"
              style={{ flex: 1 }}
            >
              <InputNumber style={{ width: '100%' }} min={0} />
            </Form.Item>

            <Form.Item
              name="max_discount_amount"
              label="Max Discount Amount (₹)"
              style={{ flex: 1 }}
            >
              <InputNumber style={{ width: '100%' }} min={0} />
            </Form.Item>
          </div>

          <Form.Item
            name="usage_limit"
            label="Total Usage Limit (Leave blank for unlimited)"
          >
            <InputNumber style={{ width: '100%' }} min={1} />
          </Form.Item>

          <Form.Item
            name="dates"
            label="Validity Period"
            rules={[{ required: true, message: 'Please select start and end dates' }]}
          >
            <RangePicker style={{ width: '100%' }} showTime />
          </Form.Item>

          <Form.Item name="is_active" valuePropName="checked">
            <Switch checkedChildren="Active" unCheckedChildren="Inactive" />
          </Form.Item>

          <Form.Item style={{ marginBottom: 0, textAlign: 'right' }}>
            <Space>
              <Button onClick={() => setModalVisible(false)}>Cancel</Button>
              <Button type="primary" htmlType="submit">
                {editingId ? 'Update' : 'Create'}
              </Button>
            </Space>
          </Form.Item>
        </Form>
      </Modal>
    </div>
  );
};

export default DiscountsPage;
