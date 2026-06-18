import { NavLink } from "react-router-dom";
import { BarChart3, BriefcaseBusiness, Building2, LayoutDashboard, ListChecks, Users } from "lucide-react";
import { cn } from "@/utils/cn";

const items = [
  { label: "Home", path: "/", icon: LayoutDashboard },
  { label: "Companies", path: "/companies", icon: Building2 },
  { label: "Leads", path: "/leads", icon: Users },
  { label: "Jobs", path: "/jobs", icon: BriefcaseBusiness },
  { label: "Lists", path: "/saved-lists", icon: ListChecks },
  { label: "Analytics", path: "/analytics", icon: BarChart3 },
];

export function MobileNav() {
  return (
    <nav className="fixed inset-x-0 bottom-0 z-30 grid grid-cols-6 border-t border-border bg-card/92 backdrop-blur-xl lg:hidden">
      {items.map((item) => {
        const Icon = item.icon;
        return (
          <NavLink
            key={item.path}
            to={item.path}
            className={({ isActive }) =>
              cn("flex h-14 flex-col items-center justify-center gap-1 text-[11px] text-muted-foreground", isActive && "text-primary")
            }
          >
            <Icon size={17} aria-hidden />
            <span>{item.label}</span>
          </NavLink>
        );
      })}
    </nav>
  );
}
