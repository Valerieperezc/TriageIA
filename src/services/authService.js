import { getSupabaseClient, isSupabaseConfigured } from "../lib/supabase";

const USERS = [
  { email: "admin@triage.com", role: "admin", password: "123456" },
  { email: "medico@triage.com", role: "medico", password: "123456" },
  { email: "recepcion@triage.com", role: "recepcion", password: "123456" },
  { email: "enfermeria@triage.com", role: "enfermeria", password: "123456" },
];

export const LOCAL_SESSION_KEY = "triageia:local-user";

function isInvalidCredentialsError(error) {
  const msg = String(error?.message ?? "").toLowerCase();
  const status = Number(error?.status ?? error?.code);
  return status === 400 || msg.includes("invalid login credentials");
}

function normalizeAuthError(error) {
  if (isInvalidCredentialsError(error)) {
    return null;
  }

  const msg = String(error?.message ?? "").toLowerCase();
  const isNetworkRelated =
    /network|fetch|timeout|timed out|temporar|connection|econn|failed to fetch/.test(msg) ||
    Number(error?.status) >= 500;

  if (isNetworkRelated) {
    return new Error("No se pudo conectar al servicio de autenticación. Intenta de nuevo.");
  }

  return new Error("No se pudo iniciar sesión en este momento.");
}

export function readLocalSession() {
  try {
    const raw = localStorage.getItem(LOCAL_SESSION_KEY);
    return raw ? JSON.parse(raw) : null;
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
  const found = USERS.find((u) => u.email === email && u.password === password);
  if (!found) return null;
  const localUser = { email: found.email, role: found.role };
  writeLocalSession(localUser);
  return localUser;
}

async function getUserRole(user) {
  const supabase = await getSupabaseClient();
  const { data, error } = await supabase
    .from("profiles")
    .select("role")
    .eq("id", user.id)
    .single();

  if (error || !data?.role) {
    return "medico";
  }
  return data.role;
}

export async function getCurrentSupabaseUser() {
  if (!isSupabaseConfigured) return null;
  const supabase = await getSupabaseClient();
  const { data } = await supabase.auth.getSession();
  const sessionUser = data.session?.user;
  if (!sessionUser) return null;
  const role = await getUserRole(sessionUser);
  return { id: sessionUser.id, email: sessionUser.email, role };
}

export async function loginSupabase(email, password) {
  if (!isSupabaseConfigured) return null;
  const supabase = await getSupabaseClient();
  const { data, error } = await supabase.auth.signInWithPassword({ email, password });
  if (error) {
    const normalized = normalizeAuthError(error);
    if (!normalized) return null;
    throw normalized;
  }
  if (!data.user) return null;
  const role = await getUserRole(data.user);
  return { id: data.user.id, email: data.user.email, role };
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

      const { data: listener } = supabase.auth.onAuthStateChange(async (_event, session) => {
        if (!session?.user) {
          onUserChange(null);
          return;
        }
        const role = await getUserRole(session.user);
        onUserChange({ id: session.user.id, email: session.user.email, role });
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
