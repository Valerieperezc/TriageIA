const EN_ESPERA = "En espera";

/**
 * Inicio de espera: hora de llegada si existe; si no, registro en sistema.
 * @param {{ createdAt: number, arrivedAt?: number|null }} p
 */
export function waitReferenceMs(p) {
  return typeof p.arrivedAt === "number" ? p.arrivedAt : p.createdAt;
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
 * Devuelve solo los pacientes cuya llegada/registro corresponde al mismo
 * día local que `now`. Permite que el dashboard "se limpie" cada 24 h
 * y que los turnos del día empiecen desde 1.
 * @param {Array<{ createdAt: number, arrivedAt?: number|null }>} patients
 * @param {number} [now]
 */
export function filterPatientsOfDay(patients, now = Date.now()) {
  return patients.filter((p) => isSameLocalDay(waitReferenceMs(p), now));
}

/**
 * @param {number} startMs
 * @param {number} now
 */
export function minutesSince(startMs, now) {
  return Math.floor((now - startMs) / 60000);
}

/**
 * @param {{ createdAt: number, arrivedAt?: number|null }} p
 * @param {number} now
 */
export function minutesWaiting(p, now) {
  return minutesSince(waitReferenceMs(p), now);
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
