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
import {
  isProfileApproved,
  normalizeProfileStatus,
  validateRegistrationInput,
} from "../utils/userAccounts";
import {
  isAuthRateLimitError,
  isMissingProfileColumnError,
  isRlsRecursionError,
} from "../utils/supabaseErrors";
import { withTimeout } from "../utils/retry";

const AUTH_OP_TIMEOUT_MS = 20_000;

const DEMO_ROLE_BY_EMAIL = {
  "admin@triage.com": "admin",
  "medico@triage.com": "medico",
  "recepcion@triage.com": "recepcion",
  "enfermeria@triage.com": "enfermeria",
};

export const LOCAL_SESSION_KEY = "triageia:local-user";
export const LOCAL_PROFILES_KEY = "triageia:account-profiles";
export const LOCAL_PASSWORDS_KEY = "triageia:local-passwords";
export const LOCAL_USER_REGISTRY_KEY = "triageia:user-registry";
export const LOCAL_DEMO_ROLE_OVERRIDES_KEY = "triageia:demo-role-overrides";

export const USERS = [
  { email: "admin@triage.com", role: "admin", password: "123456" },
  { email: "medico@triage.com", role: "medico", password: "123456" },
  { email: "recepcion@triage.com", role: "recepcion", password: "123456" },
  { email: "enfermeria@triage.com", role: "enfermeria", password: "123456" },
];

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
      "Tu cuenta aún no está habilitada. Si acabas de registrarte, espera a que un administrador la apruebe en el panel de Usuarios. Después podrás iniciar sesión con tu correo y contraseña."
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

