const cron = require('node-cron');
const config = require('../config/env');
const { CompanyRepository } = require('../repositories');
const { queueJobDiscovery } = require('../queues/producers');
const logger = require('../utils/logger');

function start() {
  return cron.schedule(config.cron.dailyHiringRefresh, async () => {
    const companies = await CompanyRepository.findAll({ isDeleted: false, hiringStatus: 'active' });
    for (const company of companies) {
      await queueJobDiscovery(company._id, company.website, company.careersUrl, {
        companyName: company.companyName,
        organizationId: company.organizationId
      });
    }
    logger.info('Daily hiring refresh queued', { count: companies.length });
  });
}

module.exports = { start };
