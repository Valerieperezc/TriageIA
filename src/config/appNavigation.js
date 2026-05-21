import {
  LayoutDashboard,
  Users,
  ClipboardList,
  Stethoscope,
  Settings,
} from "lucide-react";
import { getSidebarNavOrder } from "../utils/roleConfig";

export const NAV_DEF = {
  dashboard: {
    to: "/dashboard",
    end: true,
    icon: LayoutDashboard,
    label: "Dashboard",
    shortLabel: "Inicio",
    visible: () => true,
  },
  patients: {
    to: "/patients",
    icon: Users,
    label: "Pacientes",
    shortLabel: "Pacientes",
    visible: () => true,
  },
  triage: {
    to: "/triage",
    icon: Stethoscope,
    label: "Registrar triage",
    shortLabel: "Triage",
    visible: (_user, { canCreatePatient }) => canCreatePatient,
  },
  audit: {
    to: "/audit",
    icon: ClipboardList,
    label: "Historial",
    shortLabel: "Historial",
    visible: (user) => user?.role === "admin",
  },
  settings: {
    to: "/settings",
    icon: Settings,
    label: "Configuración",
    shortLabel: "Ajustes",
    visible: () => true,
  },
};

export function getVisibleNavItems(user, { canCreatePatient } = {}) {
  const order = getSidebarNavOrder(user?.role);
  return order
    .map((key) => NAV_DEF[key])
    .filter((def) => def && def.visible(user, { canCreatePatient }));
}
