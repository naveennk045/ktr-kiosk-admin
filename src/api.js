import axios from 'axios';

const api = axios.create({
  baseURL: import.meta.env.VITE_API_BASE_URL || '/api', // Fallback for now
});

api.interceptors.request.use((config) => {
  const storeId = localStorage.getItem('KIOSK_STORE_ID');
  if (storeId) {
    config.headers['X-Store-Id'] = storeId;
  }
  return config;
}, (error) => {
  return Promise.reject(error);
});

export default api;
