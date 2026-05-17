function envTrim(value) {
  if (value == null) return "";
  return String(value).trim();
}

/** Base del proyecto (solo host), sin rutas tipo /rest/v1 ni /auth/v1. */
export const supabaseUrl = (() => {
  const raw = envTrim(import.meta.env.VITE_SUPABASE_URL);
  if (!raw) return "";
  try {
    const u = new URL(raw);
    return `${u.protocol}//${u.host}`;
  } catch {
    return raw;
  }
})();

export const supabaseAnonKey = envTrim(import.meta.env.VITE_SUPABASE_ANON_KEY);
export const isSupabaseConfigured = Boolean(supabaseUrl && supabaseAnonKey);
