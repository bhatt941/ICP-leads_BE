const EventEmitter = require('events');
const config = require('../config/env');
const logger = require('../utils/logger');
const jobBus = require('../utils/jobBus');

class MockWorker extends EventEmitter {
  constructor(queueName, processor) {
    super();
    this.queueName = queueName;
    this.processor = processor;
    this.active = true;

    this.handler = async (job) => {
      if (!this.active) return;
      
      logger.info(`[Worker: ${this.queueName}] Processing job ${job.name} (${job.id})`);
      try {
        const result = await this.processor(job);
        logger.info(`[Worker: ${this.queueName}] Completed job ${job.name} (${job.id})`);
        this.emit('completed', job, result);
      } catch (error) {
        logger.error(`[Worker: ${this.queueName}] Failed job ${job.name} (${job.id})`, { error: error.message, stack: error.stack });
        this.emit('failed', job, error);
      }
    };

    jobBus.on(`job:${this.queueName}`, this.handler);
  }

  async close() {
    this.active = false;
    jobBus.off(`job:${this.queueName}`, this.handler);
    logger.info(`[Worker: ${this.queueName}] Closed`);
  }
}

function createWorker(queueName, processor) {
  if (config.database.mode === 'memory') {
    logger.info(`Memory mode active; ${queueName} worker not started`);
    return null;
  }

  const worker = new MockWorker(queueName, processor);
  
  worker.on('completed', (job) => logger.info(`Worker completed: ${queueName}`, { jobId: job.id }));
  worker.on('failed', (job, error) => logger.error(`Worker failed: ${queueName}`, { jobId: job?.id, error: error.message }));
  worker.on('error', (error) => logger.error(`Worker error: ${queueName}`, { error: error.message }));
  
  return worker;
}

module.exports = {
  createWorker
};
