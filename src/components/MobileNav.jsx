import { NavLink } from "react-router-dom";
import { useAuth } from "../hooks/useAuth";
import { usePatients } from "../hooks/usePatients";
import { getVisibleNavItems } from "../config/appNavigation";

export default function MobileNav() {
  const { user } = useAuth();
  const { canCreatePatient } = usePatients();
  const navItems = getVisibleNavItems(user, { canCreatePatient });

  const linkClass = ({ isActive }) =>
    `flex min-w-[4.25rem] flex-1 flex-col items-center gap-0.5 rounded-xl px-2 py-1.5 text-[10px] font-semibold transition ${
      isActive
        ? "bg-brand-gradient text-white shadow-soft-sm"
        : "text-ink-600 hover:bg-ink-100 dark:text-ink-300 dark:hover:bg-ink-800"
    }`;

  return (
    <nav
      className="fixed inset-x-0 bottom-0 z-40 border-t border-ink-200/80 bg-white/90 px-2 pt-2 backdrop-blur-xl md:hidden dark:border-ink-800 dark:bg-ink-900/90"
      style={{ paddingBottom: "max(0.5rem, env(safe-area-inset-bottom))" }}
      aria-label="Navegación principal"
      data-testid="mobile-nav"
    >
      <div className="mx-auto flex max-w-lg items-stretch justify-around gap-1">
        {navItems.map((item) => {
          const Icon = item.icon;
          return (
            <NavLink
              key={item.to}
              to={item.to}
              end={item.end}
              className={linkClass}
            >
              <Icon className="h-5 w-5 shrink-0" aria-hidden />
              <span className="max-w-full truncate text-center leading-tight">
                {item.shortLabel ?? item.label}
              </span>
            </NavLink>
          );
        })}
      </div>
    </nav>
  );
}
