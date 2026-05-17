import { Shield } from "lucide-react";
import { useAuth } from "../hooks/useAuth";
import {
  getRoleCapabilities,
  getRoleCapabilityLabels,
} from "../utils/roleConfig";
import { roleLabel } from "../utils/accountProfile";

export function RoleWelcomeBanner({ className = "" }) {
  const { user } = useAuth();
  if (!user?.role) return null;

  const labels = getRoleCapabilityLabels(user.role);
  const caps = getRoleCapabilities(user.role);

  return (
    <div
      className={`card border-brand-200/60 bg-brand-50/50 dark:border-brand-900/50 dark:bg-brand-950/30 ${className}`}
      data-testid="role-welcome-banner"
    >
      <div className="flex flex-col gap-3 sm:flex-row sm:items-start">
        <span className="inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-brand-500 text-white shadow-soft-sm">
          <Shield className="h-5 w-5" />
        </span>
        <div className="min-w-0 flex-1">
          <p className="text-sm font-semibold text-ink-900 dark:text-ink-50">
            Rol:{" "}
            <span data-testid="role-welcome-label">{roleLabel(user.role)}</span>
          </p>
          <p className="mt-0.5 text-xs text-ink-600 dark:text-ink-300">
            En esta sesión puedes:
          </p>
          <ul className="mt-2 space-y-1 text-xs text-ink-700 dark:text-ink-200">
            {labels.map((line) => (
              <li key={line} className="flex items-start gap-2">
                <span className="mt-1.5 h-1 w-1 shrink-0 rounded-full bg-brand-500" />
                <span>{line}</span>
              </li>
            ))}
          </ul>
          {!caps.canAttend && !caps.canFinalize && caps.canRegister ? (
            <p
              className="mt-2 text-[11px] text-amber-800 dark:text-amber-200"
              data-testid="role-limit-hint"
            >
              No puedes atender ni finalizar: eso lo hace médico o administrador.
            </p>
          ) : null}
          {caps.canAttend && !caps.canFinalize ? (
            <p
              className="mt-2 text-[11px] text-amber-800 dark:text-amber-200"
              data-testid="role-limit-hint"
            >
              No puedes finalizar (dar salida): solo médico o administrador.
            </p>
          ) : null}
        </div>
      </div>
    </div>
  );
}
