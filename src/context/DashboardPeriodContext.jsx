import React, { createContext, useContext, useMemo, useState } from 'react';

/** Matches `GET /analytics/summary` and `GET /orders` — IST windows on the server. */
export const PERIOD_VALUES = ['today', 'yesterday', 'last_week', 'all_time', 'custom_range'];

const LABELS = {
  today: 'Today',
  yesterday: 'Yesterday',
  last_week: 'Last 7 days',
  all_time: 'All time',
  custom_range: 'Custom Range',
};

const DashboardPeriodContext = createContext(null);

export function DashboardPeriodProvider({ children }) {
  const [period, setPeriod] = useState('today');
  // Both strings in YYYY-MM-DD format
  const [fromDate, setFromDate] = useState(null);
  const [toDate, setToDate] = useState(null);

  const value = useMemo(
    () => ({
      period,
      setPeriod,
      fromDate,
      setFromDate,
      toDate,
      setToDate,
      periodLabel: LABELS[period] ?? period,
    }),
    [period, fromDate, toDate]
  );

  return (
    <DashboardPeriodContext.Provider value={value}>{children}</DashboardPeriodContext.Provider>
  );
}

export function useDashboardPeriod() {
  const ctx = useContext(DashboardPeriodContext);
  if (!ctx) {
    throw new Error('useDashboardPeriod must be used within DashboardPeriodProvider');
  }
  return ctx;
}

export function getPeriodSegmentedOptions() {
  return PERIOD_VALUES.map((value) => ({ label: LABELS[value], value }));
}
