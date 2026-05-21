import {
  CTAS_LEVEL_RANK,
  CTAS_LEVELS,
  CTAS_PROTOCOL_VERSION,
  CTAS_RED_FLAGS,
  getChiefComplaintByCode,
  isValidCtasLevel,
} from "../constants/ctasProtocol";
import { calculateTriage } from "./triage";

/**
 * @param {string} level Roman I–V
 * @returns {number} 1 = más urgente … 5 = menos urgente
 */
export function ctasLevelRank(level) {
  return CTAS_LEVEL_RANK[level] ?? 5;
}

function rankToRoman(rank) {
  return CTAS_LEVELS[Math.max(0, Math.min(4, rank - 1))];
}

/**
 * Nivel más urgente (menor rank) entre varios ranks numéricos.
 * @param  {...number} ranks
 */
function minRank(...ranks) {
  const finite = ranks.filter((r) => Number.isFinite(r) && r >= 1 && r <= 5);
  if (finite.length === 0) return 5;
  return Math.min(...finite);
}

/**
 * Sugerencia CTAS: motivo de consulta + discriminadores + signos vitales + vía rápida.
 * Toma siempre el nivel **más urgente** (más conservador para seguridad).
 *
 * @param {object} input
 * @param {string} input.chiefComplaintCode
 * @param {string[]} [input.redFlags]
 * @param {boolean} [input.fastTrack]
 * @param {number} [input.age]
 * @param {number} input.temp
 * @param {number} input.fc
 * @param {object} [input.vitals] spo2, pain, alteredConsciousness, respiratoryRate, bpSystolic, bpDiastolic
 * @returns {{ level: "I"|"II"|"III"|"IV"|"V", protocolVersion: string, vitalsLevel: string, complaintLevel: string, flagsLevel: string }}
 */
export function suggestCtasLevel(input) {
  const complaint = getChiefComplaintByCode(input.chiefComplaintCode);
  const complaintRank = complaint?.baseLevel ?? 3;

  const flags = Array.isArray(input.redFlags) ? input.redFlags : [];
  let flagsRank = 5;
  const redMinByCode = Object.fromEntries(
    CTAS_RED_FLAGS.map((f) => [f.code, f.minLevel])
  );
  for (const code of flags) {
    if (redMinByCode[code] != null) {
      flagsRank = Math.min(flagsRank, redMinByCode[code]);
    }
  }

  const vitals = input.vitals ?? {};
  const vitalsLevel = calculateTriage(input.temp, input.fc, vitals);
  const vitalsRank = ctasLevelRank(vitalsLevel);

  let fastTrackRank = 5;
  if (input.fastTrack) {
    fastTrackRank = 2;
  }

  const age = Number(input.age);
  if (Number.isFinite(age) && age < 3 && input.temp > 38) {
    flagsRank = Math.min(flagsRank, 2);
  }

  if (vitals.alteredConsciousness) {
    flagsRank = Math.min(flagsRank, 1);
  }

  const combinedRank = minRank(
    complaintRank,
    flagsRank,
    vitalsRank,
    fastTrackRank
  );

  return {
    level: rankToRoman(combinedRank),
    protocolVersion: CTAS_PROTOCOL_VERSION,
    chiefComplaintCode: input.chiefComplaintCode,
    vitalsLevel,
    complaintLevel: rankToRoman(complaintRank),
    flagsLevel: rankToRoman(flagsRank),
  };
}

/**
 * Subclasificación: asignar un nivel menos urgente que la sugerencia.
 */
export function isUndertriage(suggested, assigned) {
  if (!isValidCtasLevel(suggested) || !isValidCtasLevel(assigned)) {
    return false;
  }
  return ctasLevelRank(assigned) > ctasLevelRank(suggested);
}

/**
 * @param {object} opts
 * @param {string} opts.suggested
 * @param {string} opts.assigned
 * @param {string} [opts.overrideReasonCode]
 * @param {string} [opts.overrideNote]
 * @returns {{ valid: boolean, error?: string }}
 */
export function validateTriageAssignment({
  suggested,
  assigned,
  overrideReasonCode,
  overrideNote,
}) {
  if (!isValidCtasLevel(suggested)) {
    return { valid: false, error: "Falta la sugerencia del sistema." };
  }
  if (!isValidCtasLevel(assigned)) {
    return { valid: false, error: "Debe asignar un nivel CTAS definitivo." };
  }

  if (!isUndertriage(suggested, assigned)) {
    return { valid: true };
  }

  const code = String(overrideReasonCode ?? "").trim();
  const note = String(overrideNote ?? "").trim();

  if (!code) {
    return {
      valid: false,
      error:
        "La asignación es menos urgente que la sugerencia: indique el motivo del cambio.",
    };
  }

  if (code === "other" && note.length < 10) {
    return {
      valid: false,
      error: "Para «Otro», describa el motivo (mínimo 10 caracteres).",
    };
  }

  if (note.length > 0 && note.length < 5) {
    return {
      valid: false,
      error: "La nota de justificación es demasiado corta.",
    };
  }

  return { valid: true };
}

export function formatOverrideSummary(code, note) {
  const parts = [];
  if (code) parts.push(code);
  if (note) parts.push(note);
  return parts.join(" — ").trim() || null;
}
