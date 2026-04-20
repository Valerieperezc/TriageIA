import { toCsvString } from "./csv";

const POST_LOGIN_START_KEY = "triageia:perf:post-login-start";

/** Clave `localStorage` del historial de muestras post-login (p. ej. listeners `storage` entre pestañas). */
export const POST_LOGIN_PERF_HISTORY_STORAGE_KEY = "triageia:perf:post-login-history";

const POST_LOGIN_HISTORY_KEY = POST_LOGIN_PERF_HISTORY_STORAGE_KEY;
const POST_LOGIN_HISTORY_MAX = 20;

export function markPostLoginNavigationStart() {
  if (typeof sessionStorage === "undefined" || typeof performance === "undefined") {
    return;
  }
  sessionStorage.setItem(POST_LOGIN_START_KEY, String(performance.now()));
}

export function consumePostLoginNavigationMs() {
  if (typeof sessionStorage === "undefined" || typeof performance === "undefined") {
    return null;
  }

  const raw = sessionStorage.getItem(POST_LOGIN_START_KEY);
  sessionStorage.removeItem(POST_LOGIN_START_KEY);
  if (!raw) return null;

  const start = Number(raw);
  if (!Number.isFinite(start)) return null;
  return Math.max(0, Math.round(performance.now() - start));
}

function readHistory(storage = localStorage) {
  try {
    const raw = storage.getItem(POST_LOGIN_HISTORY_KEY);
    const parsed = raw ? JSON.parse(raw) : [];
    if (!Array.isArray(parsed)) return [];
    return parsed
      .map((v) => Number(v))
      .filter((v) => Number.isFinite(v) && v >= 0)
      .map((v) => Math.round(v));
  } catch {
    return [];
  }
}

function writeHistory(history, storage = localStorage) {
  try {
    storage.setItem(POST_LOGIN_HISTORY_KEY, JSON.stringify(history));
  } catch {
    // no-op: métrica best-effort
  }
}

export function readPostLoginPerfHistory(storage = localStorage) {
  return readHistory(storage);
}

export function recordPostLoginNavigationMs(ms, storage = localStorage) {
  const value = Number(ms);
  if (!Number.isFinite(value) || value < 0) {
    return;
  }
  const current = readHistory(storage);
  const next = [...current, Math.round(value)].slice(-POST_LOGIN_HISTORY_MAX);
  writeHistory(next, storage);
}

export function readPostLoginPerfSummary(storage = localStorage) {
  const history = readHistory(storage);
  if (!history.length) {
    return { lastMs: null, avgMs: null, samples: 0 };
  }

  const lastMs = history[history.length - 1];
  const avgMs = Math.round(history.reduce((sum, v) => sum + v, 0) / history.length);
  return { lastMs, avgMs, samples: history.length };
}

export function clearPostLoginPerfHistory(storage = localStorage) {
  try {
    storage.removeItem(POST_LOGIN_HISTORY_KEY);
  } catch {
    // no-op: métrica best-effort
  }
}

/**
 * @param {number[]} samples
 * @returns {string | null}
 */
export function formatPostLoginPerfCsv(samples) {
  if (!Array.isArray(samples) || !samples.length) {
    return null;
  }
  const headers = ["Muestra", "Duracion_ms"];
  const rows = samples.map((value, idx) => [String(idx + 1), String(value)]);
  return "\uFEFF" + toCsvString(headers, rows);
}

/** @param {Date} [date] */
export function getPostLoginPerfExportFilename(date = new Date()) {
  return `triageia-ux-post-login-${date.toISOString().slice(0, 10)}.csv`;
}

export function shouldPrefetchPrivateAreaOnCurrentConnection() {
  if (typeof navigator === "undefined") {
    return true;
  }

  const connection =
    navigator.connection || navigator.mozConnection || navigator.webkitConnection;
  if (!connection) {
    return true;
  }

  if (connection.saveData) {
    return false;
  }

  const effectiveType = String(connection.effectiveType || "").toLowerCase();
  if (effectiveType === "slow-2g" || effectiveType === "2g") {
    return false;
  }

  if (Number.isFinite(connection.downlink) && connection.downlink < 1) {
    return false;
  }

  return true;
}
