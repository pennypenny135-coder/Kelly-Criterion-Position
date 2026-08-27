/**
 * format.ts — Number and date formatting helpers.
 */

/** Format a number as a percentage string, e.g. 0.1234 → "12.34%" */
export function fmtPct(value: number, decimals = 2): string {
  return (value * 100).toFixed(decimals) + '%';
}

/** Format a number as a fixed-decimal string */
export function fmtNum(value: number, decimals = 2): string {
  return value.toFixed(decimals);
}

/** Format a dollar amount */
export function fmtUSD(value: number): string {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(value);
}

/** Format a large number with commas */
export function fmtComma(value: number): string {
  return new Intl.NumberFormat('en-US').format(value);
}

/** Format an ISO date string to readable format */
export function fmtDate(iso: string): string {
  return new Date(iso).toLocaleString('en-US', {
    year: 'numeric',
    month: 'short',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
  });
}

/** Format just the date part */
export function fmtDateOnly(iso: string): string {
  return new Date(iso).toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'short',
    day: '2-digit',
  });
}

/** Market environment label */
export function fmtMarketEnv(env: string): string {
  switch (env) {
    case 'RiskOn':
      return '🟢 Risk On';
    case 'Neutral':
      return '🟡 Neutral';
    case 'RiskOff':
      return '🔴 Risk Off';
    default:
      return env;
  }
}

/** Generate a simple unique ID */
export function generateId(): string {
  return Date.now().toString(36) + Math.random().toString(36).slice(2, 7);
}

/** Export data as CSV download */
export function exportCSV(filename: string, rows: Record<string, unknown>[]): void {
  if (rows.length === 0) return;
  const headers = Object.keys(rows[0]);
  const csv = [
    headers.join(','),
    ...rows.map((row) =>
      headers
        .map((h) => {
          const val = row[h];
          const str = val === null || val === undefined ? '' : String(val);
          // Escape commas and quotes
          return str.includes(',') || str.includes('"') || str.includes('\n')
            ? `"${str.replace(/"/g, '""')}"`
            : str;
        })
        .join(','),
    ),
  ].join('\n');

  const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  link.click();
  URL.revokeObjectURL(url);
}
