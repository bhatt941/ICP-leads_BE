import { Outlet } from "react-router-dom";
import { useState } from "react";
import { Sidebar } from "./Sidebar";
import { Topbar } from "./Topbar";
import { MobileNav } from "./MobileNav";
import { useTheme } from "@/hooks/useTheme";
import { cn } from "@/utils/cn";

export function AppLayout() {
  const [collapsed, setCollapsed] = useState(false);
  const { isDark, setTheme } = useTheme();

  return (
    <div className="min-h-screen">
      <Sidebar collapsed={collapsed} onToggle={() => setCollapsed((value) => !value)} />
      <div className={cn("min-h-screen transition-all duration-300 lg:pb-0", collapsed ? "lg:pl-[76px]" : "lg:pl-64")}>
        <Topbar isDark={isDark} setTheme={setTheme} />
        <main className="px-4 pb-24 pt-5 sm:px-6 lg:pb-8">
          <Outlet />
        </main>
      </div>
      <MobileNav />
    </div>
  );
}
