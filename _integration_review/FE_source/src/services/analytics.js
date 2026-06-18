import { companies, contacts, jobPosts } from "@/data/mockData";

const countBy = (items, key) =>
  Object.values(
    items.reduce((acc, item) => {
      const label = item[key];
      acc[label] = acc[label] || { name: label, value: 0 };
      acc[label].value += 1;
      return acc;
    }, {})
  );

export const companiesByIndustry = countBy(companies, "industry").slice(0, 8);
export const companiesByCountry = countBy(companies, "country");

export const hiringTrends = Array.from({ length: 8 }, (_, index) => ({
  week: `W${index + 1}`,
  jobs: jobPosts.filter((job) => Number(job.id.split("-")[1]) % 8 === index).length + 12,
}));

export const leadsGenerated = Array.from({ length: 10 }, (_, index) => ({
  month: ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct"][index],
  leads: contacts.filter((contact) => Number(contact.id.split("-")[1]) % 10 === index).length + 20,
}));

export const companyGrowth = Array.from({ length: 8 }, (_, index) => ({
  quarter: `Q${(index % 4) + 1}`,
  headcount: Math.round(companies.slice(0, 14 + index * 6).reduce((sum, company) => sum + company.headcount, 0) / 100),
}));

export const headcountDistribution = [
  { name: "1-50", value: companies.filter((company) => company.headcount <= 50).length },
  { name: "51-250", value: companies.filter((company) => company.headcount > 50 && company.headcount <= 250).length },
  { name: "251-1K", value: companies.filter((company) => company.headcount > 250 && company.headcount <= 1000).length },
  { name: "1K-5K", value: companies.filter((company) => company.headcount > 1000 && company.headcount <= 5000).length },
  { name: "5K+", value: companies.filter((company) => company.headcount > 5000).length },
];

export const leadScoreDistribution = [
  { name: "50-59", value: companies.filter((company) => company.leadScore < 60).length },
  { name: "60-69", value: companies.filter((company) => company.leadScore >= 60 && company.leadScore < 70).length },
  { name: "70-79", value: companies.filter((company) => company.leadScore >= 70 && company.leadScore < 80).length },
  { name: "80-89", value: companies.filter((company) => company.leadScore >= 80 && company.leadScore < 90).length },
  { name: "90+", value: companies.filter((company) => company.leadScore >= 90).length },
];
