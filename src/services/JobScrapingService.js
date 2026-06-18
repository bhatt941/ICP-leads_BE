const JobService = require('./JobService');
const CompanyService = require('./CompanyService');
const { parseCareersPage } = require('../scrapers/crawlers/careersPageParser');
const { parseJobPage } = require('../scrapers/jobs/genericJobParser');
const logger = require('../utils/logger');

class JobScrapingService {
  async scrapeAndSave({ companyId, companyName, website, careersUrl, organizationId } = {}) {
    if (!companyId) throw new Error('companyId is required for job scraping');

    const company = await getCompany(companyId);
    const resolvedCompanyName = companyName || company?.companyName || company?.name || '';
    const resolvedCareersUrl = careersUrl || company?.careersUrl || inferCareersUrl(website || company?.website);

    if (!resolvedCareersUrl) {
      return { platform: 'unknown', totalJobsFound: 0, savedCount: 0, jobs: [] };
    }

    const careers = await parseCareersPage(resolvedCareersUrl);
    const jobs = [];

    for (const listing of careers.jobs || []) {
      const parsed = listing.jobUrl
        ? await parseJobPage(listing.jobUrl, companyId, resolvedCompanyName)
        : {};

      const normalized = normalizeJob({
        ...listing,
        ...parsed,
        companyId,
        companyName: resolvedCompanyName,
        organizationId,
        sourcePlatform: parsed.sourcePlatform || careers.platform || listing.sourcePlatform
      });

      if (normalized.title) jobs.push(normalized);
    }

    const savedJobs = await JobService.bulkUpsertScrapedJobs(dedupeJobs(jobs));
    await updateCompanyHiringSignals(companyId, careers, savedJobs);

    return {
      platform: careers.platform,
      totalJobsFound: careers.totalJobsFound || jobs.length,
      savedCount: savedJobs.length,
      jobs: savedJobs
    };
  }
}

async function getCompany(companyId) {
  try {
    return await CompanyService.getCompanyById(companyId);
  } catch (error) {
    logger.warn('Unable to load company before job scraping', { companyId, error: error.message });
    return null;
  }
}

function normalizeJob(job) {
  return {
    title: clean(job.title),
    companyId: job.companyId,
    companyName: clean(job.companyName),
    organizationId: job.organizationId,
    description: clean(job.description),
    location: clean(job.location),
    city: clean(job.city),
    country: clean(job.country),
    workplaceType: normalizeWorkplaceType(job.workplaceType || job.workMode),
    employmentType: normalizeEmploymentType(job.employmentType),
    jobUrl: job.jobUrl,
    sourcePlatform: job.sourcePlatform || 'generic',
    postedDate: parseDate(job.postedDate),
    requiredSkills: Array.isArray(job.requiredSkills) ? job.requiredSkills : Array.isArray(job.skills) ? job.skills : [],
    industry: job.industry,
    department: clean(job.department),
    isActive: job.isActive !== false,
    isDeleted: false
  };
}

function clean(value) {
  return String(value || '').replace(/\s+/g, ' ').trim();
}

function normalizeWorkplaceType(value) {
  const normalized = String(value || '').toLowerCase().replace(/[-\s]/g, '');
  if (normalized === 'remote') return 'remote';
  if (normalized === 'hybrid') return 'hybrid';
  if (normalized === 'onsite') return 'onsite';
  return 'unknown';
}

function normalizeEmploymentType(value) {
  const normalized = String(value || '').toLowerCase().replace(/[-\s]/g, '_');
  if (['full_time', 'part_time', 'contract', 'internship'].includes(normalized)) return normalized;
  return 'unknown';
}

function parseDate(value) {
  if (!value) return undefined;
  const date = value instanceof Date ? value : new Date(value);
  return Number.isNaN(date.getTime()) ? undefined : date;
}

function inferCareersUrl(website) {
  if (!website) return undefined;
  try {
    return new URL('/careers', website).toString();
  } catch (_error) {
    return undefined;
  }
}

async function updateCompanyHiringSignals(companyId, careers, jobs) {
  try {
    const updates = {
      hiringStatus: jobs.length ? 'active' : 'inactive',
      hiringIntensity: Math.min(jobs.length * 10, 100)
    };
    if (careers?.finalUrl) updates.careersUrl = careers.finalUrl;
    await CompanyService.updateCompany(companyId, updates);
  } catch (error) {
    logger.warn('Unable to update company hiring signals', { companyId, error: error.message });
  }
}

function dedupeJobs(jobs) {
  const seen = new Set();
  return jobs.filter((job) => {
    const key = job.jobUrl || `${job.companyId}:${job.title}:${job.location}`;
    if (!key || seen.has(key)) return false;
    seen.add(key);
    return true;
  });
}

module.exports = new JobScrapingService();
