import { useAuth } from "../hooks/useAuth";
import { useNavigate } from "react-router-dom";
import {
  Mail,
  HeartPulse,
  Lock,
  Moon,
  Sun,
  Activity,
  Sparkles,
} from "lucide-react";
import { useState } from "react";
import toast from "react-hot-toast";
import { useTheme } from "../hooks/useTheme";
import {
  markPostLoginNavigationStart,
  shouldPrefetchPrivateAreaOnCurrentConnection,
} from "../utils/performance";

async function prefetchPrivateArea() {
  await Promise.allSettled([
    import("../App"),
    import("../layouts/PrivateAppLayout"),
    import("../pages/Dashboard"),
  ]);
}

export default function Login() {
  const { login, isSupabaseConfigured } = useAuth();
  const { theme, toggleTheme } = useTheme();
  const navigate = useNavigate();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const handleLogin = async () => {
    if (!email || !email.includes("@")) {
      return toast.error("Ingresa un correo válido");
    }

    if (!password || password.length < 6) {
      return toast.error("Ingresa una contraseña válida");
    }

    setSubmitting(true);
    try {
      const ok = await login(email, password);
      if (!ok) {
        return toast.error("Usuario o contraseña inválidos");
      }

      markPostLoginNavigationStart();
      if (shouldPrefetchPrivateAreaOnCurrentConnection()) {
        prefetchPrivateArea();
      }
      toast.success("Bienvenido");
      navigate("/");
    } catch (error) {
      const message = error?.message || "No se pudo iniciar sesión";
      toast.error(message);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="relative min-h-screen overflow-hidden bg-ink-50 dark:bg-ink-950">
      <button
        type="button"
        onClick={toggleTheme}
        className="btn-icon absolute right-4 top-4 z-20"
        title={theme === "dark" ? "Modo claro" : "Modo oscuro"}
        data-testid="theme-toggle"
      >
        {theme === "dark" ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
      </button>

      <div className="mx-auto grid min-h-screen max-w-6xl grid-cols-1 lg:grid-cols-2">
        {/* Panel marca */}
        <div className="relative hidden overflow-hidden bg-brand-gradient p-10 text-white lg:flex lg:flex-col lg:justify-between">
          <div className="pointer-events-none absolute inset-0 opacity-20">
            <div className="absolute -left-20 -top-20 h-80 w-80 rounded-full bg-white/30 blur-3xl" />
            <div className="absolute -bottom-24 right-0 h-96 w-96 rounded-full bg-sky-300/40 blur-3xl" />
          </div>

          <div className="relative z-10">
            <div className="flex items-center gap-3">
              <div className="rounded-2xl bg-white/15 p-2.5 backdrop-blur">
                <HeartPulse className="h-6 w-6" />
              </div>
              <div>
                <p className="text-xs font-medium uppercase tracking-[0.2em] text-white/70">
                  TriageIA
                </p>
                <p className="text-lg font-bold">Panel clínico</p>
              </div>
            </div>

            <div className="mt-16 space-y-4">
              <h2 className="text-3xl font-bold leading-tight">
                Clasificación de urgencias
                <br />
                rápida, trazable y segura.
              </h2>
              <p className="max-w-md text-sm text-white/80">
                Registra pacientes, prioriza por CTAS y monitorea la cola en
                tiempo real. El historial clínico queda auditado y disponible
                para el equipo autorizado.
              </p>
            </div>

            <ul className="mt-10 space-y-3 text-sm text-white/90">
              <li className="flex items-start gap-3">
                <span className="mt-0.5 rounded-lg bg-white/15 p-1.5">
                  <Activity className="h-4 w-4" />
                </span>
                <span>Cálculo de triage con signos vitales y criterios de gravedad.</span>
              </li>
              <li className="flex items-start gap-3">
                <span className="mt-0.5 rounded-lg bg-white/15 p-1.5">
                  <HeartPulse className="h-4 w-4" />
                </span>
                <span>Alertas sonoras y visuales para pacientes críticos (CTAS I).</span>
              </li>
              <li className="flex items-start gap-3">
                <span className="mt-0.5 rounded-lg bg-white/15 p-1.5">
                  <Sparkles className="h-4 w-4" />
                </span>
                <span>Dashboard que se reinicia cada día; historial siempre disponible.</span>
              </li>
            </ul>
          </div>

          <p className="relative z-10 text-xs text-white/70">
            © {new Date().getFullYear()} TriageIA · Uso clínico supervisado
          </p>
        </div>

        {/* Panel formulario */}
        <div className="flex items-center justify-center px-6 py-12 sm:px-10">
          <div className="w-full max-w-md">
            <div className="mb-8 flex items-center gap-3 lg:hidden">
              <div className="rounded-2xl bg-brand-gradient p-2.5 text-white shadow-soft">
                <HeartPulse className="h-5 w-5" />
              </div>
              <div>
                <p className="text-xs font-medium uppercase tracking-[0.16em] text-ink-500 dark:text-ink-400">
                  TriageIA
                </p>
                <p className="text-base font-bold">Panel clínico</p>
              </div>
            </div>

            <div className="card-flat space-y-5 shadow-soft-lg">
              <div>
                <h1 className="text-2xl font-bold text-ink-900 dark:text-ink-50">
                  Iniciar sesión
                </h1>
                <p className="mt-1 text-sm text-ink-500 dark:text-ink-400">
                  Accede con tu correo autorizado para continuar.
                </p>
              </div>

              <div>
                <label className="form-label" htmlFor="login-email">
                  Correo electrónico
                </label>
                <div className="input">
                  <Mail className="h-4 w-4 text-ink-400 dark:text-ink-500" />
                  <input
                    id="login-email"
                    data-testid="login-email"
                    type="email"
                    placeholder="usuario@uninorte.edu.co"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === "Enter") handleLogin();
                    }}
                  />
                </div>
              </div>

              <div>
                <label className="form-label" htmlFor="login-password">
                  Contraseña
                </label>
                <div className="input">
                  <Lock className="h-4 w-4 text-ink-400 dark:text-ink-500" />
                  <input
                    id="login-password"
                    data-testid="login-password"
                    type="password"
                    placeholder="Mínimo 6 caracteres"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === "Enter") handleLogin();
                    }}
                  />
                </div>
              </div>

              <button
                data-testid="login-submit"
                type="button"
                onClick={handleLogin}
                disabled={submitting}
                className="btn btn-primary w-full py-2.5"
              >
                {submitting ? "Ingresando..." : "Ingresar al sistema"}
              </button>

              <div className="rounded-xl border border-ink-200 bg-ink-50/70 px-3 py-2 text-center text-xs text-ink-500 dark:border-ink-700 dark:bg-ink-800/60 dark:text-ink-400">
                {isSupabaseConfigured
                  ? "Usa tus credenciales de Supabase Auth"
                  : "Modo local · admin@triage.com / 123456"}
              </div>
            </div>

            <p className="mt-6 text-center text-xs text-ink-400 dark:text-ink-500">
              ¿Problemas para acceder? Contacta al administrador del sistema.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
