import React, { useState } from 'react';
import { BrowserRouter as Router, Routes, Route, Link, Navigate, useLocation } from 'react-router-dom';
import { Layout, Menu, ConfigProvider, Button, Spin, Tooltip } from 'antd';
import {
  DashboardOutlined,
  MenuUnfoldOutlined,
  MenuFoldOutlined,
  TransactionOutlined,
  SettingOutlined,
  FileTextOutlined,
  ShoppingOutlined,
  BankOutlined,
  BookOutlined,
  RocketOutlined,
  GiftOutlined,
  BulbOutlined,
  FireOutlined,
  LogoutOutlined,
  UserOutlined,
} from '@ant-design/icons';
import TransactionsPage from './pages/TransactionsPage';
import DashboardPage from './pages/DashboardPage';
import ConfigPage from './pages/ConfigPage';
import LogsPage from './pages/LogsPage';
import ItemAnalysisPage from './pages/ItemAnalysisPage';
import InsightsPage from './pages/InsightsPage';
import AccountingPage from './pages/AccountingPage';
import UserDocsPage from './pages/UserDocsPage';
import LiveMenuPage from './pages/LiveMenuPage';
import DiscountsPage from './pages/DiscountsPage';
import LiveOrdersPage from './pages/LiveOrdersPage';
import LoginPage from './pages/LoginPage';
import PeriodControl from './components/PeriodControl';
import StoreSwitcher from './components/StoreSwitcher';
import { DashboardPeriodProvider } from './context/DashboardPeriodContext';
import { StoreViewProvider } from './context/StoreViewContext';
import { AuthProvider, useAuth } from './context/AuthContext';
import { ktrTheme } from './theme';

const { Header, Content } = Layout;

const item = (key, label, icon) => ({
  key,
  icon: React.cloneElement(icon, { style: { fontSize: 18 } }),
  label: <Link to={key}>{label}</Link>,
  title: label,
});

const MENU_ITEMS = [
  {
    type: 'group',
    key: 'g-today',
    label: 'Today',
    children: [item('/', 'Dashboard', <DashboardOutlined />), item('/live', 'Live Orders', <FireOutlined />)],
  },
  {
    type: 'group',
    key: 'g-sales',
    label: 'Sales',
    children: [
      item('/transactions', 'Transactions', <TransactionOutlined />),
      item('/accounting', 'Accounting', <BankOutlined />),
      item('/discounts', 'Discounts', <GiftOutlined />),
    ],
  },
  {
    type: 'group',
    key: 'g-menu',
    label: 'Menu & insights',
    children: [
      item('/live-menu', 'Live Menu', <RocketOutlined />),
      item('/items', 'Item Analysis', <ShoppingOutlined />),
      item('/insights', 'Insights', <BulbOutlined />),
    ],
  },
  {
    type: 'group',
    key: 'g-system',
    label: 'System',
    children: [
      item('/logs', 'Logs', <FileTextOutlined />),
      item('/config', 'Config', <SettingOutlined />),
      item('/docs', 'Documentation', <BookOutlined />),
    ],
  },
];

function formatSessionEnd(expiresAt) {
  if (!expiresAt) return '';
  const end = new Date(expiresAt);
  const time = end.toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' });
  const sameDay = end.toDateString() === new Date().toDateString();
  return sameDay ? time : `${end.toLocaleDateString([], { day: 'numeric', month: 'short' })}, ${time}`;
}

const UserBlock = () => {
  const { user, expiresAt, logout } = useAuth();
  const [leaving, setLeaving] = useState(false);
  const name = user?.display_name || user?.username || 'Signed in';
  return (
    <div className="ktr-user">
      <div className="ktr-user-text">
        <span className="ktr-user-name" title={user?.username || undefined}>
          <UserOutlined style={{ marginRight: 6 }} />
          {name}
        </span>
        {expiresAt ? <span className="ktr-user-session">Session ends {formatSessionEnd(expiresAt)}</span> : null}
      </div>
      <Tooltip title="Sign out of KTR One">
        <Button
          icon={<LogoutOutlined />}
          loading={leaving}
          onClick={() => {
            setLeaving(true);
            logout();
          }}
        >
          Sign out
        </Button>
      </Tooltip>
    </div>
  );
};

