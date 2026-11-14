import {
  Activity,
  Bell,
  BrainCircuit,
  FileText,
  LayoutDashboard,
  Orbit,
  PersonStanding,
  type LucideIcon,
} from "lucide-react";

export interface NavItem {
  to: "/overview" | "/health" | "/body" | "/assessment" | "/environment" | "/alerts" | "/reports";
  label: string;
  icon: LucideIcon;
  group: "Crew member" | "Mission";
}

export const NAV_ITEMS: NavItem[] = [
  { to: "/overview", label: "Mission overview", icon: LayoutDashboard, group: "Crew member" },
  { to: "/health", label: "Health monitoring", icon: Activity, group: "Crew member" },
  { to: "/body", label: "3D body explorer", icon: PersonStanding, group: "Crew member" },
  { to: "/assessment", label: "AI assessment", icon: BrainCircuit, group: "Crew member" },
  { to: "/environment", label: "Space environment", icon: Orbit, group: "Mission" },
  { to: "/alerts", label: "Alerts", icon: Bell, group: "Mission" },
  { to: "/reports", label: "Reports", icon: FileText, group: "Mission" },
];
