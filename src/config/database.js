const mongoose = require('mongoose');
const config = require('./env');
const runtime = require('./runtime');
const logger = require('../utils/logger');

const memoryStore = {};
const RETRY_ATTEMPTS = 3;
const RETRY_DELAY_MS = 3000;

function delay(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

async function connect() {
  mongoose.set('strictQuery', true);

  if (config.database.mode === 'memory') {
    runtime.useMemoryDatabase();
    logger.info('Memory mode active');
    return;
  }

  let lastError;
  for (let attempt = 1; attempt <= RETRY_ATTEMPTS; attempt += 1) {
    try {
      await mongoose.connect(config.database.mongoUri, {
        autoIndex: config.server.nodeEnv !== 'production',
        maxPoolSize: 10,
        serverSelectionTimeoutMS: 10000
      });
      logger.info('MongoDB connected');
      return;
    } catch (error) {
      lastError = error;
      logger.error(`MongoDB connection attempt ${attempt} failed`, { error: error.message });
      if (attempt < RETRY_ATTEMPTS) await delay(RETRY_DELAY_MS);
    }
  }

  throw lastError;
}

async function disconnectDatabase() {
  if (mongoose.connection.readyState !== 0) {
    await mongoose.disconnect();
  }
}

function isConnected() {
  if (runtime.isMemoryDatabase()) return true;
  return mongoose.connection.readyState === 1;
}

module.exports = {
  connect,
  connectDatabase: connect,
  disconnectDatabase,
  isConnected,
  memoryStore
};
