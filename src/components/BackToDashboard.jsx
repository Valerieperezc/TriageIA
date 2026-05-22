import { useLocation, useNavigate } from "react-router-dom";
import { ArrowLeft, LayoutDashboard } from "lucide-react";

/** Navegación explícita al dashboard desde cualquier módulo. */
export function BackToDashboard({
  variant = "button",
  className = "",
  testId = "back-to-dashboard",
}) {
  const navigate = useNavigate();
  const { pathname } = useLocation();

  if (pathname === "/dashboard" || pathname === "/") {
    return null;
  }

  const go = () => navigate("/dashboard");

  if (variant === "link") {
    return (
      <button
        type="button"
        onClick={go}
        data-testid={testId}
        className={`inline-flex items-center gap-1.5 text-sm font-medium text-ink-500 transition hover:text-brand-600 dark:text-ink-400 dark:hover:text-brand-300 ${className}`.trim()}
      >
        <ArrowLeft className="h-4 w-4" aria-hidden />
        Volver al dashboard
      </button>
    );
  }

  return (
    <button
      type="button"
      onClick={go}
      data-testid={testId}
      className={`btn btn-secondary shrink-0 ${className}`.trim()}
    >
      <LayoutDashboard className="h-4 w-4" aria-hidden />
      Dashboard
    </button>
  );
}
