import { waitReferenceMs } from "./dashboardMetrics";

const TRIAGE_ORDER = { I: 1, II: 2, III: 3, IV: 4, V: 5 };

/** @typedef {'triage' | 'wait-desc' | 'wait-asc' | 'name'} PatientSortMode */

const VALID = new Set(["triage", "wait-desc", "wait-asc", "name"]);

/**
 * @param {string | null | undefined} raw
 * @returns {PatientSortMode}
 */
export function parseSortParam(raw) {
  const s = raw && String(raw).trim();
  if (s && VALID.has(s)) return /** @type {PatientSortMode} */ (s);
  return "triage";
}

function waitMinutes(p, now) {
  return Math.floor((now - waitReferenceMs(p)) / 60000);
}

/**
 * @param {Array<{ name: string, triage: string, createdAt: number }>} list
 * @param {PatientSortMode} mode
 * @param {number} now
 */
export function sortPatients(list, mode, now = Date.now()) {
  const arr = [...list];

  switch (mode) {
    case "wait-desc":
      return arr.sort((a, b) => waitMinutes(b, now) - waitMinutes(a, now));
    case "wait-asc":
      return arr.sort((a, b) => waitMinutes(a, now) - waitMinutes(b, now));
    case "name":
      return arr.sort((a, b) =>
        a.name.localeCompare(b.name, "es", { sensitivity: "base" })
      );
    case "triage":
    default:
      return arr.sort((a, b) => {
        const t = TRIAGE_ORDER[a.triage] - TRIAGE_ORDER[b.triage];
        if (t !== 0) return t;
        return waitMinutes(b, now) - waitMinutes(a, now);
      });
  }
}
