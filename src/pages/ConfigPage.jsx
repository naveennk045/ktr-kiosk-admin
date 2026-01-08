import React, { useState, useEffect } from 'react';
import { Card, Form, Input, Button, Result, Popconfirm, message } from 'antd';
import { SaveOutlined, DeleteOutlined, ShopOutlined } from '@ant-design/icons';

const ConfigPage = () => {
  const [storeId, setStoreId] = useState(localStorage.getItem('KIOSK_STORE_ID'));
  const [form] = Form.useForm();

  useEffect(() => {
    const stored = localStorage.getItem('KIOSK_STORE_ID');
    if (stored) setStoreId(stored);
  }, []);

  const handleSave = (values) => {
    localStorage.setItem('KIOSK_STORE_ID', values.store_id);
    setStoreId(values.store_id);
    message.success('Store configuration saved successfully!');
  };

  const handleReset = () => {
    localStorage.removeItem('KIOSK_STORE_ID');
    setStoreId(null);
    form.resetFields();
    message.info('Configuration cleared.');
  };

  if (storeId) {
    return (
      <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100%', paddingTop: '50px' }}>
        <Result
          icon={<ShopOutlined />}
          status="success"
          title="Kiosk Configured"
          subTitle={`Current Store ID: ${storeId}`}
          extra={[
            <Popconfirm
              key="reset"
              title="Reset Configuration"
              description="Are you sure you want to decouple this device?"
              onConfirm={handleReset}
              okText="Yes"
              cancelText="No"
            >
              <Button type="primary" danger icon={<DeleteOutlined />}>
                Factory Reset
              </Button>
            </Popconfirm>
          ]}
        />
      </div>
    );
  }

  return (
    <div style={{ display: 'flex', justifyContent: 'center', paddingTop: '50px' }}>
      <Card title="Kiosk Initialization" style={{ width: 400 }} bordered={false} className="shadow-md">
        <Form form={form} layout="vertical" onFinish={handleSave}>
          <Form.Item
            name="store_id"
            label="Store ID"
            rules={[{ required: true, message: 'Please enter the Store ID' }]}
          >
            <Input placeholder="e.g. STORE-001" prefix={<ShopOutlined />} />
          </Form.Item>
          <Form.Item>
            <Button type="primary" htmlType="submit" icon={<SaveOutlined />} block>
              Save Configuration
            </Button>
          </Form.Item>
        </Form>
      </Card>
    </div>
  );
};

export default ConfigPage;
