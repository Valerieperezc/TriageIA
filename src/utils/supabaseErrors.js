/**
 * Normaliza errores de PostgREST / Postgres por RLS o privilegios insuficientes.
 * @param {unknown} error
 * @returns {boolean}
 */
export function isPermissionDeniedError(error) {
  if (!error || typeof error !== "object") return false;
  const code = String(error.code ?? "");
  if (code === "42501" || code === "PGRST301") return true;
  const msg = String(error.message ?? error.details ?? error.hint ?? "").toLowerCase();
  return (
    msg.includes("permission denied") ||
    msg.includes("row-level security") ||
    msg.includes("new row violates row-level security policy") ||
    msg.includes("violates row-level security")
  );
}

export function permissionDeniedUserMessage() {
  return "No tienes permiso para esta operación.";
}

/** Clave duplicada (p. ej. request_id ya registrado en reintento idempotente). */
export function isDuplicateKeyError(error) {
  if (!error || typeof error !== "object") return false;
  const code = String(error.code ?? "");
  if (code === "23505") return true;
  const msg = String(error.message ?? error.details ?? "").toLowerCase();
  return msg.includes("duplicate key") || msg.includes("unique constraint");
}

/** PostgREST 400 cuando se pide una columna que aún no existe en profiles (p. ej. status). */
export function isMissingProfileColumnError(error) {
  if (!error || typeof error !== "object") return false;
  const code = String(error.code ?? "");
  const msg = String(
    error.message ?? error.details ?? error.hint ?? ""
  ).toLowerCase();

  if (code === "42703" || code === "PGRST204") return true;
  if (/column/i.test(msg) && /does not exist|schema cache|could not find/.test(msg)) {
    return true;
  }
  if (/could not find the .* column of 'profiles'/.test(msg)) return true;
  if (msg.includes("status") && /schema cache|does not exist|could not find/.test(msg)) {
    return true;
  }

  if (Number(error.status) === 400 && /profiles/.test(msg)) {
    return true;
  }

  return false;
}

export function isAuthRateLimitError(error) {
  if (!error || typeof error !== "object") return false;
  if (Number(error.status) === 429) return true;
  const msg = String(error.message ?? "").toLowerCase();
  return (
    msg.includes("rate limit") ||
    msg.includes("too many requests") ||
    msg.includes("email rate limit")
  );
}

export function isRlsRecursionError(error) {
  if (!error || typeof error !== "object") return false;
  const msg = String(error.message ?? error.details ?? "").toLowerCase();
  return msg.includes("infinite recursion") && msg.includes("profiles");
}
