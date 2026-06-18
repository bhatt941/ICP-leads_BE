const config = require('../config/env');
const logger = require('../utils/logger');
const jobBus = require('../utils/jobBus');

class MockQueue {
  constructor(name) {
    this.name = name;
  }

  async add(jobName, data, options = {}) {
    const jobId = options.jobId || `mock-${this.name}-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
    const job = {
      id: jobId,
      name: jobName,
      data,
      opts: options,
    };
    
    logger.info(`[Queue: ${this.name}] Job added: ${jobName} (${jobId})`);
    
    // Asynchronously dispatch the job using setImmediate
    setImmediate(() => {
      jobBus.emit(`job:${this.name}`, job);
    });

    return job;
  }

  async close() {
    logger.info(`[Queue: ${this.name}] Closed`);
  }
}

const defaultJobOptions = {
  attempts: 3,
  backoff: { type: 'exponential', delay: 2000 },
  removeOnComplete: { age: 24 * 60 * 60, count: 1000 },
  removeOnFail: { age: 7 * 24 * 60 * 60, count: 5000 }
};

function createQueue(name) {
  return new MockQueue(name);
}

const companyDiscoveryQueue = createQueue('company-discovery');
const companyEnrichmentQueue = createQueue('company-enrichment');
const peopleDiscoveryQueue = createQueue('people-discovery');
const jobDiscoveryQueue = createQueue('job-discovery');
const technologyEnrichmentQueue = createQueue('technology-enrichment');
const leadScoringQueue = createQueue('lead-scoring');

async function closeQueues() {
  await Promise.all([
    companyDiscoveryQueue.close(),
    companyEnrichmentQueue.close(),
    peopleDiscoveryQueue.close(),
    jobDiscoveryQueue.close(),
    technologyEnrichmentQueue.close(),
    leadScoringQueue.close()
  ]);
}

async function addCompanyDiscovery(searchParams) {
  return companyDiscoveryQueue.add('company-discovery', searchParams);
}

async function addCompanyEnrichment(companyId, website) {
  return companyEnrichmentQueue.add('company-enrichment', { companyId, website });
}

async function addPeopleDiscovery(companyId, companyName, website) {
  return peopleDiscoveryQueue.add('people-discovery', { companyId, companyName, website });
}

async function addJobDiscovery(companyId, website, careersUrl) {
  return jobDiscoveryQueue.add('job-discovery', { companyId, website, careersUrl });
}

async function addTechnologyEnrichment(companyId, website) {
  return technologyEnrichmentQueue.add('technology-enrichment', { companyId, website });
}

async function addLeadScoring(companyId) {
  return leadScoringQueue.add('lead-scoring', { companyId });
}

module.exports = {
  addCompanyDiscovery,
  addCompanyEnrichment,
  addJobDiscovery,
  addLeadScoring,
  addPeopleDiscovery,
  addTechnologyEnrichment,
  closeQueues,
  companyDiscoveryQueue,
  companyEnrichmentQueue,
  defaultJobOptions,
  jobDiscoveryQueue,
  leadScoringQueue,
  peopleDiscoveryQueue,
  technologyEnrichmentQueue
};
