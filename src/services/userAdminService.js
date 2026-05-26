import { getSupabaseClient, isSupabaseConfigured } from "../lib/supabase";
import { roleLabel } from "../utils/accountProfile";
import { ADMIN_ASSIGNABLE_ROLES, normalizeRole } from "../utils/permissions";
import {
  readDemoRoleOverrides,
  readLocalUserRegistry,
  writeDemoRoleOverrides,
  writeLocalUserRegistry,
  USERS,
} from "./authService";
import { normalizeProfileStatus, statusLabel } from "../utils/userAccounts";
import {
  isMissingProfileColumnError,
  isPermissionDeniedError,
  isRlsRecursionError,
} from "../utils/supabaseErrors";
import { withTimeout } from "../utils/retry";

const ADMIN_OP_TIMEOUT_MS = 20_000;
const PROFILE_COLUMN_SETS = [
  "id, email, role, display_name, status, created_at",
  "id, email, role, display_name, created_at",
  "id, email, role, status, created_at",
  "id, email, role, created_at",
  "id, email, role",
];

export const MIGRATION_HINT =
  "Ejecuta docs/EJECUTAR-EN-SUPABASE.sql en Supabase → SQL Editor (incluye aprobación desde el panel).";

function mapProfileRow(row) {
  return {
    id: row.id ?? row.email,
    email: row.email,
    role: normalizeRole(row.role) ?? "medico",
    displayName: row.display_name ?? row.displayName ?? "",
    status: normalizeProfileStatus(row.status),
    createdAt: row.created_at ?? row.createdAt ?? null,
    roleLabel: roleLabel(row.role),
    statusLabel: statusLabel(row.status),
  };
}

export function listLocalUsersForAdmin() {
  const registry = readLocalUserRegistry();
  const demoRoleOverrides = readDemoRoleOverrides();
  const demoUsers = USERS.map((u) => ({
    id: u.email,
    email: u.email,
    role: normalizeRole(demoRoleOverrides[u.email]) ?? u.role,
    displayName: "",
    status: "approved",
    createdAt: null,
    roleLabel: roleLabel(u.role),
    statusLabel: statusLabel("approved"),
  }));

  const registered = registry.map((u) =>
    mapProfileRow({
      id: u.id ?? u.email,
      email: u.email,
      role: u.role,
      display_name: u.displayName,
      status: u.status,
      created_at: u.createdAt,
    })
  );

  const byEmail = new Map();
  for (const user of [...demoUsers, ...registered]) {
    byEmail.set(user.email, user);
  }
  return Array.from(byEmail.values()).sort((a, b) => {
    const da = a.createdAt ? new Date(a.createdAt).getTime() : 0;
    const db = b.createdAt ? new Date(b.createdAt).getTime() : 0;
    return db - da;
  });
}

async function fetchSupabaseProfiles() {
  const supabase = await getSupabaseClient();

  const query = (columns) =>
    supabase.from("profiles").select(columns).order("created_at", { ascending: false });

  let lastError = null;

  for (let i = 0; i < PROFILE_COLUMN_SETS.length; i += 1) {
    const columns = PROFILE_COLUMN_SETS[i];
    const { data, error } = await query(columns);

    if (!error) {
      const hasStatusColumn = columns.includes("status");
      return {
        data: (data ?? []).map((row) => ({
          ...row,
          status: hasStatusColumn
            ? normalizeProfileStatus(row.status)
            : "approved",
        })),
        error: null,
        needsMigration: !hasStatusColumn,
      };
    }

    lastError = error;
    if (isRlsRecursionError(error)) {
      break;
    }
    if (!isMissingProfileColumnError(error)) {
      break;
    }
  }

  return { data: null, error: lastError, needsMigration: true };
}

