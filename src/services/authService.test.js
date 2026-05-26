import { beforeEach, describe, expect, it, vi } from "vitest";
const { signInWithPassword, getSession, from, getSupabaseClient } = vi.hoisted(() => ({
  signInWithPassword: vi.fn(),
  getSession: vi.fn(),
  from: vi.fn(),
  getSupabaseClient: vi.fn(),
}));

const supabase = {
  auth: {
    signInWithPassword,
    getSession,
    signOut: vi.fn(),
    onAuthStateChange: vi.fn(() => ({
      data: { listener: { subscription: { unsubscribe: vi.fn() } } },
    })),
  },
  from,
};

vi.mock("../lib/supabase", () => ({
  isSupabaseConfigured: true,
  getSupabaseClient,
}));

import {
  changeLocalPassword,
  clearLocalSession,
  getCurrentSupabaseUser,
  LOCAL_SESSION_KEY,
  loginSupabase,
  loginLocalDemo,
  readLocalSession,
  saveLocalAccountProfile,
} from "./authService";

function createMemoryStorage() {
  const map = new Map();
  return {
    getItem(key) {
      return map.has(key) ? map.get(key) : null;
    },
    setItem(key, value) {
      map.set(key, value);
    },
    removeItem(key) {
      map.delete(key);
    },
  };
}

describe("authService local demo", () => {
  beforeEach(() => {
    globalThis.localStorage = createMemoryStorage();
    signInWithPassword.mockReset();
    getSession.mockReset();
    from.mockReset();
    getSupabaseClient.mockResolvedValue(supabase);
  });

  it("returns null for invalid local credentials", () => {
    const user = loginLocalDemo("x@triage.com", "bad");
    expect(user).toBeNull();
    expect(readLocalSession()).toBeNull();
  });

  it("persists and reads local session for valid credentials", () => {
    const user = loginLocalDemo("admin@triage.com", "123456");
    expect(user).toMatchObject({
      email: "admin@triage.com",
      role: "admin",
      displayName: "",
    });

    const raw = localStorage.getItem(LOCAL_SESSION_KEY);
    expect(raw).toContain("admin@triage.com");
    expect(readLocalSession()).toEqual(user);
  });

  it("saves local profile and changes local password", () => {
    loginLocalDemo("admin@triage.com", "123456");
    saveLocalAccountProfile("admin@triage.com", {
      displayName: "Admin Demo",
      phone: "+34 600 000 000",
    });
    const session = readLocalSession();
    expect(session.displayName).toBe("Admin Demo");
    expect(session.phone).toBe("+34 600 000 000");

    changeLocalPassword("admin@triage.com", "123456", "abcdef");
    expect(loginLocalDemo("admin@triage.com", "123456")).toBeNull();
    expect(loginLocalDemo("admin@triage.com", "abcdef")).toMatchObject({
      email: "admin@triage.com",
      displayName: "Admin Demo",
    });
  });

  it("clears local session", () => {
    loginLocalDemo("medico@triage.com", "123456");
    clearLocalSession();
    expect(readLocalSession()).toBeNull();
  });
});

function mockProfileRole(role = "admin", error = null) {
  const single = vi.fn().mockResolvedValue({
    data: role ? { role, status: "approved" } : null,
    error,
  });
  const eq = vi.fn(() => ({ single }));
  const select = vi.fn(() => ({ eq }));
  from.mockReturnValue({ select });
}

describe("authService supabase login", () => {
  beforeEach(() => {
    signInWithPassword.mockReset();
    getSession.mockReset();
    from.mockReset();
    getSupabaseClient.mockResolvedValue(supabase);
  });

  it("returns null for invalid credentials", async () => {
    signInWithPassword.mockResolvedValue({
      data: { user: null },
      error: { status: 400, message: "Invalid login credentials" },
    });

    const user = await loginSupabase("admin@triage.com", "bad");
    expect(user).toBeNull();
  });

  it("throws helpful message when email is not confirmed", async () => {
    signInWithPassword.mockResolvedValue({
      data: { user: null },
      error: { status: 400, message: "Email not confirmed", code: "email_not_confirmed" },
    });

    await expect(loginSupabase("a@b.com", "12345678")).rejects.toThrow(
      /panel de Usuarios/
    );
  });

  it("throws with Supabase message for other auth errors", async () => {
    signInWithPassword.mockResolvedValue({
      data: { user: null },
      error: { status: 403, message: "JWT expired" },
    });

    await expect(loginSupabase("admin@triage.com", "123456")).rejects.toThrow(
      "No se pudo iniciar sesión: JWT expired"
    );
  });

  it("throws schema fix hint when auth users have null token columns", async () => {
    signInWithPassword.mockResolvedValue({
      data: { user: null },
      error: { status: 500, message: "Database error querying schema" },
    });

    await expect(loginSupabase("admin@triage.com", "123456")).rejects.toThrow(
      /seed-demo-users\.sql/
    );
  });

  it("throws actionable message on network issues", async () => {
    signInWithPassword.mockResolvedValue({
      data: { user: null },
      error: { message: "Failed to fetch" },
    });

    await expect(loginSupabase("admin@triage.com", "123456")).rejects.toThrow(
      /No se pudo conectar al servicio de autenticación/
    );
  });

  it("returns user including role on successful login", async () => {
    signInWithPassword.mockResolvedValue({
      data: { user: { id: "u-1", email: "admin@triage.com" } },
      error: null,
    });
    mockProfileRole("admin");

    const user = await loginSupabase("admin@triage.com", "123456");

    expect(user).toMatchObject({
      id: "u-1",
      email: "admin@triage.com",
      role: "admin",
      displayName: "",
    });
  });
});

describe("authService supabase session", () => {
  beforeEach(() => {
    signInWithPassword.mockReset();
    getSession.mockReset();
    from.mockReset();
    getSupabaseClient.mockResolvedValue(supabase);
  });

  it("returns null when there is no active session", async () => {
    getSession.mockResolvedValue({ data: { session: null } });

    const user = await getCurrentSupabaseUser();
    expect(user).toBeNull();
  });

  it("falls back to medico role when profile query fails", async () => {
    getSession.mockResolvedValue({
      data: { session: { user: { id: "u-2", email: "medico@triage.com" } } },
    });
    mockProfileRole(null, { message: "not found" });

    const user = await getCurrentSupabaseUser();

    expect(user).toMatchObject({
      id: "u-2",
      email: "medico@triage.com",
      role: "medico",
      displayName: "",
    });
  });
});
