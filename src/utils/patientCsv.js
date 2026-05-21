import { toCsvString } from "./csv";
import { waitReferenceMs } from "./dashboardMetrics";

/**
 * CSV de pacientes (vista actual o lista completa).
 * @param {Array<object>} patients
 * @param {number} [now]
 * @returns {string} UTF-8 con BOM para Excel
 */
export function buildPatientsCsv(patients, now = Date.now()) {
  const headers = [
    "Nombre",
    "Edad",
    "Sintoma",
    "Temperatura",
    "FC",
    "SpO2",
    "Dolor_EVA",
    "Triage_asignado",
    "Triage_sugerido",
    "Motivo_cambio_CTAS",
    "Protocolo",
    "Estado",
    "Llegada_ms",
    "Registro_ms",
    "Primera_atencion_ms",
    "Minutos_espera_desde_llegada",
    "Ingreso_minimo",
    "Documento",
    "Telefono",
    "Alergias",
  ];
  const rows = patients.map((p) => {
    const start = waitReferenceMs(p, now);
    return [
      p.name,
      p.age,
      p.symptom,
      p.temp,
      p.fc,
      p.spo2 ?? "",
      p.pain ?? "",
      p.triage,
      p.triageSuggested ?? p.triage,
      p.triageOverrideReason ?? "",
      p.protocolVersion ?? "",
      p.status,
      start,
      p.createdAt,
      p.firstAttentionAt ?? "",
      String(Math.floor((now - start) / 60000)),
      p.fastTrack ? "si" : "no",
      p.documentId ?? "",
      p.phone ?? "",
      p.allergies ?? "",
    ];
  });
  return "\uFEFF" + toCsvString(headers, rows);
}
