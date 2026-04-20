import { useEffect, useMemo, useState } from "react";
import { isSupabaseConfigured } from "../lib/appConfig";
import { AuthContext } from "./auth-context";

const LOCAL_SESSION_KEY = "triageia:local-user";
let authServicePromise = null;

function readLocalSession() {
  try {
    const raw = localStorage.getItem(LOCAL_SESSION_KEY);
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
}

function loadAuthService() {
  if (!authServicePromise) {
    authServicePromise = import("../services/authService");
  }
  return authServicePromise;
}

export function AuthProvider({ children }) {
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
      if (!localUser) return false;
      setUser(localUser);
      return true;
    }

    const loggedUser = await authService.loginSupabase(email, password);
    if (!loggedUser) return false;
    setUser(loggedUser);
    return true;
  };

  const logout = async () => {
    const authService = await loadAuthService();
    if (!isSupabaseConfigured) {
      authService.clearLocalSession();
      setUser(null);
      return;
    }
    await authService.logoutSupabase();
    setUser(null);
  };

  const value = useMemo(
    () => ({ user, login, logout, loading, isSupabaseConfigured }),
    [user, loading]
  );

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
}