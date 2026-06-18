const { chromium } = require('playwright');
const config = require('../../config/env');
const httpClient = require('../../utils/httpClient');
const logger = require('../../utils/logger');

async function loadPage(url) {
  try {
    const response = await httpClient.get(url);
    const html = response.data || '';
    if (String(html).trim()) {
      return {
        html,
        finalUrl: response.request?.res?.responseUrl || response.config.url || url,
        loadedWith: 'axios'
      };
    }
    throw new Error('Axios returned empty HTML');
  } catch (axiosError) {
    if (axiosError.response?.status === 404) {
      logger.info('Page does not exist (404). Skipping Playwright.', { url });
      return { html: '', finalUrl: url, loadedWith: 'axios' };
    }
    const isFatalNetwork = axiosError.code && [
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
    ].includes(axiosError.code);

    const msg = String(axiosError.message || '').toUpperCase();
    const isFatalMessage = msg.includes('ENOTFOUND') || 
                           msg.includes('ECONNRESET') || 
                           msg.includes('ETIMEDOUT') || 
                           msg.includes('TIMEOUT') || 
                           msg.includes('ERR_NAME_NOT_RESOLVED') ||
                           msg.includes('DNS') ||
                           msg.includes('SOCKET HANG UP');

    if (isFatalNetwork || isFatalMessage) {
      logger.warn('Axios page load failed with fatal network/DNS error. Skipping Playwright fallback.', { url, error: axiosError.message });
      return { html: '', finalUrl: url, loadedWith: 'axios' };
    }
    logger.warn('Axios page load failed; trying Playwright', { url, error: axiosError.message });
  }

  let browser;
  try {
    browser = await chromium.launch({ headless: config.scraper.headless });
    const page = await browser.newPage({ userAgent: config.scraper.userAgent });
    await page.goto(url, {
      waitUntil: 'domcontentloaded',
      timeout: config.scraper.timeoutMs
    });
    const html = await page.content();
    return {
      html,
      finalUrl: page.url(),
      loadedWith: 'playwright'
    };
  } catch (error) {
    logger.warn('Playwright page load failed', { url, error: error.message });
    return { html: '', finalUrl: url, loadedWith: 'playwright' };
  } finally {
    if (browser) await browser.close().catch(() => {});
  }
}

module.exports = {
  loadPage
};
