import { Navigate } from "react-router-dom";
import { useAuth } from "../hooks/useAuth";
import { getHomePathForRole } from "../utils/roleConfig";
import Dashboard from "./Dashboard";

/** En `/`: redirige al flujo del rol o muestra el dashboard si corresponde. */
export default function RoleHome() {
  const { user, loading } = useAuth();

  if (loading) {
    return <div className="p-6 dark:text-slate-100">Cargando…</div>;
  }

  const home = getHomePathForRole(user?.role);
  if (home !== "/") {
    return <Navigate to={home} replace />;
  }

  return <Dashboard />;
}
