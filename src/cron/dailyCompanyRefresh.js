const cron = require('node-cron');
const config = require('../config/env');
const { CompanyRepository } = require('../repositories');
const { queueCompanyEnrichment } = require('../queues/producers');
const logger = require('../utils/logger');

function start() {
  return cron.schedule(config.cron.dailyCompanyRefresh, async () => {
    const cutoff = new Date(Date.now() - 24 * 60 * 60 * 1000);
    const companies = await CompanyRepository.findAll({
      isDeleted: false,
      updatedAt: { $lte: cutoff }
    });
    for (const company of companies) {
      await queueCompanyEnrichment(company._id, company.website);
    }
    logger.info('Daily company refresh queued', { count: companies.length });
  });
}

module.exports = { start };
