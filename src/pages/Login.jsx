import { useAuth } from "../context/AuthContext";
import { useNavigate } from "react-router-dom";
import { Mail, HeartPulse } from "lucide-react";
import { useState } from "react";
import toast from "react-hot-toast";

export default function Login() {
  const { login } = useAuth();
  const navigate = useNavigate();

  const [email, setEmail] = useState("");

  const handleLogin = () => {
    if (!email || !email.includes("@")) {
      return toast.error("Ingresa un correo válido");
    }

    const ok = login(email);

    if (!ok) {
      return toast.error("Usuario no autorizado ❌");
    }

    toast.success("Bienvenido 🚀");
    navigate("/"); // 🔥 aquí ocurre el cambio de pantalla
  };

  return (
    <div className="h-screen flex items-center justify-center bg-gray-100">

      <div className="bg-white p-8 rounded-2xl shadow-lg w-[350px]">

        {/* LOGO */}
        <div className="flex items-center gap-2 mb-6">
          <div className="bg-blue-100 p-2 rounded-xl">
            <HeartPulse className="text-blue-600 w-6 h-6" />
          </div>
          <h1 className="text-xl font-bold">TriageIA</h1>
        </div>

        <h2 className="text-2xl font-bold mb-2">
          Bienvenido
        </h2>

        <p className="text-sm text-gray-500 mb-6">
          Ingresa tu correo autorizado
        </p>

        {/* INPUT */}
        <div className="input mb-4">
          <Mail className="text-gray-400 w-4 h-4" />
          <input
            type="email"
            placeholder="usuario@uninorte.edu.co"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter") handleLogin(); // 🔥 ENTER funciona
            }}
          />
        </div>

        {/* BOTÓN */}
        <button
          onClick={handleLogin}
          className="btn btn-primary w-full"
        >
          Ingresar al sistema
        </button>

        {/* AYUDA */}
        <p className="text-xs text-gray-400 mt-4 text-center">
          Ejemplo: admin@triage.com o @uninorte.edu.co
        </p>

      </div>
    </div>
  );
}