const AppLayout = () => {
  const [siderPinned, setSiderPinned] = useState(false);
  const [siderHover, setSiderHover] = useState(false);
  const location = useLocation();
  const collapsed = !(siderPinned || siderHover);

  return (
    <Layout style={{ minHeight: '100vh' }}>
      <Layout.Sider
        className="ktr-sider"
        collapsible
        collapsed={collapsed}
        theme="light"
        width={248}
        collapsedWidth={72}
        style={{ position: 'fixed', height: '100vh', left: 0, top: 0, zIndex: 100 }}
        trigger={null}
        onMouseEnter={() => setSiderHover(true)}
        onMouseLeave={() => setSiderHover(false)}
      >
        <Link to="/" className={`ktr-brand ${collapsed ? 'is-collapsed' : ''}`} aria-label="KTR One home">
          <img src="/logo.png" alt="KTR" />
          {!collapsed && (
            <span className="ktr-brand-name">
              <em>One</em>
            </span>
          )}
        </Link>

        <nav className="ktr-menu-wrap" aria-label="Main">
          <Menu theme="light" selectedKeys={[location.pathname]} mode="inline" items={MENU_ITEMS} />
        </nav>
      </Layout.Sider>

      <Layout style={{ marginLeft: collapsed ? 72 : 248, transition: 'margin-left 0.2s', background: 'transparent', minWidth: 0 }}>
        <Header className="ktr-header">
          <div className="ktr-header-row">
            <div className="ktr-header-group">
              <Button
                type="text"
                aria-label={siderPinned ? 'Collapse menu' : 'Keep menu open'}
                icon={collapsed ? <MenuUnfoldOutlined /> : <MenuFoldOutlined />}
                onClick={() => setSiderPinned((prev) => !prev)}
                style={{ fontSize: 18 }}
              />
              <StoreSwitcher />
            </div>
            <div className="ktr-header-group">
              <PeriodControl />
              <UserBlock />
            </div>
          </div>
          <div className="ktr-plaid" aria-hidden="true" />
        </Header>

        <Content className="ktr-content animate-fade-in">
          <Routes>
            <Route path="/" element={<DashboardPage />} />
            <Route path="/live" element={<LiveOrdersPage />} />
            <Route path="/live-menu" element={<LiveMenuPage />} />
            <Route path="/transactions" element={<TransactionsPage />} />
            <Route path="/items" element={<ItemAnalysisPage />} />
            <Route path="/insights" element={<InsightsPage />} />
            <Route path="/accounting" element={<AccountingPage />} />
            <Route path="/logs" element={<LogsPage />} />
            <Route path="/config" element={<ConfigPage />} />
            <Route path="/discounts" element={<DiscountsPage />} />
            <Route path="/docs" element={<UserDocsPage />} />
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </Content>
      </Layout>
    </Layout>
  );
};

/** Everything except /login needs a session; remembers the page that was asked for. */
const ProtectedApp = () => {
  const { isAuthenticated, checking } = useAuth();
  const location = useLocation();

  if (!isAuthenticated) return <Navigate to="/login" replace state={{ from: location }} />;
  if (checking) {
    return (
      <div style={{ minHeight: '100vh', display: 'grid', placeItems: 'center' }}>
        <Spin size="large" />
      </div>
    );
  }
  return (
    <DashboardPeriodProvider>
      <StoreViewProvider>
        <AppLayout />
      </StoreViewProvider>
    </DashboardPeriodProvider>
  );
};

const App = () => {
  return (
    <ConfigProvider theme={ktrTheme}>
      <Router>
        <AuthProvider>
          <Routes>
            <Route path="/login" element={<LoginPage />} />
            <Route path="/*" element={<ProtectedApp />} />
          </Routes>
        </AuthProvider>
      </Router>
    </ConfigProvider>
  );
};

export default App;
