/**
 * Protocolo CTAS implementado en TriageIA (ayuda a la decisión).
 * Versión documentada; cambios de umbrales deben incrementar PROTOCOL_VERSION.
 */
export const CTAS_PROTOCOL_VERSION = "ctas-triageia-2026-01";

export const CTAS_LEVELS = ["I", "II", "III", "IV", "V"];

export const CTAS_LEVEL_RANK = { I: 1, II: 2, III: 3, IV: 4, V: 5 };

/**
 * Textos y estilos por nivel CTAS (referencia operativa CTAS canadiense).
 * @type {Record<string, { label: string, urgencyMessage: string, waitMinutes: number|null, badgeClass: string, cardSurfaceClass: string, pickerActiveClass: string, pickerIdleClass: string, borderAccentClass: string, accentBarClass: string, iconClass: string, iconSurfaceClass: string }>}
 */
export const CTAS_LEVEL_INFO = {
  I: {
    label: "Resucitación",
    urgencyMessage: "Requiere atención inmediata",
    waitMinutes: 0,
    badgeClass: "badge-red",
    cardSurfaceClass:
      "border-red-400/80 bg-red-50/90 dark:border-red-800/70 dark:bg-red-950/45",
    pickerActiveClass:
      "border-red-600 bg-red-600 text-white shadow-md ring-2 ring-red-500/40",
    pickerIdleClass:
      "border-red-200 bg-red-50/80 text-red-900 hover:border-red-400 dark:border-red-900/60 dark:bg-red-950/40 dark:text-red-100",
    borderAccentClass: "border-l-red-500",
    accentBarClass: "from-red-500 to-red-700",
    iconClass: "text-red-600 dark:text-red-400",
    iconSurfaceClass: "bg-red-100 dark:bg-red-950/60",
  },
  II: {
    label: "Emergente",
    urgencyMessage: "Tiempo máximo de espera: 15 minutos",
    waitMinutes: 15,
    badgeClass: "badge-orange",
    cardSurfaceClass:
      "border-orange-400/80 bg-orange-50/90 dark:border-orange-800/70 dark:bg-orange-950/40",
    pickerActiveClass:
      "border-orange-600 bg-orange-600 text-white shadow-md ring-2 ring-orange-500/40",
    pickerIdleClass:
      "border-orange-200 bg-orange-50/80 text-orange-950 hover:border-orange-400 dark:border-orange-900/60 dark:bg-orange-950/35 dark:text-orange-100",
    borderAccentClass: "border-l-orange-500",
    accentBarClass: "from-orange-400 to-orange-600",
    iconClass: "text-orange-600 dark:text-orange-400",
    iconSurfaceClass: "bg-orange-100 dark:bg-orange-950/60",
  },
  III: {
    label: "Urgente",
    urgencyMessage: "Tiempo máximo de espera: 30 minutos",
    waitMinutes: 30,
    badgeClass: "badge-amber",
    cardSurfaceClass:
      "border-amber-400/80 bg-amber-50/90 dark:border-amber-800/70 dark:bg-amber-950/40",
    pickerActiveClass:
      "border-amber-600 bg-amber-500 text-amber-950 shadow-md ring-2 ring-amber-500/40",
    pickerIdleClass:
      "border-amber-200 bg-amber-50/80 text-amber-950 hover:border-amber-400 dark:border-amber-900/60 dark:bg-amber-950/35 dark:text-amber-100",
    borderAccentClass: "border-l-amber-500",
    accentBarClass: "from-amber-400 to-amber-600",
    iconClass: "text-amber-700 dark:text-amber-400",
    iconSurfaceClass: "bg-amber-100 dark:bg-amber-950/60",
  },
  IV: {
    label: "Menos urgente",
    urgencyMessage: "Tiempo máximo de espera: 60 minutos",
    waitMinutes: 60,
    badgeClass: "badge-lime",
    cardSurfaceClass:
      "border-lime-400/80 bg-lime-50/90 dark:border-lime-800/70 dark:bg-lime-950/35",
    pickerActiveClass:
      "border-lime-700 bg-lime-600 text-white shadow-md ring-2 ring-lime-500/40",
    pickerIdleClass:
      "border-lime-200 bg-lime-50/80 text-lime-950 hover:border-lime-400 dark:border-lime-900/60 dark:bg-lime-950/30 dark:text-lime-100",
    borderAccentClass: "border-l-lime-600",
    accentBarClass: "from-lime-500 to-lime-700",
    iconClass: "text-lime-700 dark:text-lime-400",
    iconSurfaceClass: "bg-lime-100 dark:bg-lime-950/60",
  },
  V: {
    label: "No urgente",
    urgencyMessage: "Tiempo máximo de espera: 120 minutos",
    waitMinutes: 120,
    badgeClass: "badge-blue",
    cardSurfaceClass:
      "border-sky-400/80 bg-sky-50/90 dark:border-sky-800/70 dark:bg-sky-950/40",
    pickerActiveClass:
      "border-sky-600 bg-sky-600 text-white shadow-md ring-2 ring-sky-500/40",
    pickerIdleClass:
      "border-sky-200 bg-sky-50/80 text-sky-950 hover:border-sky-400 dark:border-sky-900/60 dark:bg-sky-950/35 dark:text-sky-100",
    borderAccentClass: "border-l-sky-500",
    accentBarClass: "from-sky-500 to-sky-700",
    iconClass: "text-sky-600 dark:text-sky-400",
    iconSurfaceClass: "bg-sky-100 dark:bg-sky-950/60",
  },
};

