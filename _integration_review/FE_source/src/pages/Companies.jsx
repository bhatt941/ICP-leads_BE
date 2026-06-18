import { useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { Building2, Download, ExternalLink, MapPinned, Network, UsersRound } from "lucide-react";
import { DataTable } from "@/components/DataTable";
import { FilterConsole } from "@/components/FilterConsole";
import { IntelligenceStrip } from "@/components/IntelligenceStrip";
import { PageHeader } from "@/components/PageHeader";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { companies, jobPosts } from "@/data/mockData";
import { exportCsv } from "@/utils/exportCsv";
import { headcountBand, matchesAnyFilter, matchesFilter, sectorForIndustry, uniqueOptions } from "@/utils/taxonomy";

export default function Companies() {
  const [search, setSearch] = useState("");
  const [sector, setSector] = useState("All");
  const [industry, setIndustry] = useState("All");
  const [country, setCountry] = useState("All");
  const [department, setDepartment] = useState("All");
  const [hiring, setHiring] = useState("All");
  const [segment, setSegment] = useState("All");
  const enrichedCompanies = useMemo(
    () =>
      companies.map((company) => ({
        ...company,
        sector: sectorForIndustry(company.industry),
        segment: headcountBand(company.headcount),
        departments: [...new Set(jobPosts.filter((job) => job.companyId === company.id).map((job) => job.department))],
      })),
    []
  );
  const industries = uniqueOptions(enrichedCompanies, "industry");
  const sectors = uniqueOptions(enrichedCompanies, "sector");
  const countries = uniqueOptions(enrichedCompanies, "country");
  const departments = ["All", ...new Set(jobPosts.map((job) => job.department))];

  const rows = useMemo(() => {
    const term = search.toLowerCase();
    return enrichedCompanies.filter((company) => {
      const matchesSearch = [company.name, company.website, company.email, company.industry, company.country, company.sector].some((value) =>
        String(value).toLowerCase().includes(term)
      );
      return (
        matchesSearch &&
        matchesFilter(company.sector, sector) &&
        matchesFilter(company.industry, industry) &&
        matchesFilter(company.country, country) &&
        matchesAnyFilter(company.departments, department) &&
        matchesFilter(company.hiringStatus, hiring) &&
        matchesFilter(company.segment, segment)
      );
    });
  }, [search, enrichedCompanies, sector, industry, country, department, hiring, segment]);

  const topIndustry = rows.reduce((acc, item) => {
    acc[item.industry] = (acc[item.industry] || 0) + 1;
    return acc;
  }, {});
  const topIndustryName = Object.entries(topIndustry).sort((a, b) => b[1] - a[1])[0]?.[0] || "None";
  const activeJobs = rows.reduce((sum, company) => sum + company.openJobsCount, 0);

  const columns = [
    { key: "name", label: "Company Name", sortable: true, render: (row) => <Link className="font-semibold text-primary" to={`/companies/${row.id}`}>{row.name}</Link> },
    { key: "sector", label: "Sector", sortable: true, render: (row) => <Badge tone="teal">{row.sector}</Badge> },
    { key: "website", label: "Website", render: (row) => <a className="inline-flex items-center gap-1 text-primary" href={row.website} target="_blank" rel="noreferrer">Website <ExternalLink size={13} /></a> },
    { key: "email", label: "Email", render: (row) => <a className="text-primary" href={`mailto:${row.email}`}>{row.email}</a> },
    { key: "linkedin", label: "LinkedIn URL", render: (row) => <a className="text-primary" href={row.linkedin} target="_blank" rel="noreferrer">LinkedIn</a> },
    { key: "headcount", label: "Headcount", sortable: true, render: (row) => row.headcount.toLocaleString() },
    { key: "industry", label: "Industry", sortable: true },
    { key: "country", label: "Location", sortable: true },
    { key: "segment", label: "Segment", sortable: true },
    { key: "departments", label: "Hiring Departments", render: (row) => row.departments.slice(0, 2).join(", ") || "No signal" },
    { key: "hiringStatus", label: "Hiring Status", sortable: true, render: (row) => <Badge tone={row.hiringStatus.includes("Hiring") ? "green" : "muted"}>{row.hiringStatus}</Badge> },
    { key: "lastUpdated", label: "Last Updated", sortable: true },
    { key: "action", label: "", render: (row) => <Button variant="secondary" size="sm"><Link to={`/companies/${row.id}`}>View Profile</Link></Button> },
  ];

  return (
    <div>
      <PageHeader
        eyebrow="Company search"
        title="Companies"
        description="Explore target accounts with sector, industry, location, department, hiring, and segment filters."
        action={<Button onClick={() => exportCsv("companies.csv", rows)}><Download size={16} /> Export</Button>}
      />
      <IntelligenceStrip
        items={[
          { label: "Matched Accounts", value: rows.length, detail: "Live result set", icon: <Building2 size={19} /> },
          { label: "Open Jobs", value: activeJobs, detail: "Hiring intent across matches", icon: <UsersRound size={19} /> },
          { label: "Top Industry", value: topIndustryName, detail: "Most represented segment", icon: <Network size={19} /> },
          { label: "Locations", value: new Set(rows.map((row) => row.country)).size, detail: "Countries in current view", icon: <MapPinned size={19} /> },
        ]}
      />
      <FilterConsole
        title="Account Intelligence Filters"
        search={search}
        onSearch={setSearch}
        resultCount={rows.length}
        totalCount={enrichedCompanies.length}
        onReset={() => {
          setSearch("");
          setSector("All");
          setIndustry("All");
          setCountry("All");
          setDepartment("All");
          setHiring("All");
          setSegment("All");
        }}
        filters={[
          { key: "sector", label: "Sector", value: sector, options: sectors, onChange: setSector, placeholder: "Try tech, consumer..." },
          { key: "industry", label: "Industry", value: industry, options: industries, onChange: setIndustry, placeholder: "Try SaaS, cyber..." },
          { key: "country", label: "Location", value: country, options: countries, onChange: setCountry, placeholder: "Try India, United..." },
          { key: "department", label: "Department", value: department, options: departments, onChange: setDepartment, placeholder: "Try sales, engineering..." },
          { key: "hiring", label: "Hiring", value: hiring, options: ["All", "Actively Hiring", "Hiring", "Stable", "Paused"], onChange: setHiring, placeholder: "Try active..." },
          { key: "segment", label: "Company Size", value: segment, options: ["All", "SMB", "Mid-Market", "Enterprise", "Strategic"], onChange: setSegment, placeholder: "Try enterprise..." },
        ]}
      />
      <DataTable columns={columns} rows={rows} pageSize={10} initialSort={{ key: "headcount", direction: "desc" }} />
    </div>
  );
}
