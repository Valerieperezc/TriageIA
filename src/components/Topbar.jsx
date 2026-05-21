import { useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  HeartPulse,
  Moon,
  Sun,
  Volume2,
  VolumeX,
  LogOut,
  Plus,
  Database,
  HardDrive,
} from "lucide-react";
import { useAuth } from "../hooks/useAuth";
import { accountInitials, roleLabel } from "../utils/accountProfile";
import { useSoundPreference } from "../hooks/useSoundPreference";
import { useTheme } from "../hooks/useTheme";
import { usePatients } from "../hooks/usePatients";
import { classifyRetryHealth } from "../utils/retryStats";
import toast from "react-hot-toast";

export default function Topbar() {
  const nav = useNavigate();
  const { user, logout, isSupabaseConfigured } = useAuth();
  const { soundEnabled, setSoundEnabled } = useSoundPreference();
  const { theme, toggleTheme } = useTheme();
  const { retryStats, resetRetryStats, canCreatePatient } = usePatients();

  const lastRetryText = retryStats?.lastRetryAt
    ? new Date(retryStats.lastRetryAt).toLocaleTimeString()
    : "N/A";
  const retryHealth = classifyRetryHealth(retryStats);
  const prevRetryHealthLevelRef = useRef(retryHealth.level);
  const [loggingOut, setLoggingOut] = useState(false);

  const handleLogout = async () => {
    if (loggingOut) return;
    setLoggingOut(true);
    try {
      await logout();
      toast.success("Sesión cerrada");
    } catch {
      toast.error("No se pudo cerrar sesión por completo");
    } finally {
      setLoggingOut(false);
      nav("/login", { replace: true });
    }
  };

  useEffect(() => {
    const prev = prevRetryHealthLevelRef.current;
    if (retryHealth.level === "critical" && prev !== "critical") {
      toast.error("Resiliencia crítica: revisa conectividad o backend", {
        id: "retry-health-critical",
      });
    }
    prevRetryHealthLevelRef.current = retryHealth.level;
  }, [retryHealth.level]);

  return (
    <div className="sticky top-0 z-20 min-w-0 max-w-full rounded-2xl border border-ink-200/70 bg-white/70 px-3 py-2.5 shadow-soft backdrop-blur-xl sm:top-4 sm:px-4 sm:py-3 dark:border-ink-800 dark:bg-ink-900/70">
      <div className="flex min-w-0 flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
        {/* Brand/summary */}
        <div className="flex items-center gap-3">
          <div className="rounded-xl bg-brand-50 p-2 text-brand-600 ring-1 ring-brand-100 dark:bg-brand-950/40 dark:text-brand-200 dark:ring-brand-900/50">
            <HeartPulse className="h-5 w-5" />
          </div>
          <div>
            <p className="text-sm font-semibold text-ink-900 dark:text-ink-50">
              Panel operativo
            </p>
            <p className="flex items-center gap-1.5 text-[11px] font-medium text-ink-500 dark:text-ink-400">
              {isSupabaseConfigured ? (
                <>
                  <Database className="h-3 w-3" />
                  Modo Supabase
                </>
              ) : (
                <>
                  <HardDrive className="h-3 w-3" />
                  Modo Local
                </>
              )}
            </p>
          </div>
        </div>

        {/* User card — desktop */}
        <div className="hidden items-center gap-3 rounded-xl border border-ink-200 bg-ink-50 px-3 py-1.5 md:flex dark:border-ink-700 dark:bg-ink-800/70">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-brand-gradient text-xs font-bold text-white">
            {accountInitials(user)}
          </div>
          <div className="min-w-0">
            <p className="max-w-[200px] truncate text-xs font-semibold text-ink-800 dark:text-ink-100">
              {user?.displayName?.trim() || user?.email}
            </p>
            <p
              className="text-[10px] font-medium uppercase tracking-wide text-ink-500 dark:text-ink-400"
              data-testid="topbar-user-role"
            >
              {roleLabel(user?.role)}
            </p>
          </div>
        </div>

        {/* Actions */}
        <div className="flex min-w-0 flex-wrap items-center justify-end gap-1.5 sm:gap-2">
          {retryStats?.totalRetries > 0 && (
            <>
              <span
                data-testid="retry-indicator"
                className={`max-w-full truncate rounded-full px-2 py-1 text-[10px] font-semibold sm:px-3 sm:text-[11px] ${retryHealth.badgeClass}`}
                title={`Reintentos: ${retryStats.totalRetries} | Recuperaciones carga: ${retryStats.recoveredLoads} | Recuperaciones acciones: ${retryStats.recoveredActions} | Fallos carga: ${retryStats.failedLoads} | Fallos acciones: ${retryStats.failedActions} | Último: ${lastRetryText}`}
              >
                <span className="hidden sm:inline">{retryHealth.label} · </span>
                {retryStats.totalRetries}
              </span>
              <button
                type="button"
                onClick={resetRetryStats}
                className="btn btn-warning px-2.5 text-xs sm:px-4"
                title="Limpiar métricas de reintentos"
                data-testid="retry-reset"
              >
                <span className="hidden sm:inline">Limpiar</span>
                <span className="sm:hidden" aria-hidden>
                  ×
                </span>
              </button>
            </>
          )}

          <button
            type="button"
            onClick={toggleTheme}
            className="btn-icon"
            title={theme === "dark" ? "Modo claro" : "Modo oscuro"}
            data-testid="theme-toggle"
          >
            {theme === "dark" ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
          </button>

          <button
            type="button"
            onClick={() => {
              setSoundEnabled(!soundEnabled);
              toast.success(soundEnabled ? "Alertas silenciadas" : "Sonidos activados");
            }}
            className="btn-icon"
            title={soundEnabled ? "Silenciar alertas sonoras" : "Activar alertas sonoras"}
            data-testid="sound-toggle"
          >
            {soundEnabled ? (
              <Volume2 className="h-4 w-4" />
            ) : (
              <VolumeX className="h-4 w-4" />
            )}
          </button>

          {canCreatePatient && (
            <button
              type="button"
              onClick={() => nav("/triage")}
              className="btn btn-primary px-3 sm:px-4"
              title="Registrar paciente"
            >
              <Plus className="h-4 w-4" />
              <span className="hidden sm:inline">Paciente</span>
            </button>
          )}

          <button
            type="button"
            onClick={handleLogout}
            disabled={loggingOut}
            className="btn btn-secondary"
            title="Cerrar sesión"
            data-testid="logout-button"
          >
            <LogOut className="h-4 w-4" />
            <span className="hidden sm:inline">{loggingOut ? "Saliendo..." : "Salir"}</span>
          </button>
        </div>
      </div>
    </div>
  );
}
