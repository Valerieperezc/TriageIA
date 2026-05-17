const EN_ESPERA = "En espera";

/** Tolerancia si `arrived_at` va unos segundos por delante de `created_at` (reloj/servidor). */
const ARRIVED_AFTER_CREATED_SLACK_MS = 120_000;

/**
 * Misma fecha local de llegada y de alta, pero la llegada declarada va muchas
 * horas antes del alta: típico de seeds/import con `arrived_at` artificial
 * respecto a `created_at` real de inserción.
 */
const SAME_DAY_SYNTHETIC_ARRIVAL_GAP_MS = 17 * 60 * 60 * 1000;

function finiteOrNull(ms) {
  return typeof ms === "number" && !Number.isNaN(ms) ? ms : null;
}

/**
 * Instante desde el que se mide la espera en cola: prioriza la hora de llegada
 * clínica cuando es coherente con el alta en sistema; si no, el alta
 * (`createdAt`) para no inflar minutos con datos importados desalineados.
 *
 * @param {{ createdAt: number, arrivedAt?: number|null }} p
 * @param {number} [refNow] instante "ahora" para comparar días (p. ej. `now` del dashboard)
 */
export function waitReferenceMs(p, refNow = Date.now()) {
  const created = finiteOrNull(p.createdAt);
  const arrived = finiteOrNull(p.arrivedAt);
  const now =
    typeof refNow === "number" && !Number.isNaN(refNow) ? refNow : Date.now();

  if (arrived == null) {
    return created ?? now;
  }
  if (created == null) {
    return arrived;
  }

  // Llegada posterior al alta: inconsistente → contar desde el alta.
  if (arrived > created + ARRIVED_AFTER_CREATED_SLACK_MS) {
    return created;
  }

  // Llegada y alta en distintos días locales y el alta es "hoy": típ. `arrived_at` UTC vs `created_at` local.
  if (
    !isSameLocalDay(arrived, created) &&
    isSameLocalDay(created, now)
  ) {
    return created;
  }
  // Mismo día local pero llegada declarada muchas horas antes del alta: típ. seeds con timestamps ficticios.
  if (
    isSameLocalDay(arrived, created) &&
    isSameLocalDay(created, now) &&
    created - arrived > SAME_DAY_SYNTHETIC_ARRIVAL_GAP_MS
  ) {
    return created;
  }
  return arrived;
}

/**
 * Inicio del día local (00:00:00.000) para el timestamp dado.
 * @param {number} ms
 */
export function startOfLocalDay(ms) {
  const d = new Date(ms);
  d.setHours(0, 0, 0, 0);
  return d.getTime();
}

/**
 * Indica si dos timestamps corresponden al mismo día local.
 * @param {number} ms
 * @param {number} ref
 */
export function isSameLocalDay(ms, ref) {
  if (typeof ms !== "number" || Number.isNaN(ms)) return false;
  return startOfLocalDay(ms) === startOfLocalDay(ref);
}

/**
 * Día del turno en el dashboard: fecha de **registro en el sistema**
 * (`createdAt`), no la hora de llegada clínica. Así los datos importados
 * con `arrived_at` en UTC no quedan fuera del día local en zonas como
 * América; la espera en cola usa `waitReferenceMs` (llegada coherente con el alta).
 * @param {Array<{ createdAt: number, arrivedAt?: number|null }>} patients
 * @param {number} [now]
 */
export function filterPatientsOfDay(patients, now = Date.now()) {
  return patients.filter((p) =>
    isSameLocalDay(
      typeof p.createdAt === "number" && !Number.isNaN(p.createdAt)
        ? p.createdAt
        : waitReferenceMs(p, now),
      now
    )
  );
}

/**
 * @param {number} startMs
 * @param {number} now
 */
export function minutesSince(startMs, now) {
  if (!Number.isFinite(startMs) || !Number.isFinite(now)) return 0;
  const delta = now - startMs;
  return delta <= 0 ? 0 : Math.floor(delta / 60000);
}

/**
 * @param {{ createdAt: number, arrivedAt?: number|null }} p
 * @param {number} now
 */
export function minutesWaiting(p, now) {
  return minutesSince(waitReferenceMs(p, now), now);
}

/**
 * @param {Array<{ status: string, triage: string, createdAt: number, arrivedAt?: number|null }>} patients
 * @param {number} [now]
 */
export function computeQueueMetrics(patients, now = Date.now()) {
  const waiting = patients.filter((p) => p.status === EN_ESPERA);
  const waits = waiting.map((p) => minutesWaiting(p, now));

  const avgWaitMinutes =
    waits.length === 0
      ? 0
      : Math.round(waits.reduce((a, b) => a + b, 0) / waits.length);

  const longestWaitMinutes = waits.length === 0 ? 0 : Math.max(...waits);

  const criticalWaiting = waiting.filter((p) => p.triage === "I");
  const criticalInQueueCount = criticalWaiting.length;

  const longestCriticalWaitMinutes =
    criticalWaiting.length === 0
      ? 0
      : Math.max(...criticalWaiting.map((p) => minutesWaiting(p, now)));

  return {
    waitingCount: waiting.length,
    avgWaitMinutes,
    longestWaitMinutes,
    criticalInQueueCount,
    longestCriticalWaitMinutes,
  };
}
