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

api.interceptors.request.use((config) => {
  const fromStorage = localStorage.getItem('KIOSK_STORE_ID');
  const fromEnv = String(import.meta.env.VITE_DEFAULT_STORE_ID ?? '').trim();
  const storeId = (fromStorage && String(fromStorage).trim()) || fromEnv;
  if (storeId) {
    config.headers['X-Store-Id'] = storeId;
  }
  return config;
}, (error) => {
  return Promise.reject(error);
});

export default api;
