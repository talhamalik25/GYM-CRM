export function csvCell(value) {
  let text = value == null ? "" : value instanceof Date ? value.toISOString() : String(value);
  if (/^[\s]*[=+@-]/.test(text) && typeof value !== "number") text = `'${text}`;
  return `"${text.replaceAll('"', '""')}"`;
}
export function csvRow(values) { return values.map(csvCell).join(",") + "\r\n"; }
