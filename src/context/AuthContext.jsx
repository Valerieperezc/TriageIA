import { createContext, useContext, useEffect, useState } from "react";

const AuthContext = createContext();
export const useAuth = () => useContext(AuthContext);
const SESSION_KEY = "triageia-session";

const USERS = [
  { email: "admin@triage.com", role: "admin", password: "triageia26" },
  { email: "medico@triage.com", role: "medico", password: "triageia26" },
  { email: "recepcion@triage.com", role: "recepcion", password: "triageia26" },
];

export function AuthProvider({ children }) {
  const [user, setUser] = useState(() => {
    const savedSession = localStorage.getItem(SESSION_KEY);
    return savedSession ? JSON.parse(savedSession) : null;
  });

  const login = (email, password) => {
    const normalizedEmail = email.trim().toLowerCase();
    const found = USERS.find(
      (u) => u.email === normalizedEmail && u.password === password
    );
    if (!found) return false;
    const { password: _, ...safeUser } = found;
    setUser(safeUser);
    return true;
  };

  const logout = () => setUser(null);

  useEffect(() => {
    if (user) {
      localStorage.setItem(SESSION_KEY, JSON.stringify(user));
      return;
    }

    localStorage.removeItem(SESSION_KEY);
  }, [user]);

  return (
    <AuthContext.Provider value={{ user, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
}
