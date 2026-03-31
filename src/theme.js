import { theme } from 'antd';

/** Soft light theme — off-white surfaces, slate text, violet accent (not pure #FFF everywhere). */
export const modernTheme = {
  algorithm: theme.defaultAlgorithm,
  token: {
    colorPrimary: '#6366F1',
    colorBgBase: '#F1F5F9',
    colorBgContainer: '#FFFFFF',
    colorBgLayout: '#F1F5F9',
    borderRadius: 12,
    fontFamily: 'Plus Jakarta Sans, system-ui, sans-serif',
    colorText: '#0F172A',
    colorTextSecondary: '#64748B',
    colorTextHeading: '#0F172A',
    colorBorderSecondary: '#E2E8F0',
    boxShadow: '0 1px 3px 0 rgb(15 23 42 / 0.06), 0 1px 2px -1px rgb(15 23 42 / 0.06)',
  },
  components: {
    Layout: {
      bodyBg: '#F1F5F9',
      siderBg: '#FFFFFF',
      headerBg: 'transparent',
    },
    Card: {
      colorBgContainer: '#FFFFFF',
      boxShadow: '0 1px 3px 0 rgb(15 23 42 / 0.06)',
      lineWidth: 1,
      colorBorderSecondary: '#E2E8F0',
    },
    Table: {
      headerBg: '#F8FAFC',
      headerColor: '#64748B',
      rowHoverBg: '#F8FAFC',
      colorBorderSecondary: '#EEF2F7',
    },
    Menu: {
      itemBg: 'transparent',
      itemSelectedBg: 'rgba(99, 102, 241, 0.08)',
      itemColor: '#475569',
      itemSelectedColor: '#4F46E5',
      itemActiveBg: '#F1F5F9',
      itemHoverBg: '#F8FAFC',
    },
    Button: {
      borderRadius: 8,
      controlHeight: 40,
    },
    Segmented: {
      trackBg: '#EEF2F7',
    },
    Drawer: {
      colorBgElevated: '#FFFFFF',
    },
  },
};
