import { useNavigate } from "react-router-dom";
import { HeartPulse } from "lucide-react";
import { useAuth } from "../context/AuthContext";

export default function Topbar() {
  const nav = useNavigate();
  const { user, logout } = useAuth();

  return (
    <div className="flex justify-between items-center mb-6">

      <div className="flex items-center gap-3">
        <div className="bg-blue-100 p-2 rounded-xl">
          <HeartPulse className="text-blue-600" />
        </div>

        <div>
          <p className="font-bold">TriageIA</p>
          <p className="text-xs text-gray-500">
            {user?.email} ({user?.role})
          </p>
        </div>
      </div>

      <div className="flex gap-2">
        <button onClick={()=>nav("/triage")} className="btn btn-primary">
          + Paciente
        </button>

        <button onClick={logout} className="btn bg-gray-500">
          Salir
        </button>
      </div>

    </div>
  );
}