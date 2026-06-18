const config = require('./config/env');
const app = require('./app');
const { connect, disconnectDatabase } = require('./config/database');
const logger = require('./utils/logger');

// Load background workers in-process to listen on the shared event bus
require('./workers/discoveryWorker');
require('./workers/enrichmentWorker');
require('./workers/peopleWorker');
require('./workers/jobWorker');
require('./workers/techWorker');
require('./workers/scoringWorker');


let server;

async function start() {
  await connect();
  server = app.server.listen(config.server.port, () => {
    logger.info(`API listening on port ${config.server.port}`);
  });
}

async function shutdown(signal) {
  logger.info(`${signal} received, shutting down`);
  if (server) {
    server.close(async () => {
      await disconnectDatabase();
      process.exit(0);
    });
  } else {
    await disconnectDatabase();
    process.exit(0);
  }
}

process.on('SIGINT', () => shutdown('SIGINT'));
process.on('SIGTERM', () => shutdown('SIGTERM'));

start().catch((error) => {
  logger.error('Failed to start API', { error: error.message, stack: error.stack });
  process.exit(1);
});

process.on('uncaughtException', (error) => {
  logger.error('Uncaught exception', { error: error.message, stack: error.stack });
  process.exit(1);
});

process.on('unhandledRejection', (reason) => {
  logger.error('Unhandled rejection', reason instanceof Error ? { error: reason.message, stack: reason.stack } : reason);
  shutdown('unhandledRejection');
});
