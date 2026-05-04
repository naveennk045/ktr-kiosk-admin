import React from 'react';
import { Segmented, Tooltip, Typography, DatePicker } from 'antd';
import { ClockCircleOutlined } from '@ant-design/icons';
import dayjs from 'dayjs';
import { useDashboardPeriod, getPeriodSegmentedOptions } from '../context/DashboardPeriodContext';

const { Text } = Typography;
const { RangePicker } = DatePicker;

/**
 * Shared period filter for KPIs and order list (same `period` query as the API).
 */
const PeriodControl = ({ size = 'middle' }) => {
  const { period, setPeriod, fromDate, setFromDate, toDate, setToDate } = useDashboardPeriod();

  const handleRangeChange = (dates, dateStrings) => {
    if (dates) {
      setFromDate(dateStrings[0]);
      setToDate(dateStrings[1]);
    } else {
      setFromDate(null);
      setToDate(null);
    }
  };

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
      {period === 'custom_range' && (
        <RangePicker
          size={size}
          onChange={handleRangeChange}
          value={fromDate && toDate ? [dayjs(fromDate), dayjs(toDate)] : null}
          format="YYYY-MM-DD"
          allowClear
        />
      )}
    </div>
  );
};

export default PeriodControl;
