import React, { createContext, useContext, useMemo, useState } from 'react';

/** Matches `GET /analytics/summary` and `GET /orders` — IST windows on the server. */
export const PERIOD_VALUES = ['today', 'yesterday', 'last_week', 'all_time'];

const LABELS = {
  today: 'Today',
  yesterday: 'Yesterday',
  last_week: 'Last 7 days',
  all_time: 'All time',
};

const DashboardPeriodContext = createContext(null);

export function DashboardPeriodProvider({ children }) {
  const [period, setPeriod] = useState('today');

  const value = useMemo(
    () => ({
      period,
      setPeriod,
      periodLabel: LABELS[period] ?? period,
    }),
    [period]
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
