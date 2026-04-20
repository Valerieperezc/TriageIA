/**
 * Clasificación en 5 niveles tipo CTAS (Canadian Triage and Acuity Scale).
 * I = mayor acuidad (más urgente), V = menor acuidad.
 * Es una heurística con signos vitales y criterios declarados; no sustituye
 * la aplicación formal del CTAS ni el criterio clínico.
 *
 * @param {number} temp - °C
 * @param {number} fc - lpm
 * @param {object} [options]
 * @param {number|null} [options.spo2] - % (0-100)
 * @param {number|null} [options.pain] - EVA 0-10
 * @param {boolean} [options.alteredConsciousness]
 * @param {boolean} [options.respiratoryDistress]
 * @returns {"I"|"II"|"III"|"IV"|"V"}
 */
export function calculateTriage(temp, fc, options = {}) {
  const spo2 =
    options.spo2 === undefined || options.spo2 === null || options.spo2 === ""
      ? null
      : Number(options.spo2);
  const pain =
    options.pain === undefined || options.pain === null || options.pain === ""
      ? null
      : Number(options.pain);
  const alteredConsciousness = Boolean(options.alteredConsciousness);
  const respiratoryDistress = Boolean(options.respiratoryDistress);

  /** 1 = CTAS I (más urgente) … 5 = CTAS V */
  let L = 5;

  // I — Resucitación / inestabilidad inmediata
  if (alteredConsciousness) L = Math.min(L, 1);
  if (Number.isFinite(spo2) && spo2 < 90) L = Math.min(L, 1);
  if (Number.isFinite(pain) && pain >= 9) L = Math.min(L, 1);
  if (temp > 40.5 || fc > 155) L = Math.min(L, 1);
  if (temp > 39.5 && fc > 135) L = Math.min(L, 1);

  // II — Emergente
  if (Number.isFinite(spo2) && spo2 >= 90 && spo2 < 94) L = Math.min(L, 2);
  if (respiratoryDistress) L = Math.min(L, 2);
  if (Number.isFinite(pain) && pain >= 7 && pain <= 8) L = Math.min(L, 2);
  if (temp > 39 || fc > 130) L = Math.min(L, 2);

  // III — Urgente
  if (Number.isFinite(pain) && pain >= 4 && pain <= 6) L = Math.min(L, 3);
  if (temp > 38 || fc > 120) L = Math.min(L, 3);

  // IV — Menos urgente
  if (Number.isFinite(pain) && pain >= 1 && pain <= 3) L = Math.min(L, 4);
  if (temp > 37.5 || fc > 100) L = Math.min(L, 4);

  const ROMAN = ["I", "II", "III", "IV", "V"];
  return /** @type {"I"|"II"|"III"|"IV"|"V"} */ (ROMAN[L - 1]);
}
