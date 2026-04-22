import { usePatients } from "../context/PatientContext";
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { PieChart, Pie, Cell, Tooltip, ResponsiveContainer } from "recharts";
import { Activity, AlertTriangle, Clock, Users } from "lucide-react";

export default function Dashboard() {
  const { patients } = usePatients();
  const navigate = useNavigate();

  const data = [
    { name: "I", value: patients.filter(p => p.triage === "I").length },
    { name: "II", value: patients.filter(p => p.triage === "II").length },
    { name: "III", value: patients.filter(p => p.triage === "III").length },
  ];

  const COLORS = ["#ef4444", "#f97316", "#22c55e"];

  const Card = ({ icon, title, value, route }) => (
    <motion.div
      whileHover={{ scale: 1.03 }}
      onClick={() => navigate(route)}
      className="card flex cursor-pointer items-center gap-4"
    >
      <div className="rounded-xl bg-gray-100 p-3 dark:bg-slate-800">{icon}</div>

      <div>
        <p className="text-sm text-slate-500 dark:text-slate-400">{title}</p>
        <p className="text-xl font-bold">{value}</p>
      </div>
    </motion.div>
  );

  return (
    <div className="space-y-6">

      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">

        <div>
          <h1 className="text-3xl font-bold">Dashboard</h1>
          <p className="text-slate-500 dark:text-slate-400">Sistema de triage</p>
        </div>

        <button
          onClick={() => navigate("/triage")}
          className="btn btn-primary w-full sm:w-auto"
        >
          + Registrar Paciente
        </button>
      </div>

      <div className="grid gap-4 md:grid-cols-4">

        <Card
          icon={<Users className="text-blue-600" />}
          title="Pacientes"
          value={patients.length}
          route="/patients"
        />

        <Card
          icon={<AlertTriangle className="text-red-500" />}
          title="Críticos"
          value={data[0].value}
          route="/patients?triage=I"
        />

        <Card
          icon={<Clock className="text-orange-500" />}
          title="Urgentes"
          value={data[1].value}
          route="/patients?triage=II"
        />

        <Card
          icon={<Activity className="text-green-500" />}
          title="No urgentes"
          value={data[2].value}
          route="/patients?triage=III"
        />

      </div>

      <div className="card">
        <div className="mb-4">
          <h2 className="text-lg font-semibold">Distribución de triage</h2>
          <p className="text-sm text-slate-500 dark:text-slate-400">
            Vista general de prioridades activas.
          </p>
        </div>

        <div className="h-72 w-full">
          <ResponsiveContainer width="100%" height="100%">
            <PieChart>
              <Pie data={data} dataKey="value" innerRadius={55} outerRadius={90}>
                {data.map((_, i) => (
                  <Cell key={i} fill={COLORS[i]} />
                ))}
              </Pie>
              <Tooltip />
            </PieChart>
          </ResponsiveContainer>
        </div>
      </div>

    </div>
  );
}
