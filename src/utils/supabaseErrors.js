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
