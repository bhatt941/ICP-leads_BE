import { useMemo, useState } from "react";
import { BriefcaseBusiness, MapPinned, Network, UserRoundSearch } from "lucide-react";
import { DataTable } from "@/components/DataTable";
import { FilterConsole } from "@/components/FilterConsole";
import { IntelligenceStrip } from "@/components/IntelligenceStrip";
import { PageHeader } from "@/components/PageHeader";
import { companies, contacts } from "@/data/mockData";
import { matchesFilter, sectorForIndustry, uniqueOptions } from "@/utils/taxonomy";

export default function Contacts() {
  const [query, setQuery] = useState("");
  const [sector, setSector] = useState("All");
  const [industry, setIndustry] = useState("All");
  const [location, setLocation] = useState("All");
  const [department, setDepartment] = useState("All");
  const [seniority, setSeniority] = useState("All");
  const enrichedContacts = useMemo(() => {
    const companyMap = new Map(companies.map((company) => [company.id, company]));
    return contacts.map((contact) => {
      const company = companyMap.get(contact.companyId);
      return {
        ...contact,
        industry: company?.industry || "Unknown",
        sector: sectorForIndustry(company?.industry),
        country: company?.country || "Unknown",
      };
    });
  }, []);
  const rows = useMemo(() => {
    const term = query.toLowerCase();
    return enrichedContacts.filter((contact) => {
      const match = [contact.name, contact.companyName, contact.designation, contact.department, contact.country, contact.industry].some((value) => String(value).toLowerCase().includes(term));
      return (
        match &&
        matchesFilter(contact.sector, sector) &&
        matchesFilter(contact.industry, industry) &&
        matchesFilter(contact.country, location) &&
        matchesFilter(contact.department, department) &&
        matchesFilter(contact.seniority, seniority)
      );
    });
  }, [query, enrichedContacts, sector, industry, location, department, seniority]);
  const columns = [
    { key: "name", label: "Name", sortable: true },
    { key: "companyName", label: "Company", sortable: true },
    { key: "designation", label: "Designation", sortable: true },
    { key: "department", label: "Department", sortable: true },
    { key: "industry", label: "Industry", sortable: true },
    { key: "country", label: "Location", sortable: true },
    { key: "seniority", label: "Seniority", sortable: true },
    { key: "linkedin", label: "LinkedIn URL", render: (row) => <a className="text-primary" href={row.linkedin} target="_blank" rel="noreferrer">Open LinkedIn</a> },
  ];
  return (
    <div>
      <PageHeader eyebrow="Decision makers" title="Contacts" description="Explore the buying committee by sector, industry, market, department, and seniority." />
      <IntelligenceStrip items={[
        { label: "Matched Contacts", value: rows.length, detail: "People in current view", icon: <UserRoundSearch size={19} /> },
        { label: "Departments", value: new Set(rows.map((row) => row.department)).size, detail: "Functional coverage", icon: <BriefcaseBusiness size={19} /> },
        { label: "Industries", value: new Set(rows.map((row) => row.industry)).size, detail: "Vertical spread", icon: <Network size={19} /> },
        { label: "Locations", value: new Set(rows.map((row) => row.country)).size, detail: "Regional coverage", icon: <MapPinned size={19} /> },
      ]} />
      <FilterConsole
        title="Decision Maker Filters"
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
          setSeniority("All");
        }}
        filters={[
          { key: "sector", label: "Sector", value: sector, options: uniqueOptions(enrichedContacts, "sector"), onChange: setSector, placeholder: "Try healthcare..." },
          { key: "industry", label: "Industry", value: industry, options: uniqueOptions(enrichedContacts, "industry"), onChange: setIndustry, placeholder: "Try cloud..." },
          { key: "location", label: "Location", value: location, options: uniqueOptions(enrichedContacts, "country"), onChange: setLocation, placeholder: "Try Germany..." },
          { key: "department", label: "Department", value: department, options: uniqueOptions(enrichedContacts, "department"), onChange: setDepartment, placeholder: "Try operations..." },
          { key: "seniority", label: "Seniority", value: seniority, options: uniqueOptions(enrichedContacts, "seniority"), onChange: setSeniority, placeholder: "Try director..." },
        ]}
      />
      <DataTable columns={columns} rows={rows} pageSize={12} />
    </div>
  );
}
