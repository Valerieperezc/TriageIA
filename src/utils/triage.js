/**
 * Presión arterial media (PAM), mmHg.
 * Fórmula: PAM = (PAS + 2 × PAD) / 3. Integra sistólica y diastólica y se asocia
 * mejor a la perfusión tisular que un solo componente aislado.
 *
 * @param {number} systolicMmHg - PAS (mmHg)
 * @param {number} diastolicMmHg - PAD (mmHg)
 * @returns {number|null} PAM o null si los datos no son finitos
 */
export function meanArterialPressure(systolicMmHg, diastolicMmHg) {
  const s = Number(systolicMmHg);
  const d = Number(diastolicMmHg);
  if (!Number.isFinite(s) || !Number.isFinite(d)) return null;
  return (s + 2 * d) / 3;
}

/**
 * Clasificación en 5 niveles tipo CTAS (Canadian Triage and Acuity Scale).
 * I = mayor acuidad (más urgente), V = menor acuidad.
 * Es una heurística con signos vitales y criterios declarados; no sustituye
 * la aplicación formal del CTAS ni el criterio clínico.
 *
 * La tensión arterial se valora con **PAM** (PAS + 2×PAD) / 3 cuando hay ambas cifras.
 *
 * @param {number} temp - °C
 * @param {number} fc - lpm
 * @param {object} [options]
 * @param {number|null} [options.spo2] - % (0-100)
 * @param {number|null} [options.pain] - EVA 0-10
 * @param {boolean} [options.alteredConsciousness]
 * @param {number|null} [options.respiratoryRate] - rpm
 * @param {number|null} [options.bpSystolic] - mmHg (PAS)
 * @param {number|null} [options.bpDiastolic] - mmHg (PAD)
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
  const rr =
    options.respiratoryRate === undefined ||
    options.respiratoryRate === null ||
    options.respiratoryRate === ""
      ? null
      : Number(options.respiratoryRate);
  const sys =
    options.bpSystolic === undefined ||
    options.bpSystolic === null ||
    options.bpSystolic === ""
      ? null
      : Number(options.bpSystolic);
  const dia =
    options.bpDiastolic === undefined ||
    options.bpDiastolic === null ||
    options.bpDiastolic === ""
      ? null
      : Number(options.bpDiastolic);

  const map = meanArterialPressure(
    sys === null ? NaN : sys,
    dia === null ? NaN : dia
  );

  /** 1 = CTAS I (más urgente) … 5 = CTAS V */
  let L = 5;

  // I — Resucitación / inestabilidad inmediata
  if (alteredConsciousness) L = Math.min(L, 1);
  if (Number.isFinite(spo2) && spo2 < 90) L = Math.min(L, 1);
  if (Number.isFinite(pain) && pain >= 9) L = Math.min(L, 1);
  if (temp > 40.5 || fc > 155) L = Math.min(L, 1);
  if (temp > 39.5 && fc > 135) L = Math.min(L, 1);
  if (Number.isFinite(rr) && rr >= 40) L = Math.min(L, 1);
  if (Number.isFinite(rr) && rr <= 8) L = Math.min(L, 1);
  /** PAM < 65 mmHg: umbral habitual de hipoperfusión / riesgo orgánico en guías simplificadas */
  if (map != null && map < 65) L = Math.min(L, 1);
  /** PAM muy elevada: riesgo de disfunción por hipertensión mal compensada (heurística) */
  if (map != null && map >= 135) L = Math.min(L, 1);

  // II — Emergente
  if (Number.isFinite(spo2) && spo2 >= 90 && spo2 < 94) L = Math.min(L, 2);
  if (Number.isFinite(rr) && rr >= 30 && rr < 40) L = Math.min(L, 2);
  if (Number.isFinite(rr) && rr > 8 && rr <= 12) L = Math.min(L, 2);
  /** PAM límite baja (perfusión dudosa) */
  if (map != null && map >= 65 && map < 75) L = Math.min(L, 2);
  /** PAM elevada sin alcanzar umbral de I */
  if (map != null && map >= 118 && map < 135) L = Math.min(L, 2);
  if (Number.isFinite(pain) && pain >= 7 && pain <= 8) L = Math.min(L, 2);
  if (temp > 39 || fc > 130) L = Math.min(L, 2);

  // III — Urgente
  if (Number.isFinite(pain) && pain >= 4 && pain <= 6) L = Math.min(L, 3);
  if (temp > 38 || fc > 120) L = Math.min(L, 3);
  if (Number.isFinite(rr) && rr > 24 && rr < 30) L = Math.min(L, 3);
  if (map != null && map >= 100 && map < 118) L = Math.min(L, 3);

  // IV — Menos urgente
  if (Number.isFinite(pain) && pain >= 1 && pain <= 3) L = Math.min(L, 4);
  if (temp > 37.5 || fc > 100) L = Math.min(L, 4);

  const ROMAN = ["I", "II", "III", "IV", "V"];
  return /** @type {"I"|"II"|"III"|"IV"|"V"} */ (ROMAN[L - 1]);
}
