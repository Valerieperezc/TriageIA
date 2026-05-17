const VALID_ROLES = new Set(["admin", "medico", "recepcion", "enfermeria"]);

/** Normaliza el rol leído de Supabase o sesión local. */
export function normalizeRole(role) {
  const raw = String(role ?? "")
    .trim()
    .toLowerCase()
    .normalize("NFD")
    .replace(/\p{M}/gu, "");
  if (VALID_ROLES.has(raw)) return raw;
  if (raw === "administrador" || raw === "administrator") return "admin";
  if (raw === "doctor") return "medico";
  if (raw === "reception") return "recepcion";
  if (raw === "nurse" || raw === "enfermera") return "enfermeria";
  return null;
}

export function canViewAuditByRole(role) {
  return normalizeRole(role) === "admin";
}

export function canCreatePatientByRole(role) {
  return ["admin", "recepcion", "enfermeria"].includes(normalizeRole(role));
}

export function canSetInAttentionByRole(role) {
  const r = normalizeRole(role);
  return ["admin", "medico", "enfermeria"].includes(r);
}

export function canFinalizePatientByRole(role) {
  const r = normalizeRole(role);
  return ["admin", "medico"].includes(r);
}

/** Completar datos de identificación tras ingreso mínimo (crítico). */
export function canUpdatePatientDemographicsByRole(role) {
  const r = normalizeRole(role);
  return ["admin", "medico", "enfermeria"].includes(r);
}
