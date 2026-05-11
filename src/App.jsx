import React, { useState } from 'react';
import { BrowserRouter as Router, Routes, Route, Link, useLocation } from 'react-router-dom';
import { Layout, Menu, ConfigProvider, Button } from 'antd';
import {
  DashboardOutlined,
  ThunderboltFilled,
  MenuUnfoldOutlined,
  MenuFoldOutlined,
  TransactionOutlined,
  SettingOutlined,
  FileTextOutlined,
  ShoppingOutlined,
  BankOutlined,
  BookOutlined,
  RocketOutlined,
} from '@ant-design/icons';
import TransactionsPage from './pages/TransactionsPage';
import DashboardPage from './pages/DashboardPage';
import ConfigPage from './pages/ConfigPage';
import LogsPage from './pages/LogsPage';
import ItemAnalysisPage from './pages/ItemAnalysisPage';
import AccountingPage from './pages/AccountingPage';
import UserDocsPage from './pages/UserDocsPage';
import LiveMenuPage from './pages/LiveMenuPage';
import PeriodControl from './components/PeriodControl';
import StoreSwitcher from './components/StoreSwitcher';
import { DashboardPeriodProvider } from './context/DashboardPeriodContext';
import { StoreViewProvider } from './context/StoreViewContext';
import { modernTheme } from './theme';

const { Header, Content } = Layout;

const AppLayout = () => {
  const [siderPinned, setSiderPinned] = useState(false);
  const [siderHover, setSiderHover] = useState(false);
  const location = useLocation();
  const collapsed = !(siderPinned || siderHover);

  const menuItems = [
    {
      key: '/',
      icon: <DashboardOutlined style={{ fontSize: '18px' }} />,
      label: <Link to="/">Dashboard</Link>,
    },
    {
      key: '/live-menu',
      icon: <RocketOutlined style={{ fontSize: '18px' }} />,
      label: <Link to="/live-menu">Live Menu</Link>,
    },
    {
      key: '/transactions',
      icon: <TransactionOutlined style={{ fontSize: '18px' }} />,
      label: <Link to="/transactions">Transactions</Link>,
    },
    {
      key: '/items',
      icon: <ShoppingOutlined style={{ fontSize: '18px' }} />,
      label: <Link to="/items">Item Analysis</Link>,
    },
    {
      key: '/accounting',
      icon: <BankOutlined style={{ fontSize: '18px' }} />,
      label: <Link to="/accounting">Accounting</Link>,
    },
    {
      key: '/logs',
      icon: <FileTextOutlined style={{ fontSize: '18px' }} />,
      label: <Link to="/logs">Logs</Link>,
    },
    {
      key: '/config',
      icon: <SettingOutlined style={{ fontSize: '18px' }} />,
      label: <Link to="/config">Config</Link>,
    },
    {
      key: '/docs',
      icon: <BookOutlined style={{ fontSize: '18px' }} />,
      label: <Link to="/docs">Documentation</Link>,
    },
  ];

  return (
    <Layout style={{ minHeight: '100vh', background: '#F1F5F9' }}>
      <Layout.Sider
        collapsible
        collapsed={collapsed}
        theme="light"
        width={260}
        style={{
          background: '#FFFFFF',
          borderRight: '1px solid #E2E8F0',
          position: 'fixed',
          height: '100vh',
          left: 0,
          zIndex: 100,
        }}
        trigger={null}
        onMouseEnter={() => setSiderHover(true)}
        onMouseLeave={() => setSiderHover(false)}
      >
        <div
          style={{
            height: 72,
            display: 'flex',
            alignItems: 'center',
            padding: '0 24px',
            color: '#0F172A',
            fontWeight: 800,
            fontSize: '18px',
            letterSpacing: '0.5px',
            borderBottom: '1px solid #F1F5F9',
          }}
        >
          <ThunderboltFilled style={{ color: '#6366F1', marginRight: 12, fontSize: '22px' }} />
          {!collapsed && (
            <span>
              KTR-<span style={{ color: '#6366F1' }}>ONE</span>
            </span>
          )}
        </div>

        <div style={{ padding: '0 12px' }}>
          <Menu
            theme="light"
            selectedKeys={[location.pathname]}
            mode="inline"
            items={menuItems}
            style={{
              background: 'transparent',
              borderRight: 0,
              marginTop: 12,
            }}
          />
        </div>

        <div
          style={{
            position: 'absolute',
            bottom: 24,
            width: '100%',
            padding: '0 16px',
            opacity: collapsed ? 0 : 1,
            transition: 'opacity 0.3s',
          }}
        >
          <div
            style={{
              background: 'rgba(99, 102, 241, 0.06)',
              padding: 14,
              borderRadius: 12,
              border: '1px solid rgba(99, 102, 241, 0.15)',
            }}
          >
            <p style={{ margin: 0, color: '#0F172A', fontSize: '12px', fontWeight: 600 }}>Pro Support</p>
            <p style={{ margin: '4px 0 0 0', color: '#64748B', fontSize: '11px' }}>Priority access</p>
          </div>
        </div>
      </Layout.Sider>

      <Layout
        style={{
          marginLeft: collapsed ? 80 : 260,
          transition: 'margin-left 0.2s',
          background: 'transparent',
        }}
      >
        <Header
          className="glass-panel"
          style={{
            margin: '12px 24px',
            borderRadius: 14,
            padding: '0 20px',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            minHeight: 64,
            height: 'auto',
            paddingTop: 12,
            paddingBottom: 12,
            position: 'sticky',
            top: 12,
            zIndex: 99,
            flexWrap: 'wrap',
            gap: 12,
          }}
        >
          {/* ── Left: hamburger + store switcher ── */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <Button
              type="text"
              icon={collapsed ? <MenuUnfoldOutlined /> : <MenuFoldOutlined />}
              onClick={() => setSiderPinned((prev) => !prev)}
              style={{ color: '#475569', fontSize: '18px' }}
            />
            <StoreSwitcher />
          </div>

          {/* ── Right: period control ── */}
          <PeriodControl />
        </Header>

        <Content style={{ margin: '0 24px 32px 24px', minHeight: 280 }} className="animate-fade-in">
          <Routes>
            <Route path="/" element={<DashboardPage />} />
            <Route path="/live-menu" element={<LiveMenuPage />} />
            <Route path="/transactions" element={<TransactionsPage />} />
            <Route path="/items" element={<ItemAnalysisPage />} />
            <Route path="/accounting" element={<AccountingPage />} />
            <Route path="/logs" element={<LogsPage />} />
            <Route path="/config" element={<ConfigPage />} />
            <Route path="/docs" element={<UserDocsPage />} />
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
        <DashboardPeriodProvider>
          <StoreViewProvider>
            <AppLayout />
          </StoreViewProvider>
        </DashboardPeriodProvider>
      </Router>
    </ConfigProvider>
  );
};

export default App;
