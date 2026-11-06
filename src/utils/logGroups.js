/**
 * Turns backend log entries (one JSON object per line, see backend app/core/logger.py) into
 * request groups for the logs screen: every line sharing a request_id is one API call, with the
 * `http.request` summary line giving method, path, status and duration.
 */

export const LEVEL_RANK = { DEBUG: 10, INFO: 20, WARNING: 30, WARN: 30, ERROR: 40, CRITICAL: 50 };

/** Fields shown in their own columns, not in the "details" block. */
const STANDARD_FIELDS = new Set([
  'timestamp', 'level', 'logger', 'message', 'request_id', 'raw', 'stack_trace', 'source',
  'error_type', 'error_message', 'event', '_id',
]);

export function levelRank(level) {
  return LEVEL_RANK[String(level || '').toUpperCase()] || 0;
}

export function parseTime(ts) {
  if (!ts) return null;
  const t = Date.parse(ts);
  return Number.isFinite(t) ? t : null;
}

const IST = 'Asia/Kolkata';
const timeFmt = new Intl.DateTimeFormat('en-IN', { timeZone: IST, hour: '2-digit', minute: '2-digit', second: '2-digit', hour12: false });
const dateFmt = new Intl.DateTimeFormat('en-IN', { timeZone: IST, day: '2-digit', month: 'short' });

/** "14:05:09.123" in IST, plus "06 Nov" — or the raw string for unparseable legacy timestamps. */
export function formatTime(ts) {
  const t = parseTime(ts);
  if (t === null) return { time: ts || '—', date: '' };
  const ms = String(new Date(t).getUTCMilliseconds()).padStart(3, '0');
  return { time: `${timeFmt.format(t)}.${ms}`, date: dateFmt.format(t) };
}

export function formatDuration(ms) {
  if (ms === null || ms === undefined) return '—';
  if (ms >= 1000) return `${(ms / 1000).toFixed(ms >= 10000 ? 0 : 1)} s`;
  return `${Math.round(ms)} ms`;
}

/** Extra structured fields of an entry (everything not shown in a column). */
export function detailFields(entry) {
  const out = {};
  for (const [k, v] of Object.entries(entry || {})) {
    if (!STANDARD_FIELDS.has(k) && v !== null && v !== undefined && v !== '') out[k] = v;
  }
  return out;
}

export function shortId(id) {
  if (!id || id === '-') return '';
  return id.length > 14 ? `${id.slice(0, 8)}…${id.slice(-4)}` : id;
}

/** Give every entry a stable key once (entries arrive from both /logs and the stream). */
let seq = 0;
export function withIds(entries) {
  return entries.map((e) => (e._id ? e : { ...e, _id: `e${(seq += 1)}` }));
}

/**
 * Group entries by request. Entries outside a request (startup, background jobs) each become a
 * one-line "background" group. Groups come back newest first.
 */
export function groupByRequest(entries) {
  const groups = new Map();
  for (const e of entries) {
    const rid = e.request_id && e.request_id !== '-' ? e.request_id : null;
    const key = rid || `bg:${e._id}`;
    let g = groups.get(key);
    if (!g) {
      g = { key, requestId: rid, entries: [], orderIds: new Set(), events: new Set(), worst: 0 };
      groups.set(key, g);
    }
    g.entries.push(e);
    if (e.order_id) g.orderIds.add(e.order_id);
    if (e.event && e.event !== 'http.request') g.events.add(e.event);
    g.worst = Math.max(g.worst, levelRank(e.level));
    if (e.event === 'http.request') g.http = e;
    if (e.store_id && !g.storeId) g.storeId = e.store_id;
  }
  const list = [...groups.values()].map((g) => {
    const times = g.entries.map((e) => parseTime(e.timestamp)).filter((t) => t !== null);
    const start = times.length ? Math.min(...times) : null;
    const first = g.entries[0];
    return {
      ...g,
      start,
      startTs: g.entries.find((e) => parseTime(e.timestamp) === start)?.timestamp || first.timestamp,
      orderIds: [...g.orderIds],
      events: [...g.events],
      method: g.http?.method,
      path: g.http?.path,
      status: g.http?.status_code,
      duration: g.http?.duration_ms,
      title: g.http ? null : first.message,
      logger: first.logger,
      errorCount: g.entries.filter((e) => levelRank(e.level) >= 40).length,
      warnCount: g.entries.filter((e) => levelRank(e.level) === 30).length,
    };
  });
  return list.sort((a, b) => (b.start ?? 0) - (a.start ?? 0));
}

export function summarize(entries, groups) {
  const requests = groups.filter((g) => g.http);
  return {
    lines: entries.length,
    requests: requests.length,
    errors: entries.filter((e) => levelRank(e.level) >= 40).length,
    warnings: entries.filter((e) => levelRank(e.level) === 30).length,
    slow: requests.filter((g) => (g.duration || 0) >= 2000).length,
    failed: requests.filter((g) => (g.status || 0) >= 500).length,
  };
}