export function getCtasLevelInfo(level) {
  return CTAS_LEVEL_INFO[level] ?? null;
}

/** Motivos de consulta estructurados (línea base CTAS simplificada). */
export const CTAS_CHIEF_COMPLAINTS = [
  {
    code: "cardiac_chest_pain",
    label: "Dolor torácico cardíaco sospechado",
    baseLevel: 2,
  },
  {
    code: "respiratory_distress",
    label: "Dificultad respiratoria / disnea",
    baseLevel: 2,
  },
  {
    code: "stroke_symptoms",
    label: "Síntomas neurológicos agudos (AVC / TIA)",
    baseLevel: 2,
  },
  {
    code: "altered_mental",
    label: "Alteración del estado mental",
    baseLevel: 2,
  },
  {
    code: "severe_trauma",
    label: "Trauma mayor / politrauma",
    baseLevel: 2,
  },
  {
    code: "uncontrolled_bleeding",
    label: "Hemorragia activa / no controlada",
    baseLevel: 2,
  },
  {
    code: "overdose_poisoning",
    label: "Intoxicación / sobredosis",
    baseLevel: 2,
  },
  {
    code: "abdominal_pain",
    label: "Dolor abdominal",
    baseLevel: 3,
  },
  {
    code: "fever_infection",
    label: "Fiebre / posible infección",
    baseLevel: 3,
  },
  {
    code: "headache",
    label: "Cefalea",
    baseLevel: 3,
  },
  {
    code: "vomiting_dehydration",
    label: "Vómitos / deshidratación",
    baseLevel: 3,
  },
  {
    code: "minor_injury",
    label: "Lesión menor",
    baseLevel: 4,
  },
  {
    code: "minor_illness",
    label: "Malestar general / síntomas leves",
    baseLevel: 4,
  },
  {
    code: "non_urgent",
    label: "Consulta no urgente / trámite",
    baseLevel: 5,
  },
  {
    code: "other",
    label: "Otro (detallar en síntoma)",
    baseLevel: 3,
  },
];

/** Discriminadores / banderas rojas que elevan la sugerencia. */
export const CTAS_RED_FLAGS = [
  {
    code: "active_seizure",
    label: "Convulsión activa",
    minLevel: 1,
  },
  {
    code: "severe_pain_uncontrolled",
    label: "Dolor severo no controlado",
    minLevel: 2,
  },
  {
    code: "pregnancy_complication",
    label: "Embarazo con complicación aguda",
    minLevel: 2,
  },
  {
    code: "immunocompromised",
    label: "Inmunosupresión / neutropenia conocida",
    minLevel: 2,
  },
  {
    code: "anticoagulant_bleeding_risk",
    label: "Anticoagulado con sangrado / riesgo hemorrágico",
    minLevel: 2,
  },
  {
    code: "chest_pain_radiation",
    label: "Dolor torácico con irradiación / sudoración",
    minLevel: 2,
  },
];

export const CTAS_OVERRIDE_REASONS = [
  { code: "clinical_judgment", label: "Criterio clínico del profesional" },
  { code: "patient_appearance", label: "Apariencia / evolución en sala" },
  { code: "incomplete_data", label: "Datos incompletos en el registro" },
  { code: "repeat_visit", label: "Reingreso / conocimiento previo del caso" },
  { code: "resource_triage", label: "Ajuste operativo del servicio" },
  { code: "other", label: "Otro (obligatorio detallar en nota)" },
];

export const CTAS_SAFETY_DISCLAIMER =
  "Clasificación de apoyo basada en CTAS (Canadian Triage and Acuity Scale). " +
  "No sustituye el juicio del personal acreditado en triage. " +
  "La prioridad definitiva la asigna el profesional.";

export function getChiefComplaintByCode(code) {
  return CTAS_CHIEF_COMPLAINTS.find((c) => c.code === code) ?? null;
}

export function isValidChiefComplaintCode(code) {
  return CTAS_CHIEF_COMPLAINTS.some((c) => c.code === code);
}

export function isValidCtasLevel(level) {
  return CTAS_LEVELS.includes(level);
}
