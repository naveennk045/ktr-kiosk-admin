import React, { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from 'react';
import PropTypes from 'prop-types';
import { message } from 'antd';
import api from '../api';
import {
  AUTH_STORAGE_KEY,
  clearSession,
  readSession,
  setUnauthorizedHandler,
  writeSession,
} from '../authSession';

const AuthContext = createContext(null);

const EXPIRED_TEXT = 'Session expired, please sign in again';
const EXPIRED_KEY = 'ktr-session-expired';
const MAX_TIMEOUT_MS = 2 ** 31 - 1;

/** When the session ends, in ms since epoch. Prefers `expires_in` (immune to clock differences). */
function resolveExpiry(data) {
  const seconds = Number(data?.expires_in);
  if (Number.isFinite(seconds) && seconds > 0) return Date.now() + seconds * 1000;
  const at = Date.parse(data?.expires_at);
  return Number.isFinite(at) ? at : null;
}

function loginErrorText(error) {
  const status = error?.response?.status;
  const detail = error?.response?.data?.detail;
  const text = typeof detail === 'string' && detail.trim() ? detail.trim() : null;
  if (status === 401) return 'Wrong username or password.';
  if (status === 429) return text || 'Too many attempts. Please wait a few minutes and try again.';
  if (status === 503) return text || 'Sign-in is not set up on the server yet. Please contact your administrator.';
  if (status === 422 || status === 400) return 'Enter your username and password.';
  if (!error?.response) return 'Cannot reach the server. Check your connection and try again.';
  return text || 'Sign-in failed. Please try again.';
}

export function AuthProvider({ children }) {
  const [session, setSession] = useState(() => readSession());
  // 'checking' while a stored session is being confirmed with the server on startup.
  const [checking, setChecking] = useState(() => Boolean(readSession()));
  // Always the latest session, for callbacks that must not go stale. Updated wherever the session changes.
  const sessionRef = useRef(session);

  const dropSession = useCallback((notice) => {
    const hadSession = Boolean(sessionRef.current);
    sessionRef.current = null;
    clearSession();
    setSession(null);
    setChecking(false);
    // One toast however many requests failed at the same moment.
    if (hadSession && notice) message.warning({ content: notice, key: EXPIRED_KEY, duration: 5 });
  }, []);

  // 401 from any dashboard request → back to sign-in.
  useEffect(() => {
    setUnauthorizedHandler(() => dropSession(EXPIRED_TEXT));
    return () => setUnauthorizedHandler(null);
  }, [dropSession]);

  // Confirm a stored session once on startup.
  useEffect(() => {
    const startToken = sessionRef.current?.token;
    if (!startToken) return undefined;
    let cancelled = false;
    api
      .get('/auth/me')
      .then((res) => {
        if (cancelled || sessionRef.current?.token !== startToken) return;
        const me = res.data || {};
        const user = {
          id: me.id ?? sessionRef.current.user?.id,
          username: me.username ?? sessionRef.current.user?.username,
          display_name: me.display_name ?? null,
          role: me.role ?? sessionRef.current.user?.role,
        };
        const next = { ...sessionRef.current, user };
        writeSession(next);
        sessionRef.current = next;
        setSession(next);
      })
      .catch((error) => {
        if (cancelled || sessionRef.current?.token !== startToken) return;
        // Only a real "not signed in" answer ends the session; a network blip keeps it.
        if (error?.response?.status === 401) dropSession(EXPIRED_TEXT);
      })
      .finally(() => {
        if (!cancelled) setChecking(false);
      });
    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Sign out locally the moment the session's end time passes (also re-checked when the tab wakes up).
  const expiresAt = session?.expiresAt ?? null;
  useEffect(() => {
    if (!expiresAt) return undefined;
    let timer = null;
    const check = () => {
      clearTimeout(timer);
      const left = expiresAt - Date.now();
      if (left <= 0) {
        dropSession(EXPIRED_TEXT);
        return;
      }
      timer = setTimeout(check, Math.min(left + 250, MAX_TIMEOUT_MS));
    };
    check();
    const onVisible = () => {
      if (!document.hidden) check();
    };
    document.addEventListener('visibilitychange', onVisible);
    window.addEventListener('focus', onVisible);
    return () => {
      clearTimeout(timer);
      document.removeEventListener('visibilitychange', onVisible);
      window.removeEventListener('focus', onVisible);
    };
  }, [expiresAt, dropSession]);

  // Keep several tabs in step: signing out (or in) in one tab applies to the others.
  useEffect(() => {
    const onStorage = (event) => {
      if (event.key !== AUTH_STORAGE_KEY && event.key !== null) return;
      const stored = readSession();
      sessionRef.current = stored;
      setSession(stored);
      if (!stored) setChecking(false);
    };
    window.addEventListener('storage', onStorage);
    return () => window.removeEventListener('storage', onStorage);
  }, []);

  const login = useCallback(async (username, password) => {
    let res;
    try {
      res = await api.post('/auth/login', { username, password });
    } catch (error) {
      throw new Error(loginErrorText(error));
    }
    const data = res.data || {};
    const at = resolveExpiry(data);
    if (!data.access_token || !at || at <= Date.now()) {
      throw new Error('The server sent an unexpected sign-in response. Please contact your administrator.');
    }
    const next = {
      token: data.access_token,
      expiresAt: at,
      user: {
        id: data.user?.id ?? null,
        username: data.user?.username ?? username,
        display_name: data.user?.display_name ?? null,
        role: data.user?.role ?? null,
      },
    };
    message.destroy(EXPIRED_KEY);
    writeSession(next);
    sessionRef.current = next;
    setChecking(false);
    setSession(next);
    return next.user;
  }, []);

  const logout = useCallback(async () => {
    const token = sessionRef.current?.token;
    // Clear local state first so the UI leaves immediately; the server call may fail and that is fine.
    dropSession(null);
    if (token) {
      try {
        await api.post('/auth/logout', null, { headers: { Authorization: `Bearer ${token}` } });
      } catch {
        // token is gone locally either way
      }
    }
  }, [dropSession]);

  const value = useMemo(
    () => ({
      user: session?.user ?? null,
      token: session?.token ?? null,
      expiresAt,
      isAuthenticated: Boolean(session),
      checking,
      login,
      logout,
    }),
    [session, expiresAt, checking, login, logout]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

AuthProvider.propTypes = {
  children: PropTypes.node.isRequired,
};

// eslint-disable-next-line react-refresh/only-export-components
export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
}
