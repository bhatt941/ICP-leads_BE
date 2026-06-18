const { createWorker } = require('./workerUtils');
const CompanyService = require('../services/CompanyService');
const { crawlWebsite } = require('../scrapers/crawlers/websiteCrawler');
const { parseCareersPage } = require('../scrapers/crawlers/careersPageParser');
const {
  queueJobDiscovery,
  queuePeopleDiscovery,
  queueTechnologyEnrichment
} = require('../queues/producers');
const logger = require('../utils/logger');

const { resolveDuplicateCompany } = require('../services/verificationService');

const worker = createWorker('company-enrichment', async (job) => {
  logger.info('Processing company enrichment job', job.data);
  const { companyId, website } = job.data;
  const crawled = await crawlWebsite(website);
  const careers = crawled.careersUrl ? await parseCareersPage(crawled.careersUrl) : { jobs: [] };
  const enriched = {
    website,
    email: crawled.email,
    phone: crawled.phone,
    socialLinks: crawled.socialLinks,
    description: crawled.description,
    address: crawled.address,
    linkedinCompanyUrl: crawled.linkedinUrl,
    careersUrl: crawled.careersUrl,
    isEnriched: true,
    sourceUrl: website,
    discoverySource: 'queue-enrichment'
  };

  let targetId = companyId;
  if (!targetId) {
    const existing = await resolveDuplicateCompany({
      companyName: crawled.companyName || website,
      website,
      linkedinCompanyUrl: crawled.linkedinUrl
    });
    if (existing) {
      targetId = existing._id;
    }
  }

  const company = targetId
    ? await CompanyService.updateCompany(targetId, enriched)
    : await CompanyService.createCompany({ companyName: crawled.companyName || website || 'Unknown Company', ...enriched });

  if (company) {
    await queuePeopleDiscovery(company._id, company.companyName, company.website);
    await queueJobDiscovery(company._id, company.website, company.careersUrl, {
      companyName: company.companyName,
      organizationId: company.organizationId
    });
    await queueTechnologyEnrichment(company._id, company.website);
  }

  return { company, careersPreview: careers.totalJobsFound };
});

module.exports = worker;
