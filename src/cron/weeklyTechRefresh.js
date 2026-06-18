const cron = require('node-cron');
const config = require('../config/env');
const { CompanyRepository } = require('../repositories');
const { queueTechnologyEnrichment } = require('../queues/producers');
const logger = require('../utils/logger');

function start() {
  return cron.schedule(config.cron.weeklyTechRefresh, async () => {
    const cutoff = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
    const companies = await CompanyRepository.findAll({ isDeleted: false });
    const staleCompanies = companies.filter((company) => {
      if (!company.lastTechnologyScannedAt) return true;
      return new Date(company.lastTechnologyScannedAt).getTime() <= cutoff.getTime();
    });
    for (const company of staleCompanies) {
      await queueTechnologyEnrichment(company._id, company.website);
    }
    logger.info('Weekly technology refresh queued', { count: staleCompanies.length });
  });
}

module.exports = { start };
