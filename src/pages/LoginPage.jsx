import React, { useState } from 'react';
import { Navigate, useLocation, useNavigate } from 'react-router-dom';
import { Button, Form, Input } from 'antd';
import { LockOutlined, UserOutlined } from '@ant-design/icons';
import { useAuth } from '../context/AuthContext';
import './LoginPage.css';

/** Where to go after signing in: the page that was asked for, or the dashboard. */
function destinationFrom(location) {
  const from = location.state?.from;
  if (!from || typeof from.pathname !== 'string' || from.pathname === '/login') return '/';
  return `${from.pathname}${from.search || ''}${from.hash || ''}`;
}

const LoginPage = () => {
  const { isAuthenticated, login } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');
  const destination = destinationFrom(location);

  if (isAuthenticated) return <Navigate to={destination} replace />;

  const onFinish = async ({ username, password }) => {
    if (submitting) return;
    setSubmitting(true);
    setError('');
    try {
      await login(String(username).trim(), password);
      navigate(destination, { replace: true });
    } catch (err) {
      setError(err?.message || 'Sign-in failed. Please try again.');
      setSubmitting(false);
    }
  };

  return (
    <main className="login-screen">
      <section className="login-card" aria-labelledby="login-title">
        <div className="login-plaid" aria-hidden="true" />
        <div className="login-body">
          <img className="login-logo" src="/logo.png" alt="KTR" />
          <h1 className="login-title" id="login-title">
            KTR <em>One</em>
          </h1>
          <p className="login-sub">Sign in to the restaurant dashboard.</p>

          {error ? (
            <p className="login-error" role="alert">
              {error}
            </p>
          ) : null}

          <Form layout="vertical" requiredMark={false} onFinish={onFinish} disabled={submitting} size="large">
            <Form.Item
              label="Username"
              name="username"
              rules={[{ required: true, whitespace: true, message: 'Enter your username' }]}
            >
              <Input
                prefix={<UserOutlined />}
                autoComplete="username"
                autoCapitalize="none"
                autoCorrect="off"
                spellCheck={false}
                autoFocus
              />
            </Form.Item>
            <Form.Item
              label="Password"
              name="password"
              rules={[{ required: true, message: 'Enter your password' }]}
            >
              <Input.Password prefix={<LockOutlined />} autoComplete="current-password" />
            </Form.Item>
            <Button type="primary" htmlType="submit" block loading={submitting} style={{ height: 48, fontSize: 16 }}>
              {submitting ? 'Signing in…' : 'Sign in'}
            </Button>
          </Form>

          <p className="login-help">Ask your administrator for an account.</p>
        </div>
      </section>
    </main>
  );
};

export default LoginPage;
