export const sectorByIndustry = {
  "AI Software": "Technology",
  SaaS: "Technology",
  FinTech: "Financial Services",
  Cybersecurity: "Technology",
  "Data Infrastructure": "Technology",
  HealthTech: "Healthcare",
  MarTech: "Commercial",
  "Cloud Services": "Technology",
  "E-commerce": "Consumer",
  Logistics: "Operations",
};

export function sectorForIndustry(industry) {
  return sectorByIndustry[industry] || "Other";
}

export function headcountBand(headcount) {
  if (headcount <= 250) return "SMB";
  if (headcount <= 1000) return "Mid-Market";
  if (headcount <= 5000) return "Enterprise";
  return "Strategic";
}

export function uniqueOptions(rows, key, transform = (value) => value) {
  return ["All", ...new Set(rows.map((row) => transform(row[key])).filter(Boolean))];
}

export function matchesFilter(actual, expected) {
  if (!expected || expected === "All") return true;
  return String(actual || "").toLowerCase().includes(String(expected).toLowerCase());
}

export function matchesAnyFilter(values, expected) {
  if (!expected || expected === "All") return true;
  return values.some((value) => matchesFilter(value, expected));
}
