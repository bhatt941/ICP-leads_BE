const { createWorker } = require('./workerUtils');
const CompanyService = require('../services/CompanyService');
const { detectTechnologies } = require('../scrapers/technology/techDetector');
const { queueLeadScoring } = require('../queues/producers');
const logger = require('../utils/logger');

const worker = createWorker('technology-enrichment', async (job) => {
  logger.info('Processing technology enrichment job', job.data);
  const { companyId, website } = job.data;
  const company = await CompanyService.getCompanyById(companyId);
  const detected = await detectTechnologies(website || company?.website);
  const technologyStack = [...new Set([...(company?.technologyStack || []), ...detected.technologies])];
  const updated = await CompanyService.updateCompany(companyId, {
    technologyStack,
    lastTechnologyScannedAt: new Date()
  });
  await queueLeadScoring(companyId);
  return updated;
});

module.exports = worker;
