/** Client-side CSV export (RFC 4180 quoting, UTF-8 with BOM so Excel reads ₹ and names correctly). */

function cell(value) {
  if (value == null) return '';
  let text = typeof value === 'number' ? String(value) : String(value);
  // Stop spreadsheet apps from running text that looks like a formula.
  if (typeof value !== 'number' && /^[=+\-@\t\r]/.test(text)) text = `'${text}`;
  return /[",\r\n]/.test(text) ? `"${text.replace(/"/g, '""')}"` : text;
}

/** @param {{ title: string, value: (row: object) => unknown }[]} columns */
export function toCsv(columns, rows) {
  const lines = [columns.map((c) => cell(c.title)).join(',')];
  for (const row of rows) lines.push(columns.map((c) => cell(c.value(row))).join(','));
  return lines.join('\r\n');
}

export function downloadCsv(filename, csvText) {
  const blob = new Blob(['﻿', csvText], { type: 'text/csv;charset=utf-8' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  link.remove();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}
