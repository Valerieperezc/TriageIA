import { LayoutDashboard, Users, ClipboardList } from "lucide-react";
import { Link, useLocation } from "react-router-dom";

export default function Sidebar() {
  const { pathname } = useLocation();

  const item = (to, icon, label) => (
    <Link
      to={to}
      className={`flex items-center gap-3 p-3 rounded-xl transition ${
        pathname === to
          ? "bg-blue-600 text-white"
          : "hover:bg-gray-100"
      }`}
    >
      {icon} {label}
    </Link>
  );

  return (
    <aside className="w-64 bg-white/80 backdrop-blur p-6 hidden md:flex flex-col shadow">
      <h1 className="font-bold mb-6 text-lg">TriageIA</h1>

      {item("/", <LayoutDashboard />, "Dashboard")}
      {item("/patients", <Users />, "Pacientes")}
      {item("/audit", <ClipboardList />, "Historial")}
    </aside>
  );
}