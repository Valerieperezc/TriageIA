export const ACCOUNT_PROFILE_LIMITS = {
  displayName: 80,
  phone: 32,
  department: 80,
  jobTitle: 80,
  passwordMin: 6,
  passwordMax: 72,
};

const ROLE_LABELS = {
  admin: "Administrador",
  medico: "Médico",
  enfermeria: "Enfermería",
  recepcion: "Recepción",
};

export function roleLabel(role) {
  return ROLE_LABELS[role] ?? role ?? "Usuario";
}

export function accountInitials(user) {
  const name = String(user?.displayName ?? "").trim();
  if (name) {
    const parts = name.split(/\s+/).filter(Boolean);
    if (parts.length >= 2) {
      return `${parts[0].charAt(0)}${parts[1].charAt(0)}`.toUpperCase();
    }
    return name.slice(0, 2).toUpperCase();
  }
  const email = String(user?.email ?? "");
  const base = email.split("@")[0] ?? "";
  const chunks = base.split(/[._-]/).filter(Boolean);
  if (chunks.length >= 2) {
    return `${chunks[0].charAt(0)}${chunks[1].charAt(0)}`.toUpperCase();
  }
  return (base.slice(0, 2) || "U").toUpperCase();
}

export function emptyAccountProfile() {
  return {
    displayName: "",
    phone: "",
    department: "",
    jobTitle: "",
  };
}

function trimField(value, max) {
  const s = value == null ? "" : String(value).trim();
  if (s.length > max) return s.slice(0, max);
  return s;
}

/**
 * @param {Record<string, unknown>} raw
 * @returns {{ valid: boolean, errors: Record<string, string>, values: ReturnType<typeof emptyAccountProfile> }}
 */
export function validateAccountProfileForm(raw) {
  const errors = {};
  const values = {
    displayName: trimField(raw.displayName, ACCOUNT_PROFILE_LIMITS.displayName),
    phone: trimField(raw.phone, ACCOUNT_PROFILE_LIMITS.phone),
    department: trimField(raw.department, ACCOUNT_PROFILE_LIMITS.department),
    jobTitle: trimField(raw.jobTitle, ACCOUNT_PROFILE_LIMITS.jobTitle),
  };

  if (values.phone && !/^[\d\s+().-]{6,32}$/.test(values.phone)) {
    errors.phone = "Teléfono no válido";
  }

  return { valid: Object.keys(errors).length === 0, errors, values };
}

/**
 * @param {{ currentPassword: string, newPassword: string, confirmPassword: string }} raw
 */
export function validatePasswordChangeForm(raw) {
  const errors = {};
  const currentPassword = String(raw.currentPassword ?? "");
  const newPassword = String(raw.newPassword ?? "");
  const confirmPassword = String(raw.confirmPassword ?? "");

  if (!currentPassword) {
    errors.currentPassword = "Indica tu contraseña actual";
  }
  if (newPassword.length < ACCOUNT_PROFILE_LIMITS.passwordMin) {
    errors.newPassword = `Mínimo ${ACCOUNT_PROFILE_LIMITS.passwordMin} caracteres`;
  } else if (newPassword.length > ACCOUNT_PROFILE_LIMITS.passwordMax) {
    errors.newPassword = `Máximo ${ACCOUNT_PROFILE_LIMITS.passwordMax} caracteres`;
  }
  if (newPassword !== confirmPassword) {
    errors.confirmPassword = "Las contraseñas no coinciden";
  }
  if (currentPassword && newPassword && currentPassword === newPassword) {
    errors.newPassword = "La nueva contraseña debe ser distinta";
  }

  return {
    valid: Object.keys(errors).length === 0,
    errors,
    values: { currentPassword, newPassword, confirmPassword },
  };
}

/**
 * @param {{ newEmail: string, password: string }} raw
 */
export function validateEmailChangeForm(raw) {
  const errors = {};
  const newEmail = String(raw.newEmail ?? "").trim().toLowerCase();
  const password = String(raw.password ?? "");

  if (!newEmail || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(newEmail)) {
    errors.newEmail = "Correo no válido";
  }
  if (!password) {
    errors.password = "Confirma con tu contraseña actual";
  }

  return {
    valid: Object.keys(errors).length === 0,
    errors,
    values: { newEmail, password },
  };
}

export function mergeProfileIntoUser(user, profile) {
  if (!user) return null;
  const base = emptyAccountProfile();
  return {
    ...user,
    displayName: profile?.displayName ?? base.displayName,
    phone: profile?.phone ?? base.phone,
    department: profile?.department ?? base.department,
    jobTitle: profile?.jobTitle ?? base.jobTitle,
  };
}
