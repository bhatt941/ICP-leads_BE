const logger = require('../utils/logger');

function createMockClient() {
  const store = new Map();
  logger.info('Redis (In-Memory Mock) active');

  return {
    async get(key) {
      return store.get(key) || null;
    },
    async set(key, value) {
      store.set(key, value);
      return 'OK';
    },
    async setex(key, ttl, value) {
      store.set(key, value);
      return 'OK';
    },
    async del(key) {
      return store.delete(key) ? 1 : 0;
    },
    async ping() {
      return 'PONG';
    },
    async quit() {
      store.clear();
      return 'OK';
    },
    async disconnect() {
      store.clear();
    },
    on() {
      return this;
    }
  };
}

const client = createMockClient();

module.exports = client;
module.exports.createRedisConnection = () => client;
module.exports.getRedisClient = () => client;
