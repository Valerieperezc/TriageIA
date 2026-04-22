import { useLocation, useNavigate } from "react-router-dom";
import { HeartPulse } from "lucide-react";
import { useAuth } from "../context/AuthContext";
import ThemeToggle from "./ThemeToggle";

export default function Topbar() {
  const nav = useNavigate();
  const { pathname } = useLocation();
  const { user, logout } = useAuth();
  const showQuickPatientButton = pathname !== "/";

  return (
    <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">

      <div className="flex min-w-0 items-center gap-3">
        <div className="rounded-xl bg-blue-100 p-2 dark:bg-blue-500/10">
          <HeartPulse className="text-blue-600 dark:text-blue-400" />
        </div>

        <div className="min-w-0">
          <p className="font-bold">TriageIA</p>
          <p className="truncate text-xs text-slate-500 dark:text-slate-400">
            {user?.email} ({user?.role})
          </p>
        </div>
      </div>

      <div className="flex items-center gap-2 self-end sm:self-auto">
        <ThemeToggle />

        {showQuickPatientButton && (
          <button onClick={() => nav("/triage")} className="btn btn-primary">
            + Paciente
          </button>
        )}

        <button onClick={logout} className="btn btn-secondary">
          Salir
        </button>
      </div>

    </div>
  );
}
