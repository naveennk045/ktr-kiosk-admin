/** Human-readable text from Axios/FastAPI error bodies. */
export function formatApiError(error) {
  const detail = error?.response?.data?.detail;
  if (detail == null) return error?.message ?? 'Request failed';

  if (Array.isArray(detail)) {
    const parts = detail.map((e) => {
      const loc = Array.isArray(e.loc) ? e.loc.join('.') : '';
      if (e.type === 'missing' && String(loc).toLowerCase().includes('x-store-id')) {
        return 'Missing X-Store-Id header (set Store in the app or VITE_DEFAULT_STORE_ID for this build).';
      }
      return e.msg || e.message || JSON.stringify(e);
    });
    return parts.join(' ');
  }

  if (typeof detail === 'string') return detail;
  if (typeof detail === 'object') return JSON.stringify(detail);
  return String(detail);
}
