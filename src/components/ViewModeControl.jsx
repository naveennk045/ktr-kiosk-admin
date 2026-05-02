import React, { useEffect, useState } from 'react';
import { Segmented, Select, Space, Typography } from 'antd';
import api from '../api';
import { useStoreView } from '../context/StoreViewContext';

const { Text } = Typography;

const ViewModeControl = () => {
  const { viewMode, setViewMode, selectedStoreCodes, setSelectedStoreCodes } = useStoreView();
  const [storeOptions, setStoreOptions] = useState([]);

  useEffect(() => {
    let cancelled = false;
    const load = async () => {
      try {
        const res = await api.get('/admin/stores', { params: { active_only: true } });
        const rows = Array.isArray(res.data) ? res.data : [];
        if (!cancelled) {
          setStoreOptions(
            rows.map((s) => ({
              value: s.store_code,
              label: `${s.store_name} (${s.store_code})`,
            }))
          );
        }
      } catch {
        if (!cancelled) setStoreOptions([]);
      }
    };
    load();
    return () => {
      cancelled = true;
    };
  }, []);

  return (
    <Space size={10} wrap align="center">
      <Text type="secondary" style={{ fontSize: 12 }}>
        View
      </Text>
      <Segmented
        value={viewMode}
        onChange={setViewMode}
        options={[
          { label: 'Single store', value: 'single' },
          { label: 'Multi store', value: 'multi' },
        ]}
      />
      {viewMode === 'multi' ? (
        <Select
          mode="multiple"
          style={{ minWidth: 280 }}
          placeholder="Filter stores (optional)"
          value={selectedStoreCodes}
          onChange={setSelectedStoreCodes}
          options={storeOptions}
          maxTagCount="responsive"
        />
      ) : null}
    </Space>
  );
};

export default ViewModeControl;

