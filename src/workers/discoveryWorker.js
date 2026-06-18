const { createWorker } = require('./workerUtils');
const { queueCompanyEnrichment } = require('../queues/producers');
const CompanyDiscoveryService = require('../services/CompanyDiscoveryService');
const logger = require('../utils/logger');

const worker = createWorker('company-discovery', async (job) => {
  logger.info('Processing company discovery job', job.data);
  const result = await CompanyDiscoveryService.discoverAndSave(job.data);
  for (const company of result.companies) {
    await queueCompanyEnrichment(company._id || company.id, company.website);
  }
  return { discovered: result.discoveredCount, saved: result.savedCount };
});

module.exports = worker;
