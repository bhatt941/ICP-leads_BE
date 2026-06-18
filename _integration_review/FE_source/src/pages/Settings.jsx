import { Bell, Database, KeyRound, ShieldCheck, SlidersHorizontal } from "lucide-react";
import { PageHeader } from "@/components/PageHeader";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";

const settings = [
  { icon: ShieldCheck, title: "Workspace Security", detail: "SSO, audit logs, and role permissions prepared for backend integration.", badge: "Enterprise" },
  { icon: Database, title: "Data Sources", detail: "Current mode uses local JSON files only. External enrichment can be added later.", badge: "Mock data" },
  { icon: Bell, title: "Notifications", detail: "Hiring alerts, saved-list changes, and lead score movements.", badge: "Enabled" },
  { icon: KeyRound, title: "API Readiness", detail: "Frontend services are separated for a future authenticated API layer.", badge: "Planned" },
  { icon: SlidersHorizontal, title: "Scoring Controls", detail: "Configure lead score thresholds and routing rules for revenue teams.", badge: "Configurable" },
];

export default function Settings() {
  return (
    <div>
      <PageHeader eyebrow="Administration" title="Settings" description="Workspace preferences, governance, and integration-ready controls for the lead intelligence platform." />
      <div className="grid gap-4 lg:grid-cols-2">
        {settings.map((item) => {
          const Icon = item.icon;
          return <Card key={item.title}><div className="flex items-start gap-4"><div className="grid h-11 w-11 place-items-center rounded-lg bg-primary/12 text-primary"><Icon size={21} /></div><div className="min-w-0 flex-1"><div className="flex items-center justify-between gap-3"><h2 className="font-semibold">{item.title}</h2><Badge tone="teal">{item.badge}</Badge></div><p className="mt-2 text-sm text-muted-foreground">{item.detail}</p><Button className="mt-4" variant="secondary" size="sm">Configure</Button></div></div></Card>;
        })}
      </div>
    </div>
  );
}
