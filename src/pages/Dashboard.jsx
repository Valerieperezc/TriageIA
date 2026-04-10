import { usePatients } from "../context/PatientContext";
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { PieChart, Pie, Cell, Tooltip } from "recharts";
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
      className="card flex items-center gap-4 cursor-pointer"
    >
      <div className="bg-gray-100 p-3 rounded-xl">{icon}</div>

      <div>
        <p className="text-gray-500 text-sm">{title}</p>
        <p className="text-xl font-bold">{value}</p>
      </div>
    </motion.div>
  );

  return (
    <div className="space-y-6">

      <div className="flex justify-between items-center">

        <div>
          <h1 className="text-3xl font-bold">Dashboard</h1>
          <p className="text-gray-500">Sistema de triage</p>
        </div>

        <button
          onClick={() => navigate("/triage")}
          className="btn btn-primary"
        >
          + Registrar Paciente
        </button>
      </div>

      {/* 🔥 CARDS CON FILTRO */}
      <div className="grid md:grid-cols-4 gap-4">

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

      {/* 📊 GRÁFICA */}
      <div className="card flex justify-center">
        <PieChart width={300} height={300}>
          <Pie data={data} dataKey="value">
            {data.map((_, i) => (
              <Cell key={i} fill={COLORS[i]} />
            ))}
          </Pie>
          <Tooltip />
        </PieChart>
      </div>

    </div>
  );
}