export async function listAllUsers() {
  if (!isSupabaseConfigured) {
    return { users: listLocalUsersForAdmin(), needsMigration: false };
  }

  const { data, error, needsMigration } = await withTimeout(
    fetchSupabaseProfiles(),
    ADMIN_OP_TIMEOUT_MS,
    "Tiempo de espera al cargar usuarios"
  );

  if (error) {
    if (isRlsRecursionError(error)) {
      throw new Error(
        `Error de políticas RLS en profiles (recursión infinita). ${MIGRATION_HINT}`
      );
    }
    if (isPermissionDeniedError(error)) {
      throw new Error(
        `No tienes permiso para listar usuarios. ${MIGRATION_HINT}`
      );
    }
    const msg = String(error.message ?? "");
    if (isMissingProfileColumnError(error) || /column.*status/i.test(msg)) {
      throw new Error(`Falta la columna status en profiles. ${MIGRATION_HINT}`);
    }
    throw new Error(msg || "No se pudo cargar la lista de usuarios");
  }

  const users = (data ?? []).map(mapProfileRow);
  users.sort((a, b) => {
    const order = { pending: 0, approved: 1, rejected: 2 };
    const diff = (order[a.status] ?? 9) - (order[b.status] ?? 9);
    if (diff !== 0) return diff;
    const da = a.createdAt ? new Date(a.createdAt).getTime() : 0;
    const db = b.createdAt ? new Date(b.createdAt).getTime() : 0;
    return db - da;
  });

  return { users, needsMigration };
}

function updateLocalUserStatus(userKey, status) {
  const registry = readLocalUserRegistry();
  const entry = registry.find((u) => u.id === userKey || u.email === userKey);
  if (!entry) {
    throw new Error("Usuario no encontrado en el registro local");
  }
  entry.status = status;
  writeLocalUserRegistry(registry);
  return mapProfileRow({
    id: entry.id ?? entry.email,
    email: entry.email,
    role: entry.role,
    display_name: entry.displayName,
    status: entry.status,
    created_at: entry.createdAt,
  });
}

async function updateSupabaseUserStatus(userId, normalizedStatus) {
  const supabase = await getSupabaseClient();

  const { data: rpcData, error: rpcError } = await withTimeout(
    supabase.rpc("set_user_account_status", {
      target_user_id: userId,
      new_status: normalizedStatus,
    }),
    ADMIN_OP_TIMEOUT_MS,
    "Tiempo de espera al actualizar el usuario"
  );

  if (!rpcError && rpcData) {
    return mapProfileRow(rpcData);
  }

  const rpcMsg = String(rpcError?.message ?? "").toLowerCase();
  const rpcMissing =
    rpcError?.code === "PGRST202" ||
    rpcMsg.includes("set_user_account_status") ||
    rpcMsg.includes("could not find the function");

  if (!rpcMissing) {
    if (isPermissionDeniedError(rpcError)) {
      throw new Error(`No tienes permiso para actualizar usuarios. ${MIGRATION_HINT}`);
    }
    throw new Error(rpcError?.message || "No se pudo actualizar el usuario");
  }

  const { data, error } = await withTimeout(
    supabase
      .from("profiles")
      .update({ status: normalizedStatus })
      .eq("id", userId)
      .select(PROFILE_COLUMN_SETS[0])
      .single(),
    ADMIN_OP_TIMEOUT_MS,
    "Tiempo de espera al actualizar el usuario"
  );

  if (error) {
    if (isMissingProfileColumnError(error)) {
      throw new Error(`No se puede aprobar sin la columna status. ${MIGRATION_HINT}`);
    }
    if (isPermissionDeniedError(error)) {
      throw new Error(`No tienes permiso para actualizar usuarios. ${MIGRATION_HINT}`);
    }
    throw new Error(error.message || "No se pudo actualizar el usuario");
  }

  if (normalizedStatus === "approved") {
    throw new Error(
      "Cuenta marcada como aprobada, pero falta la función set_user_account_status. Ejecuta docs/user-account-approval-rpc.sql para que el usuario pueda iniciar sesión sin configurar Supabase."
    );
  }

  return mapProfileRow(data);
}

export async function setUserApproval(userId, status) {
  const normalizedStatus = normalizeProfileStatus(status);
  if (!["approved", "rejected"].includes(normalizedStatus)) {
    throw new Error("Estado no válido");
  }

  if (!isSupabaseConfigured) {
    return updateLocalUserStatus(userId, normalizedStatus);
  }

  return updateSupabaseUserStatus(userId, normalizedStatus);
}

export function countPendingUsers(users) {
  return users.filter((u) => u.status === "pending").length;
}

export function isBuiltInDemoAccount(email) {
  return USERS.some((u) => u.email === email);
}

