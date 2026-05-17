import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { isSupabaseConfigured } from "../lib/appConfig";
import { readLocalSession } from "../services/authService";
import { AuthContext } from "./auth-context";

let authServicePromise = null;

function loadAuthService() {
  if (!authServicePromise) {
    authServicePromise = import("../services/authService");
  }
  return authServicePromise;
}

export function AuthProvider({ children }) {
  const loggingOutRef = useRef(false);
  const [user, setUser] = useState(() => {
    if (!isSupabaseConfigured) {
      return readLocalSession();
    }
    return null;
  });
  const [loading, setLoading] = useState(isSupabaseConfigured);

  useEffect(() => {
    if (!isSupabaseConfigured) {
      return undefined;
    }

    let mounted = true;
    let unsubscribe = () => {};

    loadAuthService()
      .then(async ({ getCurrentSupabaseUser, subscribeSupabaseAuth }) => {
        const sessionUser = await getCurrentSupabaseUser();
        if (!mounted) return;
        setUser(sessionUser ?? null);
        setLoading(false);
        unsubscribe = subscribeSupabaseAuth((nextUser) => {
          if (!mounted) return;
          if (loggingOutRef.current && nextUser !== null) return;
          setUser(nextUser);
        });
      })
      .catch(() => {
        if (!mounted) return;
        setUser(null);
        setLoading(false);
      });

    return () => {
      mounted = false;
      unsubscribe();
    };
  }, []);

  const login = async (email, password) => {
    const authService = await loadAuthService();
    if (!isSupabaseConfigured) {
      const localUser = authService.loginLocalDemo(email, password);
      if (!localUser) return null;
      setUser(localUser);
      return localUser;
    }

    const loggedUser = await authService.loginSupabase(email, password);
    if (!loggedUser) return null;
    setUser(loggedUser);
    return loggedUser;
  };

  const updateAccountProfile = useCallback(async (patch) => {
    if (!user) throw new Error("No hay sesión activa");
    const authService = await loadAuthService();
    const next = await authService.saveAccountProfile(user, patch);
    setUser(next);
    return next;
  }, [user]);

  const changeAccountPassword = useCallback(async (currentPassword, newPassword) => {
    if (!user) throw new Error("No hay sesión activa");
    const authService = await loadAuthService();
    await authService.changeAccountPassword(user, currentPassword, newPassword);
  }, [user]);

  const changeAccountEmail = useCallback(async (currentPassword, newEmail) => {
    if (!user) throw new Error("No hay sesión activa");
    const authService = await loadAuthService();
    const next = await authService.changeAccountEmail(user, currentPassword, newEmail);
    setUser(next);
    return next;
  }, [user]);

  const logout = async () => {
    loggingOutRef.current = true;
    const authService = await loadAuthService();
    authService.clearLocalSession();
    setUser(null);
    if (!isSupabaseConfigured) {
      loggingOutRef.current = false;
      return;
    }
    try {
      await authService.logoutSupabase();
    } catch {
      // La sesión local ya se limpió; Supabase puede estar temporalmente inaccesible.
    } finally {
      loggingOutRef.current = false;
    }
  };

  const value = useMemo(
    () => ({
      user,
      login,
      logout,
      loading,
      isSupabaseConfigured,
      updateAccountProfile,
      changeAccountPassword,
      changeAccountEmail,
    }),
    [user, loading]
  );

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
}