import { NavLink } from "react-router-dom";
import { BarChart3, BriefcaseBusiness, Building2, ChartNoAxesCombined, ContactRound, LayoutDashboard, ListChecks, Settings, Users, PanelLeftClose, PanelLeftOpen } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { cn } from "@/utils/cn";

const items = [
  { label: "Dashboard", path: "/", icon: LayoutDashboard },
  { label: "Companies", path: "/companies", icon: Building2 },
  { label: "Leads", path: "/leads", icon: Users },
  { label: "Contacts", path: "/contacts", icon: ContactRound },
  { label: "Job Intelligence", path: "/jobs", icon: BriefcaseBusiness },
  { label: "Saved Lists", path: "/saved-lists", icon: ListChecks },
  { label: "Analytics", path: "/analytics", icon: BarChart3 },
  { label: "Settings", path: "/settings", icon: Settings },
];

export function Sidebar({ collapsed, onToggle }) {
  return (
    <aside
      className={cn(
        "fixed inset-y-0 left-0 z-30 hidden border-r border-border bg-card/86 backdrop-blur-xl transition-all duration-300 lg:flex lg:flex-col",
        collapsed ? "w-[76px]" : "w-64"
      )}
    >
      <div className="flex h-16 items-center justify-between px-4">
        <div className="flex items-center gap-3 overflow-hidden">
          <div className="grid h-9 w-9 shrink-0 place-items-center rounded-lg bg-primary text-primary-foreground">
            <ChartNoAxesCombined size={20} aria-hidden />
          </div>
          {!collapsed && (
            <div>
              <p className="text-sm font-semibold">LeadIQ Command</p>
              <p className="text-xs text-muted-foreground">AI lead intelligence</p>
            </div>
          )}
        </div>
        <Button variant="ghost" size="sm" onClick={onToggle} aria-label="Toggle sidebar" className="w-8 px-0">
          {collapsed ? <PanelLeftOpen size={17} /> : <PanelLeftClose size={17} />}
        </Button>
      </div>
      <nav className="flex-1 space-y-1 px-3 py-4">
        {items.map((item) => {
          const Icon = item.icon;
          return (
            <NavLink
              key={item.path}
              to={item.path}
              className={({ isActive }) =>
                cn(
                  "flex h-10 items-center gap-3 rounded-md px-3 text-sm font-medium text-muted-foreground transition hover:bg-muted hover:text-foreground",
                  isActive && "bg-primary/12 text-primary",
                  collapsed && "justify-center px-0"
                )
              }
              title={collapsed ? item.label : undefined}
            >
              <Icon size={18} aria-hidden />
              {!collapsed && <span>{item.label}</span>}
            </NavLink>
          );
        })}
      </nav>
    </aside>
  );
}