function deleteLocalUser(userKey, email) {
  if (isBuiltInDemoAccount(email)) {
    throw new Error("No se pueden eliminar las cuentas de demostración integradas");
  }

  const registry = readLocalUserRegistry();
  const nextRegistry = registry.filter(
    (u) => u.id !== userKey && u.email !== userKey && u.email !== email
  );
  if (nextRegistry.length === registry.length) {
    throw new Error("Usuario no encontrado");
  }
  writeLocalUserRegistry(nextRegistry);

  const overrides = readDemoRoleOverrides();
  if (overrides[email]) {
    delete overrides[email];
    writeDemoRoleOverrides(overrides);
  }

  return { id: userKey, email };
}

async function deleteSupabaseUser(userId) {
  const supabase = await getSupabaseClient();

  const { error: rpcError } = await withTimeout(
    supabase.rpc("delete_user_account", { target_user_id: userId }),
    ADMIN_OP_TIMEOUT_MS,
    "Tiempo de espera al eliminar el usuario"
  );

  if (!rpcError) {
    return { id: userId };
  }

  const rpcMsg = String(rpcError?.message ?? "").toLowerCase();
  const rpcMissing =
    rpcError?.code === "PGRST202" ||
    rpcMsg.includes("delete_user_account") ||
    rpcMsg.includes("could not find the function");

  if (rpcMissing) {
    throw new Error(
      "Falta la función delete_user_account. Ejecuta docs/user-account-approval-rpc.sql en Supabase."
    );
  }

  if (rpcMsg.includes("cannot delete yourself")) {
    throw new Error("No puedes eliminar tu propia cuenta");
  }

  if (isPermissionDeniedError(rpcError)) {
    throw new Error(`No tienes permiso para eliminar usuarios. ${MIGRATION_HINT}`);
  }

  throw new Error(rpcError?.message || "No se pudo eliminar el usuario");
}

export async function deleteUser(userId, email) {
  if (!userId && !email) {
    throw new Error("Usuario no válido");
  }

  if (!isSupabaseConfigured) {
    return deleteLocalUser(userId ?? email, email ?? userId);
  }

  const uuidRegex =
    /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
  if (!uuidRegex.test(String(userId))) {
    throw new Error("Identificador de usuario no válido para eliminar en Supabase");
  }

  await deleteSupabaseUser(userId);
  return { id: userId, email };
}

function updateLocalUserRole(userKey, role) {
  const registry = readLocalUserRegistry();
  const entry = registry.find((u) => u.id === userKey || u.email === userKey);
  if (entry) {
    entry.role = role;
    writeLocalUserRegistry(registry);
    return mapProfileRow({
      id: entry.id ?? entry.email,
      email: entry.email,
      role: entry.role,
      display_name: entry.displayName,
      status: entry.status,
      created_at: entry.createdAt,
    });
  }

  const demo = USERS.find((u) => u.email === userKey);
  if (demo) {
    const overrides = readDemoRoleOverrides();
    overrides[demo.email] = role;
    writeDemoRoleOverrides(overrides);
    return mapProfileRow({
      id: demo.email,
      email: demo.email,
      role,
      status: "approved",
    });
  }

  throw new Error("Usuario no encontrado");
}

export async function setUserRole(userId, role) {
  const normalizedRole = normalizeRole(role);
  if (!normalizedRole || !ADMIN_ASSIGNABLE_ROLES.includes(normalizedRole)) {
    throw new Error("Rol no válido");
  }

  if (!isSupabaseConfigured) {
    return updateLocalUserRole(userId, normalizedRole);
  }

  const supabase = await getSupabaseClient();
  const { data, error } = await withTimeout(
    supabase
      .from("profiles")
      .update({ role: normalizedRole })
      .eq("id", userId)
      .select(PROFILE_COLUMN_SETS[0])
      .single(),
    ADMIN_OP_TIMEOUT_MS,
    "Tiempo de espera al actualizar el rol"
  );

  if (error) {
    if (isPermissionDeniedError(error)) {
      throw new Error(`No tienes permiso para cambiar roles. ${MIGRATION_HINT}`);
    }
    throw new Error(error.message || "No se pudo actualizar el rol");
  }

  return mapProfileRow(data);
}
