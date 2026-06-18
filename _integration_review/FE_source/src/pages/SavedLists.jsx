import { BookmarkCheck, Download, FolderKanban } from "lucide-react";
import { PageHeader } from "@/components/PageHeader";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { companies, contacts } from "@/data/mockData";
import { exportCsv } from "@/utils/exportCsv";

const lists = [
  { name: "Series B SaaS Hiring", type: "Dynamic", companies: companies.slice(0, 18), contacts: contacts.slice(0, 64) },
  { name: "Cybersecurity Executives", type: "Saved", companies: companies.filter((c) => c.industry === "Cybersecurity").slice(0, 12), contacts: contacts.slice(80, 132) },
  { name: "APAC Expansion Targets", type: "Dynamic", companies: companies.filter((c) => ["Singapore", "India", "Australia", "Japan"].includes(c.country)).slice(0, 20), contacts: contacts.slice(160, 230) },
];

export default function SavedLists() {
  return (
    <div>
      <PageHeader eyebrow="Saved workspace" title="Saved Lists" description="Curated account and contact segments ready for export, routing, or campaign planning." />
      <div className="grid gap-4 lg:grid-cols-3">
        {lists.map((list) => <Card key={list.name}><div className="flex items-start justify-between gap-3"><div className="grid h-11 w-11 place-items-center rounded-lg bg-primary/12 text-primary"><FolderKanban size={21} /></div><Badge tone={list.type === "Dynamic" ? "teal" : "muted"}>{list.type}</Badge></div><h2 className="mt-4 text-lg font-semibold">{list.name}</h2><div className="mt-4 grid grid-cols-2 gap-3"><Metric label="Companies" value={list.companies.length} /><Metric label="Contacts" value={list.contacts.length} /></div><div className="mt-4 flex gap-2"><Button size="sm" onClick={() => exportCsv(`${list.name}.csv`, list.contacts)}><Download size={15} /> Export</Button><Button variant="secondary" size="sm"><BookmarkCheck size={15} /> Saved</Button></div></Card>)}
      </div>
    </div>
  );
}

function Metric({ label, value }) {
  return <div className="rounded-md bg-muted/35 p-3"><p className="text-xs text-muted-foreground">{label}</p><p className="mt-1 text-xl font-semibold">{value}</p></div>;
}
