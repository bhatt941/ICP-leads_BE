const { connect, disconnectDatabase } = require('../config/database');
const queues = require('../queues');
const logger = require('../utils/logger');

const cronJobs = [
  require('./dailyCompanyRefresh'),
  require('./dailyHiringRefresh'),
  require('./weeklyContactRefresh'),
  require('./weeklyTechRefresh')
];

let tasks = [];

async function start() {
  await connect();
  tasks = cronJobs.map((job) => job.start());
  logger.info('Cron jobs started', { count: tasks.length });
}

async function shutdown(signal = 'SIGTERM') {
  logger.info(`${signal} received, stopping cron jobs`);
  tasks.forEach((task) => task.stop());
  await queues.closeQueues();
  await disconnectDatabase();
  process.exit(0);
}

process.on('SIGTERM', () => shutdown('SIGTERM'));
process.on('SIGINT', () => shutdown('SIGINT'));

start().catch((error) => {
  logger.error('Failed to start cron jobs', { error: error.message, stack: error.stack });
  process.exit(1);
});
