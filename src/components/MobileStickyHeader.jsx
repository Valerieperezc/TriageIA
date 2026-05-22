import { useState } from "react";
import { NavLink, useLocation, useNavigate } from "react-router-dom";
import { LayoutDashboard, LogOut, Menu } from "lucide-react";
import toast from "react-hot-toast";
import { useAuth } from "../hooks/useAuth";

/** Barra fija superior en móvil: menú, inicio (dashboard) y salir. */
export function MobileStickyHeader({ onOpenMobileMenu, mobileMenuOpen }) {
  const { pathname } = useLocation();
  const navigate = useNavigate();
  const { logout } = useAuth();
  const [loggingOut, setLoggingOut] = useState(false);
  const onDashboard = pathname === "/dashboard" || pathname === "/";

  const handleLogout = async () => {
    if (loggingOut) return;
    setLoggingOut(true);
    try {
      await logout();
      toast.success("Sesión cerrada");
    } catch {
      toast.error("No se pudo cerrar sesión");
    } finally {
      setLoggingOut(false);
      navigate("/login", { replace: true });
    }
  };

  return (
    <header
      className="sticky top-0 z-30 -mx-3 mb-3 border-b border-ink-200/80 bg-white/95 px-3 py-2 shadow-soft-sm backdrop-blur-md sm:-mx-4 sm:px-4 md:hidden dark:border-ink-800 dark:bg-ink-900/95"
      data-testid="mobile-sticky-header"
      style={{ paddingTop: "max(0.25rem, env(safe-area-inset-top))" }}
    >
      <div className="flex items-center gap-2">
        <button
          type="button"
          onClick={onOpenMobileMenu}
          className="btn-icon shrink-0"
          aria-label="Abrir menú"
          aria-expanded={mobileMenuOpen}
          data-testid="mobile-menu-toggle"
        >
          <Menu className="h-5 w-5" />
        </button>

        {!onDashboard ? (
          <NavLink
            to="/dashboard"
            className="btn btn-primary min-w-0 flex-1 justify-center"
            data-testid="mobile-go-dashboard"
          >
            <LayoutDashboard className="h-4 w-4 shrink-0" />
            Ir al inicio
          </NavLink>
        ) : (
          <p className="min-w-0 flex-1 truncate text-center text-sm font-semibold text-ink-800 dark:text-ink-100">
            Panel de inicio
          </p>
        )}

        <button
          type="button"
          onClick={handleLogout}
          disabled={loggingOut}
          className="btn-icon shrink-0"
          title="Cerrar sesión"
          data-testid="logout-button"
        >
          <LogOut className="h-4 w-4" />
        </button>
      </div>
    </header>
  );
}
