import { useNavigate } from "react-router-dom";
import { Moon, Plus, Sun, Volume2, VolumeX } from "lucide-react";
import toast from "react-hot-toast";
import { useSoundPreference } from "../hooks/useSoundPreference";
import { useTheme } from "../hooks/useTheme";
import { usePatients } from "../hooks/usePatients";

/** Tema, sonido y registrar paciente — solo en el dashboard, bajo el banner del rol. */
export function DashboardQuickActions() {
  const navigate = useNavigate();
  const { theme, toggleTheme } = useTheme();
  const { soundEnabled, setSoundEnabled } = useSoundPreference();
  const { canCreatePatient } = usePatients();

  return (
    <div
      className="flex flex-wrap items-center gap-2"
      data-testid="dashboard-quick-actions"
    >
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
          soundEnabled ? "Silenciar alertas sonoras" : "Activar alertas sonoras"
        }
        data-testid="sound-toggle"
      >
        {soundEnabled ? (
          <Volume2 className="h-4 w-4" />
        ) : (
          <VolumeX className="h-4 w-4" />
        )}
      </button>

      {canCreatePatient ? (
        <button
          type="button"
          onClick={() => navigate("/triage")}
          className="btn btn-primary shrink-0"
          data-testid="dashboard-register-patient"
        >
          <Plus className="h-4 w-4" />
          Registrar paciente
        </button>
      ) : null}
    </div>
  );
}
