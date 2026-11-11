import axios from 'axios';
import { notifyUnauthorized, readSession } from './authSession';

/** Avoid mixed-content blocking when the app is HTTPS but VITE_API_BASE_URL was built with http:// */
function resolveApiBaseUrl() {
  const raw = (import.meta.env.VITE_API_BASE_URL || '/api').trim();
  if (
    globalThis.window?.location.protocol === 'https:' &&
    raw.startsWith('http://')
  ) {
    return `https://${raw.slice('http://'.length)}`;
  }
  return raw;
}

export const API_BASE_URL = resolveApiBaseUrl();

const api = axios.create({
  baseURL: API_BASE_URL,
});

/** True when the request goes to this app's own API (not another environment picked on the Logs page). */
function isOwnApi(config) {
  return !config?.baseURL || config.baseURL === API_BASE_URL;
}

function requestPath(config) {
  return String(config?.url || '').split('?')[0];
}

function buildRequestId() {
  const random = Math.random().toString(36).slice(2, 10).toUpperCase();
  return `KTRWEB-${Date.now()}-${random}`;
}

function shouldAttachStoreHeader(url) {
  const path = String(url || '');
  if (!path) return true;
  if (path.startsWith('/payments/')) return false;
  if (path === '/admin/kiosk-config') return false;
  if (path.startsWith('/admin/logs')) return false;
  if (path.startsWith('/petpooja/')) return false;
  return true;
}

api.interceptors.request.use((config) => {
  const headers = config.headers || {};
  headers['X-Request-Id'] = headers['X-Request-Id'] || buildRequestId();

  const viewMode = localStorage.getItem('KTR_ONE_VIEW_MODE') || 'single';
  const fromStorage = localStorage.getItem('KIOSK_STORE_ID') || localStorage.getItem('KIOSK_STORE_CODE');
  const fromEnv = String(import.meta.env.VITE_DEFAULT_STORE_ID ?? '').trim();
  const storeId = (fromStorage && String(fromStorage).trim()) || fromEnv;

  if (viewMode !== 'multi' && storeId && shouldAttachStoreHeader(config.url)) {
    headers['X-Store-Id'] = storeId;
  } else if (headers['X-Store-Id']) {
    delete headers['X-Store-Id'];
  }

  // The session token only ever goes to our own API, never to another base URL.
  const session = isOwnApi(config) ? readSession() : null;
  if (session && !headers.Authorization) {
    headers.Authorization = `Bearer ${session.token}`;
    // Which session this request belongs to (its end time — not a secret), to recognise late answers.
    config.ktrSessionStamp = session.expiresAt;
  }

  config.headers = headers;
  return config;
}, (error) => {
  return Promise.reject(error);
});

api.interceptors.response.use(
  (response) => response,
  (error) => {
    const config = error?.config;
    const path = requestPath(config);
    // Pages log failed requests to the console; make sure the token is not part of what they log.
    if (config?.headers) {
      if (typeof config.headers.delete === 'function') config.headers.delete('Authorization');
      else delete config.headers.Authorization;
    }
    if (config && path.startsWith('/auth/')) delete config.data; // never keep the password around
    // 401 on sign-in is "wrong password"; AuthContext deals with /auth/me and /auth/logout itself.
    if (error?.response?.status === 401 && isOwnApi(config) && !path.startsWith('/auth/')) {
      // Ignore late answers to requests sent with an older token (e.g. just after signing in again).
      const current = readSession();
      if (!current || !config?.ktrSessionStamp || config.ktrSessionStamp === current.expiresAt) {
        notifyUnauthorized();
        // The user is on their way to the sign-in page, which shows one "session expired" notice.
        // Leave this request pending so the page that made it does not add its own error toast.
        return new Promise(() => {});
      }
    }
    return Promise.reject(error);
  }
);

export default api;
