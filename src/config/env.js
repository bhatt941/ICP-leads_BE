const dotenv = require('dotenv');

dotenv.config();

const toBool = (value, fallback = false) => {
  if (value === undefined || value === null || value === '') return fallback;
  return String(value).toLowerCase() === 'true';
};

const toInt = (value, fallback) => {
  const parsed = Number.parseInt(value, 10);
  return Number.isNaN(parsed) ? fallback : parsed;
};

const required = ['ACCESS_TOKEN_SECRET', 'MONGODB_URI'];
const missing = required.filter((key) => !process.env[key]);

if (missing.length) {
  throw new Error(`Missing required environment variables: ${missing.join(', ')}`);
}

const config = {
  server: {
    nodeEnv: process.env.NODE_ENV || 'development',
    port: toInt(process.env.PORT, 5000),
    apiPrefix: process.env.API_PREFIX || '/api/v1',
    frontendUrl: process.env.FRONTEND_URL || 'http://localhost:5173'
  },
  database: {
    mode: process.env.DATABASE_MODE || 'auto',
    mongoUri: process.env.MONGODB_URI
  },
  redis: {
    host: process.env.REDIS_HOST || 'localhost',
    port: toInt(process.env.REDIS_PORT, 6379),
    password: process.env.REDIS_PASSWORD || undefined,
    maxRetriesPerRequest: null
  },
  jwt: {
    accessTokenSecret: process.env.ACCESS_TOKEN_SECRET,
    accessTokenExpires: process.env.ACCESS_TOKEN_EXPIRES || '15m',
    refreshTokenSecret: process.env.REFRESH_TOKEN_SECRET || process.env.ACCESS_TOKEN_SECRET,
    refreshTokenExpires: process.env.REFRESH_TOKEN_EXPIRES || '30d',
    legacySecret: process.env.JWT_SECRET,
    legacyExpiresIn: process.env.JWT_EXPIRES_IN || '7d'
  },
  bcryptSaltRounds: toInt(process.env.BCRYPT_SALT_ROUNDS, 12),
  google: {
    clientId: process.env.GOOGLE_CLIENT_ID || '',
    clientSecret: process.env.GOOGLE_CLIENT_SECRET || ''
  },
  scraper: {
    timeoutMs: toInt(process.env.SCRAPER_TIMEOUT_MS, 25000),
    userAgent: process.env.SCRAPER_USER_AGENT || 'LeadIntelligenceBot/1.0',
    headless: toBool(process.env.SCRAPER_HEADLESS, true),
    concurrency: toInt(process.env.SCRAPER_CONCURRENCY, 3)
  },
  cron: {
    dailyCompanyRefresh: process.env.DAILY_COMPANY_REFRESH_CRON || '0 2 * * *',
    dailyHiringRefresh: process.env.DAILY_HIRING_REFRESH_CRON || '0 3 * * *',
    weeklyContactRefresh: process.env.WEEKLY_CONTACT_REFRESH_CRON || '0 4 * * 1',
    weeklyTechRefresh: process.env.WEEKLY_TECH_REFRESH_CRON || '0 5 * * 1'
  },
  email: {
    host: process.env.SMTP_HOST || 'smtp.gmail.com',
    port: toInt(process.env.SMTP_PORT, 587),
    user: process.env.SMTP_USER || '',
    pass: process.env.SMTP_PASS || ''
  },
  openai: {
    apiKey: process.env.OPENAI_API_KEY || ''
  },
  apollo: {
    apiKey: process.env.APOLLO_API_KEY || ''
  }
};

// Backward-compatible aliases used by the existing services.
config.nodeEnv = config.server.nodeEnv;
config.port = config.server.port;
config.apiPrefix = config.server.apiPrefix;
config.databaseMode = config.database.mode;
config.mongoUri = config.database.mongoUri;
config.jwt.secret = config.jwt.accessTokenSecret;
config.jwt.expiresIn = config.jwt.accessTokenExpires;

module.exports = config;
