function classifyCompanySize(headcount) {
  if (!headcount) return 'unknown';
  if (headcount <= 10) return 'solo';
  if (headcount <= 200) return 'small';
  if (headcount <= 1000) return 'mid-market';
  return 'enterprise';
}

function scoreHiringIntensity(jobs = []) {
  const activeJobs = jobs.filter((job) => job.active !== false).length;
  return Math.min(activeJobs * 12, 100);
}

function scoreTechnologyAdoption(technologyStack = []) {
  const strategicTech = ['AWS', 'Azure', 'GCP', 'Salesforce', 'HubSpot', 'React', 'Node.js', 'Python'];
  const hits = technologyStack.filter((tech) => strategicTech.some((name) => name.toLowerCase() === String(tech).toLowerCase()));
  return Math.min(hits.length * 12, 100);
}

function scoreGrowth({ headcount, jobs = [], technologyStack = [] }) {
  const sizeBoost = headcount ? Math.min(headcount / 50, 30) : 0;
  const hiringBoost = scoreHiringIntensity(jobs) * 0.45;
  const techBoost = scoreTechnologyAdoption(technologyStack) * 0.25;
  return Math.round(Math.min(sizeBoost + hiringBoost + techBoost, 100));
}

function scoreLead(company, jobs = []) {
  const hiringIntensity = scoreHiringIntensity(jobs);
  const technologyAdoption = scoreTechnologyAdoption(company.technologyStack || []);
  const growth = scoreGrowth({
    headcount: company.headcount,
    jobs,
    technologyStack: company.technologyStack || []
  });
  const profileCompleteness = [
    company.website,
    company.email,
    company.phone,
    company.linkedin,
    company.industry,
    company.city,
    company.country
  ].filter(Boolean).length * 5;

  return {
    hiringIntensity,
    technologyAdoption,
    growth,
    lead: Math.round(Math.min(hiringIntensity * 0.3 + technologyAdoption * 0.25 + growth * 0.3 + profileCompleteness, 100))
  };
}

module.exports = {
  classifyCompanySize,
  scoreHiringIntensity,
  scoreTechnologyAdoption,
  scoreGrowth,
  scoreLead
};
