import React from 'react';
import { Segmented, Tooltip, Typography } from 'antd';
import { ClockCircleOutlined } from '@ant-design/icons';
import { useDashboardPeriod, getPeriodSegmentedOptions } from '../context/DashboardPeriodContext';

const { Text } = Typography;

/**
 * Shared period filter for KPIs and order list (same `period` query as the API).
 */
const PeriodControl = ({ size = 'middle' }) => {
  const { period, setPeriod } = useDashboardPeriod();

  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 12, flexWrap: 'wrap' }}>
      <Tooltip title="Metrics and order dates use India Standard Time (IST) on the server.">
        <Text type="secondary" style={{ fontSize: 12, display: 'flex', alignItems: 'center', gap: 6 }}>
          <ClockCircleOutlined />
          Period
        </Text>
      </Tooltip>
      <Segmented
        size={size}
        value={period}
        onChange={setPeriod}
        options={getPeriodSegmentedOptions()}
      />
    </div>
  );
};

export default PeriodControl;
