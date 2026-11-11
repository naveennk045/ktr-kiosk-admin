/** Helpers for the read-only kitchen board (`GET /kds/board`). */

export const WARN_AFTER_MS = 5 * 60 * 1000;
export const LATE_AFTER_MS = 10 * 60 * 1000;

/** Server timestamps are UTC; one without a zone marker is still UTC, not the browser's local time. */
export function parseServerTime(iso) {
  if (!iso) return null;
  const text = String(iso);
  const hasZone = /(Z|[+-]\d{2}:?\d{2})$/i.test(text);
  const ms = Date.parse(hasZone ? text : `${text}Z`);
  return Number.isFinite(ms) ? ms : null;
}

/** mm:ss, or h:mm:ss past an hour. */
export function formatAge(ms) {
  if (ms == null || !Number.isFinite(ms)) return '—';
  const total = Math.max(0, Math.floor(ms / 1000));
  const h = Math.floor(total / 3600);
  const m = Math.floor((total % 3600) / 60);
  const s = total % 60;
  const pad = (n) => String(n).padStart(2, '0');
  return h > 0 ? `${h}:${pad(m)}:${pad(s)}` : `${pad(m)}:${pad(s)}`;
}

export function ageLevel(ms) {
  if (ms == null) return 'ok';
  if (ms > LATE_AFTER_MS) return 'late';
  if (ms >= WARN_AFTER_MS) return 'warn';
  return 'ok';
}

function count(value) {
  const n = Number(value);
  return Number.isFinite(n) && n > 0 ? n : 0;
}

function lineCounts(line) {
  const status = String(line?.order_status || '').toUpperCase();
  const qty = count(line?.quantity);
  const hasCounters = line?.items_need_be_ready != null && line?.items_need_be_collected != null;
  if (hasCounters) {
    return { toMake: count(line.items_need_be_ready), toCollect: count(line.items_need_be_collected), status };
  }
  if (status === 'READY') return { toMake: 0, toCollect: qty, status };
  if (status === 'COLLECTED') return { toMake: 0, toCollect: 0, status };
  return { toMake: qty, toCollect: 0, status };
}

/**
 * Turn a board response into open tickets (oldest first) and the numbers shown in the KPI row.
 * The board also returns recently finished orders; those are counted separately, not as waiting.
 */
export function summarizeBoard(board, now) {
  const orders = Array.isArray(board?.orders) ? board.orders : [];
  const tickets = [];
  let finished = 0;
  for (const order of orders) {
    const lines = (Array.isArray(order?.lines) ? order.lines : []).map((line) => ({ ...line, ...lineCounts(line) }));
    const toMake = lines.reduce((sum, l) => sum + l.toMake, 0);
    const toCollect = lines.reduce((sum, l) => sum + l.toCollect, 0);
    const open = toMake > 0 || toCollect > 0 || lines.some((l) => l.status !== 'COLLECTED');
    if (!open) {
      finished += 1;
      continue;
    }
    const createdMs = parseServerTime(order.created_at);
    tickets.push({
      ...order,
      lines,
      toMake,
      toCollect,
      createdMs,
      ageMs: createdMs == null ? null : Math.max(0, now - createdMs),
    });
  }
  tickets.sort((a, b) => (a.createdMs ?? Infinity) - (b.createdMs ?? Infinity));
  const ages = tickets.map((t) => t.ageMs).filter((v) => v != null);
  return {
    tickets,
    finished,
    kpis: {
      open: tickets.length,
      inKitchen: tickets.filter((t) => t.toMake > 0).length,
      itemsToMake: tickets.reduce((sum, t) => sum + t.toMake, 0),
      atCounter: tickets.filter((t) => t.toCollect > 0).length,
      oldestMs: ages.length ? Math.max(...ages) : null,
      late: tickets.filter((t) => t.ageMs != null && t.ageMs > LATE_AFTER_MS).length,
    },
  };
}
