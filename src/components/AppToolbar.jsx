import { useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import {
  LogOut,
  Menu,
  Moon,
  Plus,
  Sun,
  Volume2,
  VolumeX,
} from "lucide-react";
import toast from "react-hot-toast";
import { useAuth } from "../hooks/useAuth";
import { useSoundPreference } from "../hooks/useSoundPreference";
import { useTheme } from "../hooks/useTheme";
import { usePatients } from "../hooks/usePatients";

/**
 * Acciones rápidas (tema, sonido, nuevo paciente, salir).
 * Cada control se oculta si ya está visible en la pantalla actual.
 */
export function AppToolbar({ onOpenMobileMenu, mobileMenuOpen }) {
  const navigate = useNavigate();
  const { pathname } = useLocation();
  const { logout } = useAuth();
  const { soundEnabled, setSoundEnabled } = useSoundPreference();
  const { theme, toggleTheme } = useTheme();
  const { canCreatePatient } = usePatients();
  const [loggingOut, setLoggingOut] = useState(false);

  const onSettings = pathname === "/settings";
  const onTriage = pathname === "/triage";
  const onDashboard = pathname === "/dashboard";

  const showTheme = !onSettings && !onDashboard;
  const showSound = !onSettings && !onDashboard;
  const showAddPatient =
    canCreatePatient && !onTriage && !onDashboard;
  const showLogout = true;

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
      navigate("/login", { replace: true });
    }
  };

  const hasActions = showTheme || showSound || showAddPatient || showLogout;

  return (
    <div
      className="sticky top-0 z-20 flex min-w-0 items-center justify-between gap-2 py-2"
      data-testid="app-toolbar"
    >
      <button
        type="button"
        onClick={onOpenMobileMenu}
        className="btn-icon shrink-0 md:hidden"
        aria-label="Abrir menú de navegación"
        aria-controls="mobile-menu-drawer"
        aria-expanded={mobileMenuOpen}
        data-testid="mobile-menu-toggle"
      >
        <Menu className="h-5 w-5" />
      </button>

      {hasActions ? (
        <div className="flex min-w-0 flex-1 flex-wrap items-center justify-end gap-1.5 sm:gap-2">
          {showTheme ? (
            <button
              type="button"
              onClick={toggleTheme}
              className="btn-icon shrink-0"
              title={theme === "dark" ? "Modo claro" : "Modo oscuro"}
              data-testid="theme-toggle"
            >
              {theme === "dark" ? (
                <Sun className="h-4 w-4" />
              ) : (
                <Moon className="h-4 w-4" />
              )}
            </button>
          ) : null}

          {showSound ? (
            <button
              type="button"
              onClick={() => {
                setSoundEnabled(!soundEnabled);
                toast.success(
                  soundEnabled ? "Alertas silenciadas" : "Sonidos activados"
                );
              }}
              className="btn-icon shrink-0"
              title={
                soundEnabled
                  ? "Silenciar alertas sonoras"
                  : "Activar alertas sonoras"
              }
              data-testid="sound-toggle"
            >
              {soundEnabled ? (
                <Volume2 className="h-4 w-4" />
              ) : (
                <VolumeX className="h-4 w-4" />
              )}
            </button>
          ) : null}

          {showAddPatient ? (
            <button
              type="button"
              onClick={() => navigate("/triage")}
              className="btn btn-primary shrink-0 px-3 sm:px-4"
              title="Registrar paciente"
            >
              <Plus className="h-4 w-4" />
              Paciente
            </button>
          ) : null}

          {showLogout ? (
            <button
              type="button"
              onClick={handleLogout}
              disabled={loggingOut}
              className="btn btn-secondary shrink-0 md:hidden"
              title="Cerrar sesión"
              data-testid="logout-button"
            >
              <LogOut className="h-4 w-4" />
              <span className="hidden sm:inline">
                {loggingOut ? "Saliendo..." : "Salir"}
              </span>
            </button>
          ) : null}
        </div>
      ) : (
        <div className="flex-1 md:hidden" aria-hidden />
      )}
    </div>
  );
}
