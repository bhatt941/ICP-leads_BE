import { useMemo, useState } from "react";
import { Download, MapPinned, Target, UserCheck, UsersRound } from "lucide-react";
import { DataTable } from "@/components/DataTable";
import { FilterConsole } from "@/components/FilterConsole";
import { IntelligenceStrip } from "@/components/IntelligenceStrip";
import { PageHeader } from "@/components/PageHeader";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { companies, contacts } from "@/data/mockData";
import { exportCsv } from "@/utils/exportCsv";
import { matchesFilter, sectorForIndustry, uniqueOptions } from "@/utils/taxonomy";

const scoreCategory = (score) => (score >= 84 ? "High" : score >= 70 ? "Medium" : "Low");

export default function Leads() {
  const [query, setQuery] = useState("");
  const [sector, setSector] = useState("All");
  const [industry, setIndustry] = useState("All");
  const [location, setLocation] = useState("All");
  const [department, setDepartment] = useState("All");
  const [score, setScore] = useState("All");
  const [status, setStatus] = useState("All");
  const enrichedContacts = useMemo(() => {
    const companyMap = new Map(companies.map((company) => [company.id, company]));
    return contacts.slice(0, 300).map((contact) => {
      const company = companyMap.get(contact.companyId);
      return {
        ...contact,
        scoreCategory: scoreCategory(contact.leadScore),
        industry: company?.industry || "Unknown",
        sector: sectorForIndustry(company?.industry),
        country: company?.country || "Unknown",
      };
    });
  }, []);
  const rows = useMemo(() => enrichedContacts.filter((contact) => {
    const term = query.toLowerCase();
    const matches = [contact.companyName, contact.name, contact.designation, contact.email, contact.department, contact.country].some((value) => String(value).toLowerCase().includes(term));
    return (
      matches &&
      matchesFilter(contact.sector, sector) &&
      matchesFilter(contact.industry, industry) &&
      matchesFilter(contact.country, location) &&
      matchesFilter(contact.department, department) &&
      matchesFilter(contact.scoreCategory, score) &&
      matchesFilter(contact.leadStatus, status)
    );
  }), [query, enrichedContacts, sector, industry, location, department, score, status]);
  const columns = [
    { key: "companyName", label: "Company", sortable: true },
    { key: "name", label: "Contact Name", sortable: true },
    { key: "designation", label: "Designation", sortable: true },
    { key: "department", label: "Department", sortable: true },
    { key: "industry", label: "Industry", sortable: true },
    { key: "country", label: "Location", sortable: true },
    { key: "email", label: "Email", render: (row) => <a className="text-primary" href={`mailto:${row.email}`}>{row.email}</a> },
    { key: "linkedin", label: "LinkedIn URL", render: (row) => <a className="text-primary" href={row.linkedin} target="_blank" rel="noreferrer">LinkedIn</a> },
    { key: "scoreCategory", label: "Lead Score", sortable: true, render: (row) => <Badge tone={row.scoreCategory === "High" ? "green" : row.scoreCategory === "Medium" ? "orange" : "muted"}>{row.scoreCategory}</Badge> },
    { key: "leadStatus", label: "Lead Status", sortable: true },
  ];
  return (
    <div>
      <PageHeader eyebrow="Pipeline" title="Leads" description="Segment revenue-ready contacts by sector, industry, location, department, score, and status." action={<Button onClick={() => exportCsv("leads.csv", rows)}><Download size={16} /> Export</Button>} />
      <IntelligenceStrip items={[
        { label: "Matched Leads", value: rows.length, detail: "Filtered contacts", icon: <Target size={19} /> },
        { label: "High Score", value: rows.filter((row) => row.scoreCategory === "High").length, detail: "Ready for outreach", icon: <UserCheck size={19} /> },
        { label: "Departments", value: new Set(rows.map((row) => row.department)).size, detail: "Buying centers covered", icon: <UsersRound size={19} /> },
        { label: "Locations", value: new Set(rows.map((row) => row.country)).size, detail: "Markets represented", icon: <MapPinned size={19} /> },
      ]} />
      <FilterConsole
        title="Lead Segmentation Filters"
        search={query}
        onSearch={setQuery}
        resultCount={rows.length}
        totalCount={enrichedContacts.length}
        onReset={() => {
          setQuery("");
          setSector("All");
          setIndustry("All");
          setLocation("All");
          setDepartment("All");
          setScore("All");
          setStatus("All");
        }}
        filters={[
          { key: "sector", label: "Sector", value: sector, options: uniqueOptions(enrichedContacts, "sector"), onChange: setSector, placeholder: "Try tech..." },
          { key: "industry", label: "Industry", value: industry, options: uniqueOptions(enrichedContacts, "industry"), onChange: setIndustry, placeholder: "Try fintech..." },
          { key: "location", label: "Location", value: location, options: uniqueOptions(enrichedContacts, "country"), onChange: setLocation, placeholder: "Try Canada..." },
          { key: "department", label: "Department", value: department, options: uniqueOptions(enrichedContacts, "department"), onChange: setDepartment, placeholder: "Try finance..." },
          { key: "score", label: "Lead Score", value: score, options: ["All", "High", "Medium", "Low"], onChange: setScore, placeholder: "Try high..." },
          { key: "status", label: "Status", value: status, options: uniqueOptions(enrichedContacts, "leadStatus"), onChange: setStatus, placeholder: "Try qualified..." },
        ]}
      />
      <DataTable columns={columns} rows={rows} pageSize={12} />
    </div>
  );
}
