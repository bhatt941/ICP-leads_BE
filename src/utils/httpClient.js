const axios = require('axios');
const config = require('../config/env');
const logger = require('./logger');

const httpClient = axios.create({
  timeout: config.scraper.timeoutMs,
  headers: {
    'User-Agent': config.scraper.userAgent,
    Accept: 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8'
  },
  maxRedirects: 5,
  validateStatus: (status) => status >= 200 && status < 400
});

function delay(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

httpClient.interceptors.response.use(
  (response) => response,
  async (error) => {
    const config = error.config || {};
    config.__retryCount = config.__retryCount || 0;

    const status = error.response?.status;
    const isFatalNetwork = error.code && [
      'ENOTFOUND',
      'ECONNRESET',
      'ETIMEDOUT',
      'ECONNABORTED',
      'EHOSTUNREACH',
      'ECONNREFUSED',
      'EPIPE',
      'ERR_NAME_NOT_RESOLVED',
      'ERR_CONNECTION_REFUSED',
      'ERR_CONNECTION_RESET'
    ].includes(error.code);

    const msg = String(error.message || '').toUpperCase();
    const isFatalMessage = msg.includes('ENOTFOUND') || 
                           msg.includes('ECONNRESET') || 
                           msg.includes('ETIMEDOUT') || 
                           msg.includes('TIMEOUT') || 
                           msg.includes('ERR_NAME_NOT_RESOLVED') ||
                           msg.includes('DNS') ||
                           msg.includes('SOCKET HANG UP');

    const shouldRetry = !isFatalNetwork && !isFatalMessage && (!error.response || status === 429 || status === 503);
    if (!shouldRetry || config.__retryCount >= 3) {
      return Promise.reject(error);
    }

    config.__retryCount += 1;
    const backoff = 500 * (2 ** (config.__retryCount - 1));
    logger.warn('HTTP request failed; retrying', {
      url: config.url,
      attempt: config.__retryCount,
      status: status || 'network'
    });
    await delay(backoff);
    return httpClient(config);
  }
);

module.exports = httpClient;
