const TRIAGE_LEVELS = new Set(["I", "II", "III", "IV", "V"]);

/**
 * @param {Array<{ name: string, symptom?: string, triage: string }>} list
 * @param {{ triage?: string | null, search?: string }} opts
 */
export function filterPatients(list, { triage, search } = {}) {
  let out = Array.isArray(list) ? [...list] : [];

  if (triage && TRIAGE_LEVELS.has(triage)) {
    out = out.filter((p) => p.triage === triage);
  }

  const q = (search ?? "").trim().toLowerCase();
  if (q) {
    out = out.filter((p) => {
      const name = (p.name ?? "").toLowerCase();
      const symptom = (p.symptom ?? "").toLowerCase();
      return name.includes(q) || symptom.includes(q);
    });
  }

  return out;
}
