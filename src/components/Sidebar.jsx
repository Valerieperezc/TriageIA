import { useMemo } from "react";
import {
  LayoutDashboard,
  Users,
  ClipboardList,
  ShieldCheck,
  Stethoscope,
  AlertTriangle,
  Settings,
} from "lucide-react";
import { NavLink, useLocation } from "react-router-dom";
import { useAuth } from "../hooks/useAuth";
import { usePatients } from "../hooks/usePatients";
import { accountInitials, roleLabel } from "../utils/accountProfile";
import {
  getRoleCapabilityLabels,
  getSidebarNavOrder,
} from "../utils/roleConfig";

const NAV_DEF = {
  dashboard: {
    to: "/",
    end: true,
    icon: LayoutDashboard,
    label: "Dashboard",
    visible: () => true,
  },
  patients: {
    to: "/patients",
    icon: Users,
    label: "Pacientes",
    visible: () => true,
  },
  triage: {
    to: "/triage",
    icon: Stethoscope,
    label: "Registrar triage",
    visible: (_user, { canCreatePatient }) => canCreatePatient,
  },
  audit: {
    to: "/audit",
    icon: ClipboardList,
    label: "Historial",
    visible: (user) => user?.role === "admin",
  },
  settings: {
    to: "/settings",
    icon: Settings,
    label: "Configuración",
    visible: () => true,
  },
};

export default function Sidebar() {
  const { pathname } = useLocation();
  const { user } = useAuth();
  const { patients, canCreatePatient } = usePatients();

  const criticalInQueue = useMemo(
    () =>
      patients.filter(
        (p) => p.status === "En espera" && p.triage === "I"
      ).length,
    [patients]
  );

  const navItems = useMemo(() => {
    const order = getSidebarNavOrder(user?.role);
    return order
      .map((key) => NAV_DEF[key])
      .filter((def) => def && def.visible(user, { canCreatePatient }));
  }, [user, canCreatePatient]);

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
    <aside className="fixed inset-y-0 left-0 z-30 hidden w-72 border-r border-ink-200/70 bg-white/80 p-5 backdrop-blur-xl md:flex md:flex-col dark:border-ink-800 dark:bg-ink-900/80">
      <div className="mb-6 flex items-center gap-3">
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

      <div className="space-y-1">
        <p className="section-title mb-2 px-2">Navegación</p>
        {navItems.map((item) => {
          const Icon = item.icon;
          const showCritical =
            item.to === "/patients" && criticalInQueue > 0;
          return (
            <NavLink
              key={item.to}
              to={item.to}
              end={item.end}
              className={navItemClass}
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
      </div>

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

      <div className="mt-auto rounded-2xl border border-ink-200 bg-white/70 p-3 shadow-soft-sm dark:border-ink-700 dark:bg-ink-800/70">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-brand-gradient text-sm font-bold text-white shadow-soft">
            {accountInitials(user)}
          </div>
          <div className="min-w-0 flex-1">
            <p className="truncate text-sm font-semibold text-ink-900 dark:text-ink-100">
              {user?.displayName?.trim() || user?.email || "Invitado"}
            </p>
            <p className="text-[11px] font-medium uppercase tracking-wide text-ink-500 dark:text-ink-400">
              {roleLabel(user?.role)}
            </p>
          </div>
        </div>
      </div>
    </aside>
  );
}
