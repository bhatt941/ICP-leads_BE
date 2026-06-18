import companies from "./companies.json";
import contacts from "./contacts.json";
import jobPosts from "./jobs.json";

export { companies, contacts, jobPosts };

export const aiInsights = [
  { title: "Hiring Surge Detected", detail: "CloudNova posted 18 new revenue and engineering roles in the last 14 days.", impact: "High intent" },
  { title: "Company Growth Signal", detail: "Vertex Analytics expanded headcount by an estimated 23% quarter over quarter.", impact: "Expansion" },
  { title: "Executive Change", detail: "Nexus Intelligence added a new VP Sales with prior enterprise SaaS leadership.", impact: "Fresh buying window" },
  { title: "Funding Activity", detail: "HyperScale Labs shows signals consistent with a recent growth funding round.", impact: "Budget likely" },
  { title: "Expansion Signal", detail: "GrowthSync is opening commercial roles across EMEA and APAC.", impact: "New market" },
];

export const navInsights = {
  totalCompanies: companies.length,
  totalContacts: contacts.length,
  totalLeads: contacts.filter((contact) => contact.leadStatus !== "Nurture").length,
  activeHiringCompanies: companies.filter((company) => ["Actively Hiring", "Hiring"].includes(company.hiringStatus)).length,
  openJobPostings: jobPosts.length,
  newLeadsThisWeek: 64,
  averageHeadcount: Math.round(companies.reduce((sum, company) => sum + company.headcount, 0) / companies.length),
  averageLeadScore: Math.round(contacts.reduce((sum, contact) => sum + contact.leadScore, 0) / contacts.length),
};
