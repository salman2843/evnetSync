// Formats planner data as CSV. This file is pure: it only turns rows into text,
// which makes the escaping rules easy to test without a database.
function formatValue(value) {
  if (value === null || value === undefined) return '';
  if (value instanceof Date) return value.toISOString();
  if (Array.isArray(value)) return value.join('; ');
  return String(value);
}

// A comma, quote, or line break needs the field wrapped in quotes, and any
// quote inside it is doubled. Excel and Google Sheets both understand this.
function escapeValue(value) {
  const text = formatValue(value);
  return /[",\r\n]/.test(text) ? `"${text.replace(/"/g, '""')}"` : text;
}

// columns: [{ label: 'Name', value: (row) => row.name }]
export function toCsv(rows, columns) {
  const header = columns.map((column) => escapeValue(column.label)).join(',');
  const lines = rows.map((row) => columns.map((column) => escapeValue(column.value(row))).join(','));
  return [header, ...lines].join('\r\n') + '\r\n';
}
