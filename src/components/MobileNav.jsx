import {
  ClipboardList,
  HeartPulse,
  LayoutDashboard,
  PlusSquare,
  Users,
} from "lucide-react";
import { Link, useLocation } from "react-router-dom";

const items = [
  { to: "/", icon: LayoutDashboard, label: "Inicio" },
  { to: "/patients", icon: Users, label: "Pacientes" },
  { to: "/triage", icon: PlusSquare, label: "Nuevo" },
  { to: "/audit", icon: ClipboardList, label: "Historial" },
];

export default function MobileNav() {
  const { pathname } = useLocation();

  return (
    <nav className="surface fixed inset-x-4 bottom-4 z-50 flex items-center justify-between rounded-2xl px-3 py-2 shadow-lg md:hidden">
      {items.map(({ to, icon: Icon, label }) => {
        const active = pathname === to;

        return (
          <Link
            key={to}
            to={to}
            className={`flex min-w-0 flex-1 flex-col items-center gap-1 rounded-xl px-2 py-2 text-[11px] font-medium transition ${
              active
                ? "bg-blue-600 text-white"
                : "text-slate-500 dark:text-slate-400"
            }`}
          >
            {to === "/triage" ? (
              <div className="rounded-2xl bg-white/15 p-1">
                <HeartPulse className="h-4 w-4" />
              </div>
            ) : (
              <Icon className="h-4 w-4" />
            )}
            <span>{label}</span>
          </Link>
        );
      })}
    </nav>
  );
}
