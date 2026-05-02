import React, { useState, useEffect } from 'react';
import { Card, Form, Button, message, Select, Spin, Typography, Segmented } from 'antd';
import { SaveOutlined } from '@ant-design/icons';
import api from '../api';
import { formatApiError } from '../utils/formatApiError';

const { Text } = Typography;

const ConfigPage = () => {
  const [viewMode, setViewMode] = useState(localStorage.getItem('KTR_ONE_VIEW_MODE') || 'single');
  const [storeId, setStoreId] = useState(localStorage.getItem('KIOSK_STORE_ID') || undefined);
  const [multiStoreCodes, setMultiStoreCodes] = useState(
    String(localStorage.getItem('KTR_ONE_MULTI_STORE_CODES') || '')
      .split(',')
      .map((v) => v.trim())
      .filter(Boolean)
  );
  const [stores, setStores] = useState([]);
  const [loadingStores, setLoadingStores] = useState(false);
  const [form] = Form.useForm();

  const loadStores = async () => {
    setLoadingStores(true);
    try {
      const response = await api.get('/admin/stores', { params: { active_only: true } });
      const list = Array.isArray(response.data) ? response.data : [];
      setStores(list);
    } catch (error) {
      message.error(formatApiError(error));
      setStores([]);
    } finally {
      setLoadingStores(false);
    }
  };

  useEffect(() => {
    form.setFieldsValue({
      store_id: storeId,
      store_codes: multiStoreCodes,
    });
    loadStores();
  }, [form, storeId, multiStoreCodes]);

  const handleSave = (values) => {
    localStorage.setItem('KTR_ONE_VIEW_MODE', viewMode);
    if (viewMode === 'single') {
      const selected = stores.find((entry) => String(entry.store_id) === String(values.store_id));
      localStorage.setItem('KIOSK_STORE_ID', String(values.store_id));
      localStorage.setItem('KIOSK_STORE_CODE', String(selected?.store_code || ''));
      localStorage.setItem('KIOSK_STORE_NAME', String(selected?.store_name || ''));
      localStorage.removeItem('KTR_ONE_MULTI_STORE_CODES');
      setStoreId(String(values.store_id));
      setMultiStoreCodes([]);
      message.success('Single store view configured.');
      return;
    }
    const codes = Array.isArray(values.store_codes) ? values.store_codes : [];
    localStorage.setItem('KTR_ONE_MULTI_STORE_CODES', codes.join(','));
    setMultiStoreCodes(codes);
    message.success('Multi-store view configured.');
  };

  return (
    <div style={{ display: 'flex', justifyContent: 'center', paddingTop: '50px' }}>
      <Card title="KTR-ONE View Settings" style={{ width: 560 }} bordered={false} className="shadow-md">
        <Form form={form} layout="vertical" onFinish={handleSave}>
          <Form.Item label="View mode">
            <Segmented
              value={viewMode}
              onChange={setViewMode}
              options={[
                { label: 'Single store', value: 'single' },
                { label: 'Multi store', value: 'multi' },
              ]}
            />
          </Form.Item>

          {viewMode === 'single' ? (
            <Form.Item
              name="store_id"
              label="Store"
              rules={[{ required: true, message: 'Please select one store' }]}
            >
              <Select
                loading={loadingStores}
                placeholder="Select store"
                options={stores.map((store) => ({
                  value: String(store.store_id),
                  label: `${store.store_name} (${store.store_code})`,
                }))}
              />
            </Form.Item>
          ) : (
            <Form.Item name="store_codes" label="Stores (optional filter)">
              <Select
                mode="multiple"
                loading={loadingStores}
                placeholder="Select one or more stores"
                options={stores.map((store) => ({
                  value: String(store.store_code),
                  label: `${store.store_name} (${store.store_code})`,
                }))}
                maxTagCount="responsive"
              />
            </Form.Item>
          )}

          <Card size="small" style={{ marginBottom: 16, background: '#F8FAFC' }}>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
              <Text strong>How this works</Text>
              <Text type="secondary">Single store: uses store-scoped endpoints with `X-Store-Id`.</Text>
              <Text type="secondary">Multi store: uses owner endpoints like `/admin/analytics/*` and `/admin/transactions`.</Text>
            </div>
          </Card>

          {loadingStores ? <Spin size="small" style={{ marginBottom: 12 }} /> : null}
          <Form.Item
          >
            <Button type="primary" htmlType="submit" icon={<SaveOutlined />} block>
              Save Settings
            </Button>
          </Form.Item>
        </Form>
      </Card>
    </div>
  );
};

export default ConfigPage;
