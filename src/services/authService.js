import {
  getSupabaseClient,
  isSupabaseConfigured,
  supabaseAnonKey,
  supabaseUrl,
} from "../lib/supabase";
import {
  emptyAccountProfile,
  mergeProfileIntoUser,
} from "../utils/accountProfile";
import { normalizeRole } from "../utils/permissions";
import { withTimeout } from "../utils/retry";

const AUTH_OP_TIMEOUT_MS = 20_000;

const DEMO_ROLE_BY_EMAIL = {
  "admin@triage.com": "admin",
  "medico@triage.com": "medico",
  "recepcion@triage.com": "recepcion",
  "enfermeria@triage.com": "enfermeria",
};

const USERS = [
  { email: "admin@triage.com", role: "admin", password: "123456" },
  { email: "medico@triage.com", role: "medico", password: "123456" },
  { email: "recepcion@triage.com", role: "recepcion", password: "123456" },
  { email: "enfermeria@triage.com", role: "enfermeria", password: "123456" },
];

export const LOCAL_SESSION_KEY = "triageia:local-user";
export const LOCAL_PROFILES_KEY = "triageia:account-profiles";
export const LOCAL_PASSWORDS_KEY = "triageia:local-passwords";

function isInvalidCredentialsError(error) {
  const msg = String(error?.message ?? "").toLowerCase();
  const code = String(error?.code ?? "").toLowerCase();
  if (msg.includes("email not confirmed") || code === "email_not_confirmed") {
    return false;
  }
  if (
    msg.includes("invalid login credentials") ||
    msg.includes("invalid email or password") ||
    msg.includes("invalid credentials")
  ) {
    return true;
  }
  const status = Number(error?.status);
  if (status === 400 && /invalid|wrong password|incorrect password/i.test(msg)) {
    return true;
  }
  return false;
}

function normalizeAuthError(error) {
  const msg = String(error?.message ?? "").trim();
  const msgLower = msg.toLowerCase();
  const code = String(error?.code ?? "").toLowerCase();

  if (msgLower.includes("email not confirmed") || code === "email_not_confirmed") {
    return new Error(
      "Tu correo aún no está confirmado. En Supabase: Authentication → Providers → Email → desactiva “Confirm email” para pruebas, o abre el usuario y confirma el correo."
    );
  }

  if (isInvalidCredentialsError(error)) {
    return null;
  }

  if (
    msgLower.includes("database error querying schema") ||
    msgLower.includes("converting null to string")
  ) {
    return new Error(
      "Error en la base de datos de Auth (usuarios creados por SQL con columnas vacías). En Supabase SQL Editor ejecuta el bloque REPARAR de docs/seed-demo-users.sql y vuelve a intentar el login."
    );
  }

  const isNetworkRelated =
    /network|fetch|timeout|timed out|temporar|connection|econn|failed to fetch/.test(
      msgLower
    ) || Number(error?.status) >= 500;

  if (isNetworkRelated) {
    const detail =
      msg && !/^failed to fetch$/i.test(msg) ? ` Detalle técnico: ${msg}.` : "";
    return new Error(
      `No se pudo conectar al servicio de autenticación.${detail} Comprueba tu internet, desactiva bloqueadores (uBlock, etc.), reinicia "npm run dev" tras editar .env, usa http://localhost:4173 y en Supabase → Authentication → URL Configuration añade esa URL como Site URL y en Redirect URLs.`
    );
  }

  if (msg) {
    return new Error(`No se pudo iniciar sesión: ${msg}`);
  }
  return new Error("No se pudo iniciar sesión en este momento.");
}

function readJsonMap(key) {
  try {
    const raw = localStorage.getItem(key);
    if (!raw) return {};
    const parsed = JSON.parse(raw);
    return parsed && typeof parsed === "object" ? parsed : {};
  } catch {
    return {};
  }
}

function writeJsonMap(key, map) {
  localStorage.setItem(key, JSON.stringify(map));
}

function readLocalProfileForEmail(email) {
  const map = readJsonMap(LOCAL_PROFILES_KEY);
  return { ...emptyAccountProfile(), ...(map[email] ?? {}) };
}

function getLocalPasswordForEmail(email) {
  const overrides = readJsonMap(LOCAL_PASSWORDS_KEY);
  if (overrides[email]) return overrides[email];
  return USERS.find((u) => u.email === email)?.password ?? null;
}

export function readLocalSession() {
  try {
    const raw = localStorage.getItem(LOCAL_SESSION_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw);
    if (!parsed?.email) return null;
    return mergeProfileIntoUser(parsed, readLocalProfileForEmail(parsed.email));
  } catch {
    return null;
  }
}

function writeLocalSession(user) {
  localStorage.setItem(LOCAL_SESSION_KEY, JSON.stringify(user));
}

export function clearLocalSession() {
  localStorage.removeItem(LOCAL_SESSION_KEY);
}

