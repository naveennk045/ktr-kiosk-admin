import axios from 'axios';

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

const api = axios.create({
  baseURL: resolveApiBaseUrl(),
});

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

  config.headers = headers;
  return config;
}, (error) => {
  return Promise.reject(error);
});

export default api;
