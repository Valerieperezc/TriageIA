import { useAuth } from "../context/AuthContext";
import { useNavigate } from "react-router-dom";
import { Mail, HeartPulse, LockKeyhole } from "lucide-react";
import { useState } from "react";
import toast from "react-hot-toast";
import ThemeToggle from "../components/ThemeToggle";

export default function Login() {
  const { login } = useAuth();
  const navigate = useNavigate();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  const handleLogin = () => {
    if (!email || !email.includes("@")) {
      return toast.error("Ingresa un correo válido");
    }

    if (!password) {
      return toast.error("Ingresa tu contraseña");
    }

    const ok = login(email, password);

    if (!ok) {
      return toast.error("Credenciales no autorizadas");
    }

    toast.success("Bienvenido");
    navigate("/");
  };

  return (
    <div className="relative flex min-h-screen items-center justify-center px-4 py-8">
      <div className="absolute right-4 top-4">
        <ThemeToggle />
      </div>

      <div className="w-full max-w-[350px] rounded-2xl bg-white p-8 shadow-lg dark:bg-slate-900">
        <div className="mb-6 flex items-center gap-2">
          <div className="rounded-xl bg-blue-100 p-2 dark:bg-blue-500/10">
            <HeartPulse className="h-6 w-6 text-blue-600 dark:text-blue-400" />
          </div>
          <h1 className="text-xl font-bold">TriageIA</h1>
        </div>

        <h2 className="text-2xl font-bold mb-2">
          Bienvenido
        </h2>

        <p className="mb-6 text-sm text-slate-500 dark:text-slate-400">
          Ingresa tus credenciales para acceder a la plataforma
        </p>

        <div className="input-shell mb-4">
          <Mail className="h-4 w-4 text-slate-400" />
          <input
            type="email"
            className="w-full bg-transparent py-3 text-sm text-inherit placeholder:text-slate-400"
            placeholder="correo@triage.com"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter") handleLogin();
            }}
          />
        </div>

        <div className="input-shell mb-5">
          <LockKeyhole className="h-4 w-4 text-slate-400" />
          <input
            type="password"
            className="w-full bg-transparent py-3 text-sm text-inherit placeholder:text-slate-400"
            placeholder="Contraseña"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter") handleLogin();
            }}
          />
        </div>

        <button
          onClick={handleLogin}
          className="btn btn-primary w-full"
        >
          Ingresar al sistema
        </button>

        <p className="mt-4 text-center text-xs text-slate-400 dark:text-slate-500">
          Acceso exclusivo para personal autorizado de TriageIA
        </p>

      </div>
    </div>
  );
}
