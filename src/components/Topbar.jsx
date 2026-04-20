import { useEffect, useRef } from "react";
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

  const handleLogout = async () => {
    await logout();
    toast.success("Sesión cerrada");
    nav("/login");
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
    <div className="sticky top-4 z-20 rounded-2xl border border-ink-200/70 bg-white/70 px-4 py-3 shadow-soft backdrop-blur-xl dark:border-ink-800 dark:bg-ink-900/70">
      <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
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
            {(user?.email ?? "U").slice(0, 1).toUpperCase()}
          </div>
          <div className="min-w-0">
            <p className="max-w-[200px] truncate text-xs font-semibold text-ink-800 dark:text-ink-100">
              {user?.email}
            </p>
            <p className="text-[10px] font-medium uppercase tracking-wide text-ink-500 dark:text-ink-400">
              {user?.role}
            </p>
          </div>
        </div>

        {/* Actions */}
        <div className="flex flex-wrap items-center justify-end gap-2">
          {retryStats?.totalRetries > 0 && (
            <>
              <span
                data-testid="retry-indicator"
                className={`rounded-full px-3 py-1 text-[11px] font-semibold ${retryHealth.badgeClass}`}
                title={`Reintentos: ${retryStats.totalRetries} | Recuperaciones carga: ${retryStats.recoveredLoads} | Recuperaciones acciones: ${retryStats.recoveredActions} | Fallos carga: ${retryStats.failedLoads} | Fallos acciones: ${retryStats.failedActions} | Último: ${lastRetryText}`}
              >
                {retryHealth.label} · {retryStats.totalRetries}
              </span>
              <button
                type="button"
                onClick={resetRetryStats}
                className="btn btn-warning text-xs"
                title="Limpiar métricas de reintentos"
                data-testid="retry-reset"
              >
                Limpiar
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
              className="btn btn-primary"
            >
              <Plus className="h-4 w-4" />
              Paciente
            </button>
          )}

          <button
            type="button"
            onClick={handleLogout}
            className="btn btn-secondary"
            title="Cerrar sesión"
          >
            <LogOut className="h-4 w-4" />
            <span className="hidden sm:inline">Salir</span>
          </button>
        </div>
      </div>
    </div>
  );
}
