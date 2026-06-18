const cron = require('node-cron');
const config = require('../config/env');
const { CompanyRepository, ContactRepository } = require('../repositories');
const { queuePeopleDiscovery } = require('../queues/producers');
const logger = require('../utils/logger');

function start() {
  return cron.schedule(config.cron.weeklyContactRefresh, async () => {
    const companies = await CompanyRepository.findAll({ isDeleted: false });
    let count = 0;
    for (const company of companies) {
      const contacts = await ContactRepository.findByCompany(company._id);
      if (!contacts.length) {
        await queuePeopleDiscovery(company._id, company.companyName, company.website);
        count += 1;
      }
    }
    logger.info('Weekly contact refresh queued', { count });
  });
}

module.exports = { start };
