import { Bell, ChevronDown, Moon, Search, Sun } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";

export function Topbar({ isDark, setTheme }) {
  return (
    <header className="sticky top-0 z-20 border-b border-border bg-background/78 backdrop-blur-xl">
      <div className="flex h-16 items-center gap-3 px-4 sm:px-6">
        <div className="relative flex-1">
          <Search className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" size={18} />
          <Input className="pl-10" placeholder="Search companies, contacts, industries, locations..." aria-label="Global search" />
        </div>
        <Button variant="secondary" size="sm" className="w-10 px-0" aria-label="Notifications">
          <Bell size={17} />
        </Button>
        <Button
          variant="secondary"
          size="sm"
          className="w-10 px-0"
          aria-label="Toggle theme"
          onClick={() => setTheme(isDark ? "light" : "dark")}
        >
          {isDark ? <Sun size={17} /> : <Moon size={17} />}
        </Button>
        <button className="hidden h-10 items-center gap-2 rounded-md border border-border bg-card px-2 text-sm sm:flex">
          <img
            src="https://ui-avatars.com/api/?name=Revenue+Ops&background=14b8a6&color=ffffff"
            alt=""
            className="h-7 w-7 rounded-md"
          />
          <span className="font-medium">Revenue Ops</span>
          <ChevronDown size={16} aria-hidden />
        </button>
      </div>
    </header>
  );
}
