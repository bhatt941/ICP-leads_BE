const { createWorker } = require('./workerUtils');
const JobScrapingService = require('../services/JobScrapingService');
const { queueLeadScoring } = require('../queues/producers');
const logger = require('../utils/logger');

const worker = createWorker('job-discovery', async (job) => {
  logger.info('Processing job discovery job', job.data);
  const result = await JobScrapingService.scrapeAndSave(job.data);
  await queueLeadScoring(job.data.companyId);
  return { jobs: result.savedCount, platform: result.platform };
});

module.exports = worker;