export function readLocalUserRegistry() {
  try {
    const raw = localStorage.getItem(LOCAL_USER_REGISTRY_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

export function writeLocalUserRegistry(entries) {
  localStorage.setItem(LOCAL_USER_REGISTRY_KEY, JSON.stringify(entries));
}

export function readDemoRoleOverrides() {
  return readJsonMap(LOCAL_DEMO_ROLE_OVERRIDES_KEY);
}

export function writeDemoRoleOverrides(map) {
  writeJsonMap(LOCAL_DEMO_ROLE_OVERRIDES_KEY, map);
}

function findDemoUser(email) {
  return USERS.find((u) => u.email === email) ?? null;
}

function findRegistryUser(email) {
  return readLocalUserRegistry().find((u) => u.email === email) ?? null;
}

function profileStatusError(status) {
  const normalized = normalizeProfileStatus(status);
  if (normalized === "pending") {
    return new Error(
      "Tu cuenta está en espera de aprobación. Un administrador debe habilitarla desde el panel de Usuarios; entonces podrás iniciar sesión."
    );
  }
  if (normalized === "rejected") {
    return new Error(
      "Tu cuenta fue rechazada. Contacta al administrador si necesitas acceso."
    );
  }
  return null;
}

function assertProfileCanLogin(status) {
  const err = profileStatusError(status);
  if (err) throw err;
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
  const demo = findDemoUser(email);
  const registry = findRegistryUser(email);
  const account = demo ?? registry;
  if (!account) return null;

  const expected = demo
    ? getLocalPasswordForEmail(email)
    : registry?.password;
  if (!expected || expected !== password) return null;

  const status = demo ? "approved" : registry.status;
  try {
    assertProfileCanLogin(status);
  } catch (err) {
    throw err;
  }

  const localUser = mergeProfileIntoUser(
    {
      email: account.email,
      role: account.role,
      status,
    },
    {
      ...readLocalProfileForEmail(email),
      displayName: registry?.displayName ?? readLocalProfileForEmail(email).displayName,
    }
  );
  writeLocalSession(localUser);
  return localUser;
}

export function registerLocalDemo(payload) {
  const { valid, errors, values } = validateRegistrationInput(payload);
  if (!valid) {
    const first = Object.values(errors)[0];
    throw new Error(first || "Datos de registro no válidos");
  }

  if (findDemoUser(values.email) || findRegistryUser(values.email)) {
    throw new Error("Este correo ya está registrado");
  }

  const registry = readLocalUserRegistry();
  registry.push({
    id: `local-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
    email: values.email,
    password: values.password,
    role: values.role,
    displayName: values.displayName,
    status: "pending",
    createdAt: new Date().toISOString(),
  });
  writeLocalUserRegistry(registry);
  saveLocalAccountProfile(values.email, { displayName: values.displayName });

  return {
    email: values.email,
    pending: true,
  };
}

function mapSupabaseProfileRow(data, { legacyWithoutStatusColumn = false } = {}) {
  const role = normalizeRole(data?.role) ?? "medico";
  return {
    role,
    status: normalizeProfileStatus(data?.status, {
      legacyWithoutColumn: legacyWithoutStatusColumn,
    }),
    displayName: data?.display_name ?? "",
    phone: data?.phone ?? "",
    department: data?.department ?? "",
    jobTitle: data?.job_title ?? "",
  };
}

const PROFILE_READ_COLUMN_SETS = [
  "role, email, status, display_name, phone, department, job_title",
  "role, email, status, display_name",
  "role, email, status",
  "role, email",
];

async function fetchSupabaseProfile(userId, email) {
  const supabase = await getSupabaseClient();

  try {
    for (const columns of PROFILE_READ_COLUMN_SETS) {
      const { data, error } = await withTimeout(
        supabase.from("profiles").select(columns).eq("id", userId).single(),
        AUTH_OP_TIMEOUT_MS,
        "Tiempo de espera al leer el perfil"
      );

      if (!error && data) {
        const legacyWithoutStatusColumn = !columns.includes("status");
        return mapSupabaseProfileRow(data, { legacyWithoutStatusColumn });
      }

      if (isRlsRecursionError(error)) break;
      if (!isMissingProfileColumnError(error)) {
        const msg = String(error?.message ?? "").toLowerCase();
        if (!msg.includes("status") && Number(error?.status) !== 400) break;
      }
    }

    if (import.meta.env.DEV) {
      console.warn(
        "[TriageIA] No se pudo leer profiles. Si eres admin, ejecuta docs/fix-admin-login.sql en Supabase."
      );
    }
  } catch (err) {
    if (import.meta.env.DEV) {
      console.warn("[TriageIA] fetchSupabaseProfile:", err);
    }
  }

  const emailKey = String(email ?? "").trim().toLowerCase();
  const demoRole = DEMO_ROLE_BY_EMAIL[emailKey];
  return mapSupabaseProfileRow(
    demoRole
      ? { role: demoRole, status: "approved" }
      : { role: "medico", status: "pending" }
  );
}

async function buildSupabaseUser(sessionUser, { enforceApproval = true } = {}) {
  const profile = await fetchSupabaseProfile(sessionUser.id, sessionUser.email);
  const role = normalizeRole(profile.role) ?? "medico";
  let status = profile.status;

  // Admin atascado en pending tras migración: puede entrar para gestionar usuarios
  if (enforceApproval && role === "admin" && status === "pending") {
    status = "approved";
  }

  if (enforceApproval && !isProfileApproved(status)) {
    const supabase = await getSupabaseClient();
    await supabase.auth.signOut();
    throw profileStatusError(status);
  }
  return mergeProfileIntoUser(
    {
      id: sessionUser.id,
      email: sessionUser.email,
      role,
      status,
    },
    { ...profile, role, status }
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

async function applyPendingRegistrationProfile(supabase, userId, values) {
  const { error: rpcError } = await supabase.rpc("sync_own_profile_pending", {
    p_display_name: values.displayName,
    p_role: values.role,
  });

  if (!rpcError) return;

  const rpcMsg = String(rpcError?.message ?? "").toLowerCase();
  const rpcMissing =
    rpcError?.code === "PGRST202" || rpcMsg.includes("sync_own_profile_pending");

  const { error: updateError } = await supabase
    .from("profiles")
    .update({
      display_name: values.displayName,
      role: values.role,
      status: "pending",
    })
    .eq("id", userId);

  if (!updateError) return;

  if (import.meta.env.DEV) {
    console.warn(
      "[TriageIA] No se pudo marcar perfil como pendiente:",
      rpcMissing ? updateError.message : rpcError.message
    );
  }
}

export async function registerSupabase(payload) {
  if (!isSupabaseConfigured) {
    throw new Error("El registro requiere Supabase configurado en .env");
  }

  const { valid, errors, values } = validateRegistrationInput(payload);
  if (!valid) {
    const first = Object.values(errors)[0];
    throw new Error(first || "Datos de registro no válidos");
  }

  const supabase = await getSupabaseClient();
  const { data, error } = await withTimeout(
    supabase.auth.signUp({
      email: values.email,
      password: values.password,
      options: {
        data: {
          display_name: values.displayName,
          role: values.role,
        },
      },
    }),
    AUTH_OP_TIMEOUT_MS,
    "Tiempo de espera al registrar la cuenta"
  );

  if (error) {
    if (isAuthRateLimitError(error)) {
      throw new Error(
        "Demasiados intentos de registro. Espera unos minutos antes de volver a intentarlo."
      );
    }
    const msg = String(error.message ?? "").toLowerCase();
    if (msg.includes("already registered") || msg.includes("user already registered")) {
      throw new Error("Este correo ya está registrado");
    }
    const normalized = normalizeAuthError(error);
    throw normalized ?? new Error("No se pudo completar el registro");
  }

  const userId = data.user?.id ?? data.session?.user?.id;

  if (data.session?.user) {
    await applyPendingRegistrationProfile(supabase, data.session.user.id, values);
    await supabase.auth.signOut();
  } else if (userId) {
    // Sin sesión activa: el trigger handle_new_user debe crear el perfil en pending.
    await applyPendingRegistrationProfile(supabase, userId, values);
  }

  return {
    email: values.email,
    pending: true,
    message:
      "Solicitud registrada. Aparecerás como pendiente en el panel de Usuarios hasta que un administrador te habilite.",
  };
}

export async function registerAccount(payload) {
  if (!isSupabaseConfigured) {
    return registerLocalDemo(payload);
  }
  return registerSupabase(payload);
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
    "Tiempo de espera al cargar tu perfil."
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
