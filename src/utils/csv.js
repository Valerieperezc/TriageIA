/**
 * Escapa un valor para una celda CSV (RFC 4180 básico).
 * @param {unknown} value
 * @returns {string}
 */
export function escapeCsvCell(value) {
  if (value === null || value === undefined) {
    return "";
  }
  const s = String(value);
  if (/[",\r\n]/.test(s)) {
    return `"${s.replace(/"/g, '""')}"`;
  }
  return s;
}

/**
 * @param {string[]} headers
 * @param {string[][]} rows
 */
export function toCsvString(headers, rows) {
  const lines = [
    headers.map(escapeCsvCell).join(","),
    ...rows.map((row) => row.map(escapeCsvCell).join(",")),
  ];
  return lines.join("\r\n");
}

/**
 * Descarga un archivo de texto en el navegador.
 * @param {string} filename
 * @param {string} content
 * @param {string} [mime]
 */
/** @param {Date} [date] */
export function getAuditHistoryExportFilename(date = new Date()) {
  return `triageia-auditoria-${date.toISOString().slice(0, 10)}.csv`;
}

export function downloadTextFile(filename, content, mime = "text/csv;charset=utf-8") {
  const blob = new Blob([content], { type: mime });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
}
