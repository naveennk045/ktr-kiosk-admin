import { theme } from 'antd';

export const modernTheme = {
  algorithm: theme.defaultAlgorithm, // Light mode
  token: {
    colorPrimary: '#6C5DD3', // Keep vibrant purple as primary
    colorBgBase: '#ffffff', // White base
    colorBgContainer: '#ffffff', // White containers
    colorBgLayout: '#F4F5F7', // Light gray background for layout
    borderRadius: 16,
    fontFamily: 'Instrument Sans, Inter, system-ui, sans-serif',
    colorTextHeading: '#1A1D1F', // Dark text for headings
    colorText: '#1A1D1F', // Dark text for body
  },
  components: {
    Layout: {
      bodyBg: '#F4F5F7',
      siderBg: '#ffffff',
    },
    Card: {
      boxShadow: '0px 4px 20px rgba(0, 0, 0, 0.05)', // Soft shadow for cards
      lineWidth: 0,
    },
    Table: {
      headerBg: '#FAFAFA',
      headerColor: '#6F767E',
      rowHoverBg: '#F4F5F7',
    },
    Menu: {
      itemBg: '#ffffff',
      itemSelectedBg: '#F4F5F7',
      itemColor: '#1A1D1F',
      itemSelectedColor: '#6C5DD3',
    }
  },
};
