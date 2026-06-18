const { connect, disconnectDatabase } = require('../config/database');
const queues = require('../queues');
const logger = require('../utils/logger');

const workers = [
  require('./discoveryWorker'),
  require('./enrichmentWorker'),
  require('./peopleWorker'),
  require('./jobWorker'),
  require('./techWorker'),
  require('./scoringWorker')
].filter(Boolean);

for (const worker of workers) {
  worker.on('error', (error) => logger.error('Worker runtime error', { error: error.message }));
}

async function start() {
  await connect();
  logger.info(`Workers started`, { count: workers.length });
}

async function shutdown(signal = 'SIGTERM') {
  logger.info(`${signal} received, shutting down workers`);
  await Promise.all(workers.map((worker) => worker.close()));
  await queues.closeQueues();
  await disconnectDatabase();
  process.exit(0);
}

process.on('SIGTERM', () => shutdown('SIGTERM'));
process.on('SIGINT', () => shutdown('SIGINT'));

start().catch((error) => {
  logger.error('Failed to start workers', { error: error.message, stack: error.stack });
  process.exit(1);
});
