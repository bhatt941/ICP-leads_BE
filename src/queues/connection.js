const config = require('../config/env');
const redisClient = require('../config/redis');

module.exports = config.database.mode === 'memory' ? null : redisClient;
