import { useMemo, useState } from "react";
import { BriefcaseBusiness, Building2, ExternalLink, MapPinned, Network } from "lucide-react";
import { EmptyState } from "@/components/EmptyState";
import { FilterConsole } from "@/components/FilterConsole";
import { IntelligenceStrip } from "@/components/IntelligenceStrip";
import { PageHeader } from "@/components/PageHeader";
import { Badge } from "@/components/ui/Badge";
import { Card } from "@/components/ui/Card";
import { companies, jobPosts } from "@/data/mockData";
import { matchesFilter, sectorForIndustry, uniqueOptions } from "@/utils/taxonomy";

export default function Jobs() {
  const [query, setQuery] = useState("");
  const [sector, setSector] = useState("All");
  const [industry, setIndustry] = useState("All");
  const [location, setLocation] = useState("All");
  const [department, setDepartment] = useState("All");
  const [mode, setMode] = useState("All");
  const enrichedJobs = useMemo(() => {
    const companyMap = new Map(companies.map((company) => [company.id, company]));
    return jobPosts.map((job) => {
      const company = companyMap.get(job.companyId);
      return {
        ...job,
        industry: company?.industry || "Unknown",
        sector: sectorForIndustry(company?.industry),
        country: company?.country || "Unknown",
      };
    });
  }, []);
  const rows = useMemo(() => enrichedJobs.filter((job) => {
    const term = query.toLowerCase();
    const matches = [job.title, job.companyName, job.location, job.department, job.industry, job.sector].some((value) => String(value).toLowerCase().includes(term));
    return (
      matches &&
      matchesFilter(job.sector, sector) &&
      matchesFilter(job.industry, industry) &&
      matchesFilter(job.country, location) &&
      matchesFilter(job.department, department) &&
      matchesFilter(job.workMode, mode)
    );
  }), [query, enrichedJobs, sector, industry, location, department, mode]);
  return (
    <div>
      <PageHeader eyebrow="Hiring signal engine" title="Job Intelligence" description="Filter job demand by sector, industry, location, department, and work mode." />
      <IntelligenceStrip items={[
        { label: "Matched Jobs", value: rows.length, detail: "Open roles in current view", icon: <BriefcaseBusiness size={19} /> },
        { label: "Companies", value: new Set(rows.map((row) => row.companyId)).size, detail: "Accounts with demand", icon: <Building2 size={19} /> },
        { label: "Departments", value: new Set(rows.map((row) => row.department)).size, detail: "Hiring functions", icon: <Network size={19} /> },
        { label: "Locations", value: new Set(rows.map((row) => row.country)).size, detail: "Markets represented", icon: <MapPinned size={19} /> },
      ]} />
      <FilterConsole
        title="Hiring Signal Filters"
        search={query}
        onSearch={setQuery}
        resultCount={rows.length}
        totalCount={enrichedJobs.length}
        onReset={() => {
          setQuery("");
          setSector("All");
          setIndustry("All");
          setLocation("All");
          setDepartment("All");
          setMode("All");
        }}
        filters={[
          { key: "sector", label: "Sector", value: sector, options: uniqueOptions(enrichedJobs, "sector"), onChange: setSector, placeholder: "Try operations..." },
          { key: "industry", label: "Industry", value: industry, options: uniqueOptions(enrichedJobs, "industry"), onChange: setIndustry, placeholder: "Try data..." },
          { key: "location", label: "Location", value: location, options: uniqueOptions(enrichedJobs, "country"), onChange: setLocation, placeholder: "Try Singapore..." },
          { key: "department", label: "Department", value: department, options: uniqueOptions(enrichedJobs, "department"), onChange: setDepartment, placeholder: "Try product..." },
          { key: "mode", label: "Work Mode", value: mode, options: ["All", "Remote", "Hybrid", "On-site"], onChange: setMode, placeholder: "Try hybrid..." },
        ]}
      />
      {!rows.length ? <EmptyState /> : <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">{rows.slice(0, 60).map((job) => <Card key={job.id} className="transition hover:-translate-y-0.5 hover:border-primary/40"><div className="flex items-center justify-between gap-3"><Badge tone="teal">{job.workMode}</Badge><span className="text-xs text-muted-foreground">{job.postedDate}</span></div><h2 className="mt-3 font-semibold">{job.title}</h2><p className="mt-1 text-sm text-muted-foreground">{job.companyName} · {job.location}</p><div className="mt-3 flex flex-wrap gap-2"><Badge>{job.sector}</Badge><Badge tone="orange">{job.department}</Badge></div><p className="mt-3 text-sm text-muted-foreground">{job.description}</p><a className="mt-4 inline-flex items-center gap-2 text-sm font-medium text-primary" href={job.applyUrl} target="_blank" rel="noreferrer">Apply URL <ExternalLink size={14} /></a></Card>)}</div>}
    </div>
  );
}
