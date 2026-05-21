import { useMemo, useState } from "react";
import { AlertTriangle, LogOut, ShieldCheck, X } from "lucide-react";
import { NavLink, useLocation, useNavigate } from "react-router-dom";
import toast from "react-hot-toast";
import { useAuth } from "../hooks/useAuth";
import { usePatients } from "../hooks/usePatients";
import { accountInitials, roleLabel } from "../utils/accountProfile";
import { getRoleCapabilityLabels } from "../utils/roleConfig";
import { getVisibleNavItems } from "../config/appNavigation";

/** Contenido del menú lateral (escritorio y drawer móvil). */
export function SidebarPanel({ onNavigate, onClose }) {
  const navigate = useNavigate();
  const { pathname } = useLocation();
  const { user, logout } = useAuth();
  const { patients, canCreatePatient } = usePatients();
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
      onNavigate?.();
      navigate("/login", { replace: true });
    }
  };

  const criticalInQueue = useMemo(
    () =>
      patients.filter((p) => p.status === "En espera" && p.triage === "I")
        .length,
    [patients]
  );

  const navItems = useMemo(
    () => getVisibleNavItems(user, { canCreatePatient }),
    [user, canCreatePatient]
  );

  const capabilityLabels = useMemo(
    () => getRoleCapabilityLabels(user?.role),
    [user?.role]
  );

  const navItemClass = ({ isActive }) =>
    `group relative flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition ${
      isActive
        ? "bg-brand-gradient text-white shadow-soft"
        : "text-ink-600 hover:bg-ink-100 hover:text-ink-900 dark:text-ink-300 dark:hover:bg-ink-800 dark:hover:text-white"
    }`;

  return (
    <div className="flex h-full min-h-0 flex-col">
      <div className="mb-6 flex items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <div className="rounded-2xl bg-brand-gradient p-2.5 text-white shadow-soft">
            <ShieldCheck className="h-5 w-5" />
          </div>
          <div>
            <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-ink-400">
              TriageIA
            </p>
            <p className="text-base font-bold text-ink-900 dark:text-ink-50">
              Panel clínico
            </p>
          </div>
        </div>
        {onClose ? (
          <button
            type="button"
            onClick={onClose}
            className="btn-icon shrink-0 md:hidden"
            aria-label="Cerrar menú"
            data-testid="mobile-menu-close"
          >
            <X className="h-4 w-4" />
          </button>
        ) : null}
      </div>

      <div className="min-h-0 flex-1 space-y-1 overflow-y-auto">
        <p className="section-title mb-2 px-2">Navegación</p>
        {navItems.map((item) => {
          const Icon = item.icon;
          const showCritical = item.to === "/patients" && criticalInQueue > 0;
          return (
            <NavLink
              key={item.to}
              to={item.to}
              end={item.end}
              className={navItemClass}
              onClick={() => onNavigate?.()}
            >
              <Icon className="h-4 w-4" />
              <span className="flex-1">{item.label}</span>
              {showCritical ? (
                <span
                  data-testid="sidebar-critical-badge"
                  className={`inline-flex min-w-[1.5rem] items-center justify-center rounded-full px-1.5 py-0.5 text-[10px] font-bold ${
                    pathname === "/patients"
                      ? "bg-white text-red-600"
                      : "bg-red-500 text-white"
                  }`}
                  title="Críticos (CTAS I) en espera"
                >
                  {criticalInQueue}
                </span>
              ) : null}
            </NavLink>
          );
        })}

        <div
          className="mt-4 rounded-2xl border border-ink-200 bg-ink-50/80 p-3 dark:border-ink-700 dark:bg-ink-800/50"
          data-testid="sidebar-role-capabilities"
        >
          <p className="text-[11px] font-semibold uppercase tracking-wide text-ink-500 dark:text-ink-400">
            Tu rol · {roleLabel(user?.role)}
          </p>
          <ul className="mt-2 space-y-1 text-[11px] text-ink-600 dark:text-ink-300">
            {capabilityLabels.slice(0, 4).map((line) => (
              <li key={line} className="leading-snug">
                · {line}
              </li>
            ))}
          </ul>
        </div>

        <div
          className={`mt-3 rounded-2xl border p-4 transition ${
            criticalInQueue > 0
              ? "border-red-300/70 bg-red-50 dark:border-red-900/60 dark:bg-red-950/40"
              : "border-ink-200 bg-ink-50 dark:border-ink-700 dark:bg-ink-800/60"
          }`}
        >
          <div className="flex items-center gap-2">
            <span
              className={`inline-flex h-7 w-7 items-center justify-center rounded-lg ${
                criticalInQueue > 0
                  ? "bg-red-500 text-white alert-pulse"
                  : "bg-emerald-500/90 text-white"
              }`}
            >
              <AlertTriangle className="h-3.5 w-3.5" />
            </span>
            <p className="text-[11px] font-semibold uppercase tracking-wide text-ink-500 dark:text-ink-400">
              Cola crítica
            </p>
          </div>
          <p className="mt-2 text-sm font-semibold text-ink-900 dark:text-ink-100">
            {criticalInQueue > 0
              ? `${criticalInQueue} paciente(s) CTAS I en espera`
              : "Sin pacientes CTAS I"}
          </p>
        </div>
      </div>

      <div className="mt-4 shrink-0 space-y-2">
        <div className="rounded-2xl border border-ink-200 bg-white/70 p-3 shadow-soft-sm dark:border-ink-700 dark:bg-ink-800/70">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-brand-gradient text-sm font-bold text-white shadow-soft">
              {accountInitials(user)}
            </div>
            <div className="min-w-0 flex-1">
              <p className="truncate text-sm font-semibold text-ink-900 dark:text-ink-100">
                {user?.displayName?.trim() || user?.email || "Invitado"}
              </p>
              <p
                className="text-[11px] font-medium uppercase tracking-wide text-ink-500 dark:text-ink-400"
                data-testid="topbar-user-role"
              >
                {roleLabel(user?.role)}
              </p>
            </div>
          </div>
        </div>
        <button
          type="button"
          onClick={handleLogout}
          disabled={loggingOut}
          className="btn btn-secondary hidden w-full md:flex"
          title="Cerrar sesión"
          data-testid="logout-button"
        >
          <LogOut className="h-4 w-4" />
          {loggingOut ? "Saliendo..." : "Salir"}
        </button>
      </div>
    </div>
  );
}
