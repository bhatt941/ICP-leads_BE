const queues = require('./index');
const logger = require('../utils/logger');

async function queueCompanyDiscovery(searchParams) {
  logger.info('Queueing company discovery', searchParams);
  return queues.companyDiscoveryQueue.add('company-discovery', searchParams);
}

async function queueCompanyEnrichment(companyId, website) {
  const data = { companyId, website };
  logger.info('Queueing company enrichment', data);
  return queues.companyEnrichmentQueue.add('company-enrichment', data);
}

async function queuePeopleDiscovery(companyId, companyName, website) {
  const data = { companyId, companyName, website };
  logger.info('Queueing people discovery', data);
  return queues.peopleDiscoveryQueue.add('people-discovery', data);
}

async function queueJobDiscovery(companyId, website, careersUrl, options = {}) {
  const data = {
    companyId,
    website,
    careersUrl,
    companyName: options.companyName,
    organizationId: options.organizationId,
    requestedByUserId: options.requestedByUserId
  };
  logger.info('Queueing job discovery', data);
  return queues.jobDiscoveryQueue.add('job-discovery', data, {
    jobId: options.jobId || (companyId ? `job-discovery:${companyId}` : undefined)
  });
}

async function queueTechnologyEnrichment(companyId, website) {
  const data = { companyId, website };
  logger.info('Queueing technology enrichment', data);
  return queues.technologyEnrichmentQueue.add('technology-enrichment', data);
}

async function queueLeadScoring(companyId) {
  const data = { companyId };
  logger.info('Queueing lead scoring', data);
  return queues.leadScoringQueue.add('lead-scoring', data);
}

module.exports = {
  queueCompanyDiscovery,
  queueCompanyEnrichment,
  queueJobDiscovery,
  queueLeadScoring,
  queuePeopleDiscovery,
  queueTechnologyEnrichment
};
