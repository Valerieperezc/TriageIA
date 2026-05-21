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
  Shield,
  ArrowRight,
  Clock,
  BarChart3,
} from "lucide-react";
import { useState } from "react";
import toast from "react-hot-toast";
import { useTheme } from "../hooks/useTheme";
import {
  markPostLoginNavigationStart,
  shouldPrefetchPrivateAreaOnCurrentConnection,
} from "../utils/performance";
import { getHomePathForRole } from "../utils/roleConfig";
import "./Login.css";

async function prefetchPrivateArea() {
  await Promise.allSettled([
    import("../App"),
    import("../layouts/PrivateAppLayout"),
    import("../pages/Dashboard"),
  ]);
}

const HERO_STATS = [
  { value: "CTAS", label: "Clasificación en segundos" },
  { value: "24/7", label: "Cola en tiempo real" },
  { value: "100%", label: "Historial auditado" },
];

const TRUST_ITEMS = [
  { icon: Shield, label: "Acceso cifrado" },
  { icon: Clock, label: "Sesión segura" },
  { icon: BarChart3, label: "Datos en la nube" },
];

function LoginHero() {
  return (
    <aside className="login-hero" aria-hidden="true">
      <span className="login-hero__glow login-hero__glow--a" />
      <span className="login-hero__glow login-hero__glow--b" />
      <span className="login-hero__grid" />

      <div className="login-hero__inner">
        <div>
          <div className="login-hero__brand">
            <span className="login-hero__logo">
              <HeartPulse className="h-6 w-6" strokeWidth={2} />
            </span>
            <div>
              <p className="login-hero__eyebrow">TriageIA</p>
              <p className="login-hero__title">Panel clínico</p>
            </div>
          </div>

          <h2 className="login-hero__headline">
            Urgencias priorizadas con precisión clínica.
          </h2>
          <p className="login-hero__sub">
            La plataforma que tu equipo de emergencias necesita: triage CTAS,
            alertas críticas y trazabilidad completa en un solo lugar.
          </p>

          <div className="login-hero__stats">
            {HERO_STATS.map((stat) => (
              <div key={stat.value} className="login-hero__stat">
                <p className="login-hero__stat-value">{stat.value}</p>
                <p className="login-hero__stat-label">{stat.label}</p>
              </div>
            ))}
          </div>
        </div>

        <div className="login-hero__preview">
          <div className="login-hero__preview-card">
            <div className="login-hero__preview-header">
              <div className="login-hero__preview-dots">
                <span />
                <span />
                <span />
              </div>
              <span className="login-hero__preview-label">Dashboard · Hoy</span>
            </div>
            <div className="login-hero__preview-bars">
              {Array.from({ length: 6 }).map((_, i) => (
                <span key={i} className="login-hero__preview-bar" />
              ))}
            </div>
            <div className="login-hero__features">
              <span className="login-hero__pill">
                <Activity className="h-3.5 w-3.5" />
                Signos vitales
              </span>
              <span className="login-hero__pill">
                <HeartPulse className="h-3.5 w-3.5" />
                Alertas CTAS I
              </span>
              <span className="login-hero__pill">
                <Sparkles className="h-3.5 w-3.5" />
                Cola en vivo
              </span>
            </div>
          </div>
          <p className="login-hero__footer">
            © {new Date().getFullYear()} TriageIA · Uso clínico supervisado
          </p>
        </div>
      </div>
    </aside>
  );
}

export default function Login() {
  const { login } = useAuth();
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
      const loggedUser = await login(email, password);
      if (!loggedUser) {
        toast.error("Usuario o contraseña inválidos");
        return;
      }

      markPostLoginNavigationStart();
      if (shouldPrefetchPrivateAreaOnCurrentConnection()) {
        void prefetchPrivateArea();
      }
      toast.success("Bienvenido");
      navigate(getHomePathForRole(loggedUser.role), { replace: true });
    } catch (error) {
      const message = error?.message || "No se pudo iniciar sesión";
      toast.error(message);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="login-page">
      <span className="login-page__mesh" aria-hidden />

      <button
        type="button"
        onClick={toggleTheme}
        className="btn-icon login-theme-btn"
        title={theme === "dark" ? "Modo claro" : "Modo oscuro"}
        data-testid="theme-toggle"
      >
        {theme === "dark" ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
      </button>

      <div className="login-layout">
        <LoginHero />

        <main className="login-form-panel">
          <div className="login-form-panel__inner">
            <div className="login-top-banner" aria-hidden="true">
              <span className="login-top-banner__glow" />
              <div className="login-top-banner__inner">
                <span className="login-top-banner__icon">
                  <HeartPulse className="h-5 w-5" />
                </span>
                <div>
                  <p className="login-top-banner__eyebrow">TriageIA</p>
                  <p className="login-top-banner__title">Panel clínico</p>
                </div>
              </div>
            </div>

            <div className="login-card">
              <span className="login-card__badge">
                <span className="login-card__badge-dot" />
                Acceso seguro
              </span>

              <h1 className="login-card__title">Bienvenido de nuevo</h1>
              <p className="login-card__subtitle">
                Ingresa con tu correo institucional para acceder al panel clínico.
              </p>

              <div className="login-field">
                <label className="login-field__label" htmlFor="login-email">
                  Correo electrónico
                </label>
                <div className="input login-input">
                  <Mail className="h-4 w-4 shrink-0 text-ink-400 dark:text-ink-500" />
                  <input
                    id="login-email"
                    data-testid="login-email"
                    type="email"
                    autoComplete="email"
                    placeholder="usuario@uninorte.edu.co"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === "Enter") handleLogin();
                    }}
                  />
                </div>
              </div>

              <div className="login-field">
                <label className="login-field__label" htmlFor="login-password">
                  Contraseña
                </label>
                <div className="input login-input">
                  <Lock className="h-4 w-4 shrink-0 text-ink-400 dark:text-ink-500" />
                  <input
                    id="login-password"
                    data-testid="login-password"
                    type="password"
                    autoComplete="current-password"
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
                className="login-submit"
              >
                {submitting ? (
                  "Ingresando…"
                ) : (
                  <>
                    Ingresar al sistema
                    <ArrowRight className="h-4 w-4" />
                  </>
                )}
              </button>

              <div className="login-divider">Plataforma clínica</div>

              <div className="login-trust">
                {TRUST_ITEMS.map((item) => {
                  const TrustIcon = item.icon;
                  return (
                    <span key={item.label} className="login-trust__item">
                      <TrustIcon className="h-3.5 w-3.5 text-brand-500 dark:text-brand-400" />
                      {item.label}
                    </span>
                  );
                })}
              </div>
            </div>

            <p className="login-footer">
              ¿Problemas para acceder?{" "}
              <a href="mailto:soporte@triageia.local">Contacta al administrador</a>
            </p>
          </div>
        </main>
      </div>
    </div>
  );
}
