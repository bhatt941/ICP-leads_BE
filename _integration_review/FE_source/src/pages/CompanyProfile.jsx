import { useMemo, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { Area, AreaChart, Bar, BarChart, CartesianGrid, Pie, PieChart, Cell, Tooltip, XAxis, YAxis } from "recharts";
import { ExternalLink, Globe, Mail, MapPin } from "lucide-react";
import { ChartCard } from "@/components/ChartCard";
import { DataTable } from "@/components/DataTable";
import { EmptyState } from "@/components/EmptyState";
import { PageHeader } from "@/components/PageHeader";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { cn } from "@/utils/cn";
import { companies, contacts, jobPosts } from "@/data/mockData";

const tabItems = ["Overview", "Contacts", "Job Posts", "Insights"];

export default function CompanyProfile() {
  const { companyId } = useParams();
  const [tab, setTab] = useState("Overview");
  const company = companies.find((item) => item.id === companyId);
  const companyContacts = useMemo(() => contacts.filter((contact) => contact.companyId === companyId).slice(0, 20), [companyId]);
  const companyJobs = useMemo(() => jobPosts.filter((job) => job.companyId === companyId).slice(0, 12), [companyId]);

  if (!company) return <EmptyState title="Company not found" description="The selected company does not exist in local mock data." />;

  const contactColumns = [
    { key: "name", label: "Name", sortable: true },
    { key: "designation", label: "Designation", sortable: true },
    { key: "department", label: "Department", sortable: true },
    { key: "seniority", label: "Seniority", sortable: true },
    { key: "linkedin", label: "LinkedIn URL", render: (row) => <a className="text-primary" href={row.linkedin} target="_blank" rel="noreferrer">Open LinkedIn</a> },
  ];

  const trend = Array.from({ length: 8 }, (_, index) => ({ month: `M${index + 1}`, hiring: 4 + ((index + company.headcount) % 15), growth: 10 + index * 4 + (company.leadScore % 8) }));
  const departments = ["Engineering", "Sales", "Marketing", "Data", "Operations"].map((name, index) => ({ name, value: 4 + ((company.headcount + index * 7) % 22) }));

  return (
    <div>
      <PageHeader eyebrow="Company profile" title={company.name} description={company.description} action={<Button variant="secondary"><Link to="/companies">Back to Companies</Link></Button>} />
      <Card className="mb-5">
        <div className="flex flex-col gap-5 lg:flex-row lg:items-center">
          <img src={company.logo} alt="" className="h-20 w-20 rounded-lg border border-border" />
          <div className="grid flex-1 gap-3 md:grid-cols-2 xl:grid-cols-4">
            <Info icon={Globe} label="Website" value={<a href={company.website} target="_blank" rel="noreferrer">{company.website}</a>} />
            <Info icon={Mail} label="Email" value={<a href={`mailto:${company.email}`}>{company.email}</a>} />
            <Info icon={ExternalLink} label="LinkedIn" value={<a href={company.linkedin} target="_blank" rel="noreferrer">Company page</a>} />
            <Info icon={MapPin} label="Address" value={company.address} />
          </div>
        </div>
      </Card>

      <div className="mb-5 flex gap-2 overflow-x-auto">
        {tabItems.map((item) => (
          <button key={item} onClick={() => setTab(item)} className={cn("h-10 rounded-md border border-border px-4 text-sm font-medium", tab === item ? "bg-primary text-primary-foreground" : "bg-card text-muted-foreground")}>
            {item}
          </button>
        ))}
      </div>

      {tab === "Overview" && (
        <div className="grid gap-4 lg:grid-cols-[1fr_1fr]">
          <Card>
            <div className="grid gap-4 sm:grid-cols-2">
              <Metric label="Industry" value={company.industry} />
              <Metric label="Headcount" value={company.headcount.toLocaleString()} />
              <Metric label="Founded Year" value={company.founded} />
              <Metric label="Revenue Range" value={company.revenueRange} />
              <Metric label="Country" value={company.country} />
              <Metric label="Hiring Status" value={<Badge tone={company.hiringStatus.includes("Hiring") ? "green" : "muted"}>{company.hiringStatus}</Badge>} />
            </div>
          </Card>
          <Card>
            <h2 className="font-semibold">Technology Stack</h2>
            <div className="mt-4 flex flex-wrap gap-2">
              {company.techStack.map((item) => <Badge key={item} tone="teal">{item}</Badge>)}
            </div>
          </Card>
        </div>
      )}

      {tab === "Contacts" && <DataTable columns={contactColumns} rows={companyContacts} pageSize={8} />}

      {tab === "Job Posts" && (
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          {companyJobs.map((job) => (
            <Card key={job.id}>
              <Badge tone="orange">{job.workMode}</Badge>
              <h2 className="mt-3 font-semibold">{job.title}</h2>
              <p className="mt-1 text-sm text-muted-foreground">{job.companyName} · {job.location}</p>
              <p className="mt-3 text-sm text-muted-foreground">{job.description}</p>
              <a className="mt-4 inline-flex items-center gap-2 text-sm font-medium text-primary" href={job.applyUrl} target="_blank" rel="noreferrer">Apply URL <ExternalLink size={14} /></a>
            </Card>
          ))}
        </div>
      )}

      {tab === "Insights" && (
        <div className="grid gap-4 xl:grid-cols-2">
          <ChartCard title="Hiring Trends"><AreaChart data={trend}><CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" /><XAxis dataKey="month" /><YAxis /><Tooltip /><Area dataKey="hiring" stroke="#14b8a6" fill="#14b8a633" /></AreaChart></ChartCard>
          <ChartCard title="Employee Growth"><AreaChart data={trend}><CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" /><XAxis dataKey="month" /><YAxis /><Tooltip /><Area dataKey="growth" stroke="#f59e0b" fill="#f59e0b33" /></AreaChart></ChartCard>
          <ChartCard title="Hiring Departments"><BarChart data={departments}><CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" /><XAxis dataKey="name" /><YAxis /><Tooltip /><Bar dataKey="value" fill="#14b8a6" radius={[5, 5, 0, 0]} /></BarChart></ChartCard>
          <ChartCard title="Workforce Distribution"><PieChart><Pie data={departments} dataKey="value" nameKey="name" outerRadius={90}>{departments.map((entry, index) => <Cell key={entry.name} fill={["#14b8a6", "#f59e0b", "#6366f1", "#22c55e", "#ef4444"][index]} />)}</Pie><Tooltip /></PieChart></ChartCard>
        </div>
      )}
    </div>
  );
}

function Info({ icon: Icon, label, value }) {
  return <div className="min-w-0"><p className="flex items-center gap-2 text-xs text-muted-foreground"><Icon size={14} /> {label}</p><div className="mt-1 truncate text-sm font-medium text-primary">{value}</div></div>;
}

function Metric({ label, value }) {
  return <div className="rounded-lg border border-border bg-muted/20 p-4"><p className="text-xs text-muted-foreground">{label}</p><div className="mt-2 text-lg font-semibold">{value}</div></div>;
}
