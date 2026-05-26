import { normalizeRole } from "./permissions";

export const PROFILE_STATUSES = ["pending", "approved", "rejected"];

/** Roles que un usuario puede solicitar al registrarse (no admin). */
export const REGISTERABLE_ROLES = ["medico", "recepcion", "enfermeria"];

const STATUS_LABELS = {
  pending: "En espera de aprobación",
  approved: "Habilitado",
  rejected: "Rechazado",
};

/**
 * @param {string | null | undefined} status
 * @param {{ legacyWithoutColumn?: boolean }} [options]
 */
export function normalizeProfileStatus(status, { legacyWithoutColumn = false } = {}) {
  const raw = String(status ?? "")
    .trim()
    .toLowerCase();
  if (PROFILE_STATUSES.includes(raw)) return raw;
  if (legacyWithoutColumn) return "approved";
  return "pending";
}

export function statusLabel(status) {
  return STATUS_LABELS[normalizeProfileStatus(status)] ?? status;
}

export function isProfileApproved(status) {
  return normalizeProfileStatus(status) === "approved";
}

export function validateRegistrationInput({ email, password, displayName, role }) {
  const errors = {};
  const normalizedEmail = String(email ?? "").trim().toLowerCase();
  const normalizedName = String(displayName ?? "").trim();
  const normalizedRole = normalizeRole(role);

  if (!normalizedEmail || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(normalizedEmail)) {
    errors.email = "Correo no válido";
  }
  if (String(password ?? "").length < 6) {
    errors.password = "Mínimo 6 caracteres";
  }
  if (!normalizedName) {
    errors.displayName = "Indica tu nombre completo";
  } else if (normalizedName.length > 80) {
    errors.displayName = "Máximo 80 caracteres";
  }
  if (!normalizedRole || !REGISTERABLE_ROLES.includes(normalizedRole)) {
    errors.role = "Selecciona un rol válido";
  }

  return {
    valid: Object.keys(errors).length === 0,
    errors,
    values: {
      email: normalizedEmail,
      password: String(password ?? ""),
      displayName: normalizedName,
      role: normalizedRole,
    },
  };
}