export function loginLocalDemo(email, password) {
  const expected = getLocalPasswordForEmail(email);
  if (!expected || expected !== password) return null;
  const found = USERS.find((u) => u.email === email);
  if (!found) return null;
  const localUser = mergeProfileIntoUser(
    { email: found.email, role: found.role },
    readLocalProfileForEmail(email)
  );
  writeLocalSession(localUser);
  return localUser;
}

function mapSupabaseProfileRow(data) {
  const role = normalizeRole(data?.role) ?? "medico";
  return {
    role,
    displayName: data?.display_name ?? "",
    phone: data?.phone ?? "",
    department: data?.department ?? "",
    jobTitle: data?.job_title ?? "",
  };
}

/** Si el proyecto Supabase no tiene columnas extendidas en profiles, no reintentar. */
let extendedProfileColumnsAvailable = null;

function isMissingProfileColumnError(error) {
  const msg = String(error?.message ?? error?.details ?? "");
  const code = String(error?.code ?? "");
  return (
    /column/i.test(msg) ||
    /42703/.test(msg) ||
    /PGRST204/.test(code) ||
    /schema cache/i.test(msg)
  );
}

async function fetchSupabaseProfile(userId, email) {
  const supabase = await getSupabaseClient();

  const readProfile = async (columns) => {
    const { data, error } = await supabase
      .from("profiles")
      .select(columns)
      .eq("id", userId)
      .single();
    return { data, error };
  };

  try {
    const { data: basic, error: basicError } = await withTimeout(
      readProfile("role, email"),
      AUTH_OP_TIMEOUT_MS,
      "Tiempo de espera al leer el perfil"
    );

    if (!basicError && basic) {
      if (extendedProfileColumnsAvailable !== false) {
        const { data: extra, error: extraError } = await withTimeout(
          readProfile("display_name, phone, department, job_title"),
          AUTH_OP_TIMEOUT_MS,
          "Tiempo de espera al leer el perfil"
        );

        if (!extraError && extra) {
          extendedProfileColumnsAvailable = true;
          return mapSupabaseProfileRow({ ...basic, ...extra });
        }

        if (extraError && isMissingProfileColumnError(extraError)) {
          extendedProfileColumnsAvailable = false;
        } else if (extraError && import.meta.env.DEV) {
          console.warn("[TriageIA] Perfil extendido:", extraError.message);
        }
      }

      return mapSupabaseProfileRow(basic);
    }

    if (import.meta.env.DEV && basicError) {
      console.warn("[TriageIA] No se pudo leer profiles:", basicError.message);
    }
  } catch (err) {
    if (import.meta.env.DEV) {
      console.warn("[TriageIA] fetchSupabaseProfile:", err);
    }
  }

  const fallbackRole =
    DEMO_ROLE_BY_EMAIL[String(email ?? "").trim().toLowerCase()] ?? "medico";
  return { ...mapSupabaseProfileRow(null), role: fallbackRole };
}

async function buildSupabaseUser(sessionUser) {
  const profile = await fetchSupabaseProfile(sessionUser.id, sessionUser.email);
  return mergeProfileIntoUser(
    { id: sessionUser.id, email: sessionUser.email, role: profile.role },
    profile
  );
}

export function saveLocalAccountProfile(email, patch) {
  const map = readJsonMap(LOCAL_PROFILES_KEY);
  map[email] = { ...readLocalProfileForEmail(email), ...patch };
  writeJsonMap(LOCAL_PROFILES_KEY, map);
}

export function changeLocalPassword(email, currentPassword, newPassword) {
  if (getLocalPasswordForEmail(email) !== currentPassword) {
    throw new Error("La contraseña actual no es correcta");
  }
  const map = readJsonMap(LOCAL_PASSWORDS_KEY);
  map[email] = newPassword;
  writeJsonMap(LOCAL_PASSWORDS_KEY, map);
}

export async function saveSupabaseAccountProfile(userId, patch) {
  const supabase = await getSupabaseClient();
  const row = {
    display_name: patch.displayName || null,
    phone: patch.phone || null,
    department: patch.department || null,
    job_title: patch.jobTitle || null,
  };

  const { error } = await supabase.from("profiles").update(row).eq("id", userId);

  if (error) {
    const msg = String(error.message ?? "");
    if (/column.*does not exist/i.test(msg)) {
      return;
    }
    throw new Error(msg || "No se pudo guardar el perfil");
  }
}

export async function changeSupabasePassword(email, currentPassword, newPassword) {
  const supabase = await getSupabaseClient();
  const { error: signInError } = await supabase.auth.signInWithPassword({
    email,
    password: currentPassword,
  });
  if (signInError) {
    if (isInvalidCredentialsError(signInError)) {
      throw new Error("La contraseña actual no es correcta");
    }
    const normalized = normalizeAuthError(signInError);
    throw normalized ?? new Error("No se pudo verificar la contraseña actual");
  }

  const { error } = await supabase.auth.updateUser({ password: newPassword });
  if (error) {
    throw new Error(error.message || "No se pudo cambiar la contraseña");
  }
}

