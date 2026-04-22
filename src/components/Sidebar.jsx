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
          : "hover:bg-gray-100 dark:hover:bg-slate-800"
      }`}
    >
      {icon} {label}
    </Link>
  );

  return (
    <aside className="hidden w-64 flex-col bg-white/80 p-6 shadow backdrop-blur md:flex dark:bg-slate-900/85">
      <h1 className="mb-6 text-lg font-bold">TriageIA</h1>

      {item("/", <LayoutDashboard />, "Dashboard")}
      {item("/patients", <Users />, "Pacientes")}
      {item("/audit", <ClipboardList />, "Historial")}
    </aside>
  );
}
