export function canCreatePatientByRole(role) {
  return ["admin", "recepcion", "enfermeria"].includes(role);
}

export function canSetInAttentionByRole(role) {
  return ["admin", "medico", "enfermeria"].includes(role);
}

export function canFinalizePatientByRole(role) {
  return ["admin", "medico"].includes(role);
}

/** Completar datos de identificación tras ingreso mínimo (crítico). */
export function canUpdatePatientDemographicsByRole(role) {
  return ["admin", "medico", "enfermeria"].includes(role);
}