export async function changeSupabaseEmail(userId, email, currentPassword, newEmail) {
  const supabase = await getSupabaseClient();
  const { error: signInError } = await supabase.auth.signInWithPassword({
    email,
    password: currentPassword,
  });
  if (signInError) {
    if (isInvalidCredentialsError(signInError)) {
      throw new Error("La contraseña no es correcta");
    }
    const normalized = normalizeAuthError(signInError);
    throw normalized ?? new Error("No se pudo verificar la contraseña");
  }

  const { error: updateError } = await supabase.auth.updateUser({ email: newEmail });
  if (updateError) {
    throw new Error(updateError.message || "No se pudo cambiar el correo");
  }

  await supabase.from("profiles").update({ email: newEmail }).eq("id", userId);
}

export async function saveAccountProfile(user, patch) {
  if (!user?.email) {
    throw new Error("Sesión no válida");
  }
  if (!isSupabaseConfigured) {
    saveLocalAccountProfile(user.email, patch);
    const next = mergeProfileIntoUser(user, patch);
    writeLocalSession(next);
    return next;
  }
  if (!user.id) {
    throw new Error("Sesión no válida");
  }
  await saveSupabaseAccountProfile(user.id, patch);
  return mergeProfileIntoUser(user, patch);
}

export async function changeAccountPassword(user, currentPassword, newPassword) {
  if (!user?.email) {
    throw new Error("Sesión no válida");
  }
  if (!isSupabaseConfigured) {
    changeLocalPassword(user.email, currentPassword, newPassword);
    return;
  }
  await changeSupabasePassword(user.email, currentPassword, newPassword);
}

export async function changeAccountEmail(user, currentPassword, newEmail) {
  if (!isSupabaseConfigured) {
    throw new Error("El cambio de correo solo está disponible con Supabase.");
  }
  if (!user?.id || !user?.email) {
    throw new Error("Sesión no válida");
  }
  await changeSupabaseEmail(user.id, user.email, currentPassword, newEmail);
  return mergeProfileIntoUser({ ...user, email: newEmail }, user);
}

export async function getCurrentSupabaseUser() {
  if (!isSupabaseConfigured) return null;
  const supabase = await getSupabaseClient();
  const { data } = await supabase.auth.getSession();
  const sessionUser = data.session?.user;
  if (!sessionUser) return null;
  return buildSupabaseUser(sessionUser);
}

/**
 * Comprueba si el navegador puede alcanzar Auth (útil para diagnosticar "Failed to fetch").
 * @returns {Promise<{ ok: boolean, status?: number, reason?: string }>}
 */
export async function probeSupabaseAuthReachable() {
  if (!isSupabaseConfigured) {
    return { ok: false, reason: "Supabase no configurado en .env" };
  }
  try {
    const res = await fetch(`${supabaseUrl}/auth/v1/health`, {
      headers: { apikey: supabaseAnonKey },
    });
    // 200 u otros códigos con cuerpo = el host responde; solo falla si no hay red/CORS/bloqueo.
    return { ok: true, status: res.status };
  } catch (err) {
    return {
      ok: false,
      reason: String(err?.message ?? err ?? "Error de red"),
    };
  }
}

export async function loginSupabase(email, password) {
  if (!isSupabaseConfigured) return null;
  const supabase = await getSupabaseClient();
  const { data, error } = await withTimeout(
    supabase.auth.signInWithPassword({ email, password }),
    AUTH_OP_TIMEOUT_MS,
    "Tiempo de espera al iniciar sesión. Revisa tu conexión o Supabase."
  );
  if (error) {
    const normalized = normalizeAuthError(error);
    if (!normalized) return null;
    throw normalized;
  }
  if (!data.user) return null;
  return withTimeout(
    buildSupabaseUser(data.user),
    AUTH_OP_TIMEOUT_MS,
    "Tiempo de espera al cargar tu perfil. Comprueba la tabla profiles en Supabase."
  );
}

export async function logoutSupabase() {
  if (!isSupabaseConfigured) return;
  const supabase = await getSupabaseClient();
  await supabase.auth.signOut();
}

export function subscribeSupabaseAuth(onUserChange) {
  if (!isSupabaseConfigured) {
    return () => {};
  }

  let unsubscribed = false;
  let subscription = null;

  getSupabaseClient()
    .then((supabase) => {
      if (unsubscribed || !supabase) {
        return;
      }

      const { data: listener } = supabase.auth.onAuthStateChange((_event, session) => {
        // No usar async directo aquí: bloquea signInWithPassword (deadlock de Supabase Auth).
        setTimeout(() => {
          if (unsubscribed) return;
          void (async () => {
            try {
              if (!session?.user) {
                onUserChange(null);
                return;
              }
              const nextUser = await buildSupabaseUser(session.user);
              if (!unsubscribed) {
                onUserChange(nextUser);
              }
            } catch {
              if (!unsubscribed) {
                onUserChange(null);
              }
            }
          })();
        }, 0);
      });
      subscription = listener.subscription;
    })
    .catch(() => {
      if (!unsubscribed) {
        onUserChange(null);
      }
    });

  return () => {
    unsubscribed = true;
    subscription?.unsubscribe();
  };
}
