export const RETRY_STATS_STORAGE_KEY = "triageia:retry-stats";

export const DEFAULT_RETRY_STATS = {
  totalRetries: 0,
  recoveredLoads: 0,
  recoveredActions: 0,
  failedLoads: 0,
  failedActions: 0,
  lastRetryAt: null,
};

function toNonNegativeInt(value) {
  const n = Number(value);
  if (!Number.isFinite(n) || n < 0) return 0;
  return Math.floor(n);
}

function getStorage(storage) {
  if (storage) return storage;
  if (typeof localStorage !== "undefined") return localStorage;
  return null;
}

export function normalizeRetryStats(raw) {
  const lastRetryAt =
    raw?.lastRetryAt == null ? null : Number(raw.lastRetryAt);
  return {
    totalRetries: toNonNegativeInt(raw?.totalRetries),
    recoveredLoads: toNonNegativeInt(raw?.recoveredLoads),
    recoveredActions: toNonNegativeInt(raw?.recoveredActions),
    failedLoads: toNonNegativeInt(raw?.failedLoads),
    failedActions: toNonNegativeInt(raw?.failedActions),
    lastRetryAt: Number.isFinite(lastRetryAt) ? lastRetryAt : null,
  };
}

export function readRetryStats(storage) {
  try {
    const s = getStorage(storage);
    if (!s) return DEFAULT_RETRY_STATS;
    const raw = s.getItem(RETRY_STATS_STORAGE_KEY);
    if (!raw) return DEFAULT_RETRY_STATS;
    return normalizeRetryStats(JSON.parse(raw));
  } catch {
    return DEFAULT_RETRY_STATS;
  }
}

export function writeRetryStats(stats, storage) {
  try {
    const s = getStorage(storage);
    if (!s) return;
    s.setItem(RETRY_STATS_STORAGE_KEY, JSON.stringify(stats));
  } catch {
    /* ignore */
  }
}

/**
 * Clasifica la salud operativa reciente según fallos/reintentos acumulados.
 */
export function classifyRetryHealth(stats) {
  const normalized = normalizeRetryStats(stats);
  const failures = normalized.failedLoads + normalized.failedActions;

  if (failures >= 3) {
    return {
      level: "critical",
      label: "Critico",
      badgeClass:
        "bg-red-100 text-red-800 dark:bg-red-900/50 dark:text-red-300",
    };
  }

  if (failures > 0 || normalized.totalRetries >= 5) {
    return {
      level: "warning",
      label: "Alerta",
      badgeClass:
        "bg-amber-100 text-amber-800 dark:bg-amber-900/50 dark:text-amber-300",
    };
  }

  return {
    level: "healthy",
    label: "Estable",
    badgeClass:
      "bg-emerald-100 text-emerald-800 dark:bg-emerald-900/50 dark:text-emerald-300",
  };
}
