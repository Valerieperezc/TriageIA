import { createContext, useContext, useState } from "react";

const AuthContext = createContext();
export const useAuth = () => useContext(AuthContext);

const USERS = [
  { email: "admin@triage.com", role: "admin" },
  { email: "medico@triage.com", role: "medico" },
  { email: "recepcion@triage.com", role: "recepcion" },
  { email: "enfermeria@triage.com", role: "enfermeria" },
];

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);

  const login = (email) => {
    const found = USERS.find(u => u.email === email);
    if (!found) return false;
    setUser(found);
    return true;
  };

  const logout = () => setUser(null);

  return (
    <AuthContext.Provider value={{ user, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
}