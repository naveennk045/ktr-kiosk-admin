/** Defensive accessors for kiosk order payloads (camelCase vs snake_case). */

export function pickFirst(obj, keys) {
  if (!obj || typeof obj !== 'object') return undefined;
  for (const k of keys) {
    if (obj[k] !== undefined && obj[k] !== null && obj[k] !== '') return obj[k];
  }
  return undefined;
}

export function getKotCode(record) {
  const v = pickFirst(record, ['kotCode', 'kot_code', 'kotKode', 'kot_kode', 'kot']);
  return v != null && String(v).trim() !== '' ? String(v) : '—';
}

export function getOrderType(record) {
  const v = pickFirst(record, ['orderType', 'order_type', 'type', 'serviceType', 'service_type']);
  if (v == null || v === '') return '—';
  const s = String(v).toUpperCase();
  if (s.includes('DINE') || s === 'DINEIN' || s === 'DINE_IN') return 'Dine-in';
  if (s.includes('TAKE') || s === 'TAKEAWAY' || s === 'TAKE_AWAY') return 'Takeaway';
  return String(v);
}

/** Backend may expose QR / UPI / CARD / CASH / MANUAL */
export function getPaymentType(record) {
  const v = pickFirst(record, [
    'paymentMethod',
    'payment_method',
    'paymentType',
    'payment_type',
    'payMode',
    'pay_mode',
  ]);
  if (v == null || v === '') return '—';
  const u = String(v).toUpperCase();
  if (u === 'QR') return 'UPI';
  return String(v);
}

export function formatInr(amount) {
  const n = Number(amount);
  if (Number.isNaN(n)) return '—';
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(n);
}

export function formatIst(iso) {
  if (!iso) return '—';
  try {
    return new Date(iso).toLocaleString('en-IN', {
      timeZone: 'Asia/Kolkata',
      dateStyle: 'medium',
      timeStyle: 'short',
    });
  } catch {
    return String(iso);
  }
}

export function lineTitle(row) {
  return String(pickFirst(row, ['item_name', 'name', 'title', 'itemName']) ?? 'Item');
}

export function lineQty(row) {
  const q = pickFirst(row, ['quantity', 'qty', 'count']);
  const n = Number(q);
  return Number.isFinite(n) ? n : 0;
}

export function lineUnitPrice(row) {
  const p = pickFirst(row, ['unit_price', 'unitPrice', 'price', 'rate']);
  const n = Number(p);
  return Number.isFinite(n) ? n : 0;
}

export function lineLineTotal(row) {
  const explicit = pickFirst(row, ['line_total', 'lineTotal', 'total', 'amount']);
  if (explicit != null && explicit !== '') {
    const n = Number(explicit);
    if (Number.isFinite(n)) return n;
  }
  return lineQty(row) * lineUnitPrice(row);
}
