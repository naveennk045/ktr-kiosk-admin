import React, { useState } from 'react';
import { BrowserRouter as Router, Routes, Route, Link, useLocation } from 'react-router-dom';
import { Layout, Menu, ConfigProvider, Button } from 'antd';
import { DashboardOutlined, UserOutlined, UnorderedListOutlined } from '@ant-design/icons';
import TransactionsPage from './pages/TransactionsPage';
import DashboardPage from './pages/DashboardPage';
import ItemAvailabilityPage from './pages/ItemAvailabilityPage';
import { modernTheme } from './theme';

const { Header, Sider, Content } = Layout;

const AppLayout = () => {
  const [collapsed, setCollapsed] = useState(false);
  const location = useLocation();

  const menuItems = [
    {
      key: '/',
      icon: <DashboardOutlined />,
      label: <Link to="/">Dashboard</Link>,
    },
    {
      key: '/availability',
      icon: <UnorderedListOutlined />,
      label: <Link to="/availability">Item Availability</Link>,
    },
    {
      key: '/transactions',
      icon: <UnorderedListOutlined />,
      label: <Link to="/transactions">Transactions</Link>,
    },
  ];

  return (
    <Layout style={{ minHeight: '100vh', background: '#F4F5F7' }}>
      <Sider
        collapsible
        collapsed={collapsed}
        onCollapse={(value) => setCollapsed(value)}
        theme="light"
        style={{
          borderRight: '1px solid #EFEFEF',
          boxShadow: '4px 0 24px rgba(0,0,0,0.02)'
        }}
        trigger={null}
      >
        <div style={{ height: 80, display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#1A1D1F', fontWeight: 800, fontSize: '20px', letterSpacing: '1px' }}>
          {collapsed ? 'K' : 'KTR ADMIN'}
        </div>
        <Menu
          theme="light"
          defaultSelectedKeys={['/']}
          selectedKeys={[location.pathname]}
          mode="inline"
          items={menuItems}
          style={{ borderRight: 0, fontSize: '15px', fontWeight: 500 }}
        />
      </Sider>
      <Layout style={{ background: '#F4F5F7' }}>
        <Header style={{ padding: '0 32px', background: 'transparent', display: 'flex', justifyContent: 'flex-end', alignItems: 'center', borderBottom: 'none', height: 80 }} >
          <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
            <Button type="text" icon={<UserOutlined />} style={{ color: '#1A1D1F', fontSize: '16px', fontWeight: 500 }}>Admin</Button>
          </div>
        </Header>
        <Content style={{ margin: '0 32px 32px 32px', overflowY: 'auto' }}>
          <Routes>
            <Route path="/" element={<DashboardPage />} />
            <Route path="/availability" element={<ItemAvailabilityPage />} />
            <Route path="/transactions" element={<TransactionsPage />} />
          </Routes>
        </Content>
      </Layout>
    </Layout>
  );
};

const App = () => {
  return (
    <ConfigProvider theme={modernTheme}>
      <Router>
        <AppLayout />
      </Router>
    </ConfigProvider>
  );
};

export default App;
