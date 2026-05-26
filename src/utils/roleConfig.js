import {
  canCreatePatientByRole,
  canFinalizePatientByRole,
  canSetInAttentionByRole,
  canUpdatePatientDemographicsByRole,
  canViewAuditByRole,
  normalizeRole,
} from "./permissions";
import { roleLabel } from "./accountProfile";

/** Pantalla principal tras iniciar sesión */
export const ROLE_HOME_PATH = {
  admin: "/",
  medico: "/patients",
  recepcion: "/triage",
  enfermeria: "/",
};

export function getHomePathForRole(role) {
  const r = normalizeRole(role);
  return ROLE_HOME_PATH[r] ?? "/";
}

export function getRoleCapabilities(role) {
  return {
    canRegister: canCreatePatientByRole(role),
    canAttend: canSetInAttentionByRole(role),
    canFinalize: canFinalizePatientByRole(role),
    canEditDemographics: canUpdatePatientDemographicsByRole(role),
    canAudit: canViewAuditByRole(role),
  };
}

/** Textos cortos para UI (sidebar, banners) */
export function getRoleCapabilityLabels(role) {
  const c = getRoleCapabilities(role);
  const labels = [];
  if (c.canRegister) labels.push("Registrar pacientes (triage)");
  if (c.canAttend) labels.push("Pasar a «En atención»");
  if (c.canFinalize) labels.push("Finalizar paciente (salida)");
  if (c.canEditDemographics) labels.push("Completar datos del paciente");
  if (c.canAudit) labels.push("Ver historial de auditoría");
  if (labels.length === 0) {
    labels.push("Consultar pacientes y cola");
  }
  return labels;
}

export function getRoleWorkspaceTitle(role) {
  switch (role) {
    case "medico":
      return "Cola de pacientes";
    case "recepcion":
      return "Registro de ingreso";
    case "enfermeria":
      return "Triage y cola";
    case "admin":
      return "Dashboard clínico";
    default:
      return "Panel operativo";
  }
}

export function getRoleWorkspaceSubtitle(role) {
  const caps = getRoleCapabilities(role);
  if (role === "medico") {
    return "Atiende la cola y da salida (finalizar) a los pacientes.";
  }
  if (role === "recepcion") {
    return "Registra nuevos ingresos; no cambias estados de atención.";
  }
  if (role === "enfermeria") {
    return "Registras triage, atiendes y completas datos; no finalizas salida.";
  }
  if (role === "admin") {
    return "Vista global del turno, cola y auditoría.";
  }
  if (caps.canRegister && caps.canFinalize) {
    return "Acceso operativo completo.";
  }
  return `Sesión como ${roleLabel(role)}.`;
}

/** Orden del menú lateral según el flujo de cada rol */
export function getSidebarNavOrder(role) {
  switch (role) {
    case "recepcion":
      return ["triage", "patients", "dashboard", "audit", "settings"];
    case "medico":
      return ["patients", "dashboard", "settings"];
    case "enfermeria":
      return ["dashboard", "triage", "patients", "settings"];
    case "admin":
    default:
      return ["dashboard", "patients", "triage", "audit", "adminUsers", "settings"];
  }
}

export function getPatientsDefaultSort(role) {
  return role === "medico" || role === "enfermeria" ? "triage" : null;
}
