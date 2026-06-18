const cheerio = require('cheerio');
const { chromium } = require('playwright');
const puppeteer = require('puppeteer');
const env = require('../config/env');
const httpClient = require('../utils/httpClient');

async function fetchHtml(url) {
  const response = await httpClient.get(url);
  return response.data;
}

async function fetchWithBrowser(url) {
  let browser;
  try {
    browser = await chromium.launch({ headless: env.scraper.headless });
    const page = await browser.newPage({ userAgent: env.scraper.userAgent });
    await page.goto(url, { waitUntil: 'domcontentloaded', timeout: env.scraper.timeoutMs });
    return await page.content();
  } catch (error) {
    if (browser) await browser.close();
    browser = await puppeteer.launch({ headless: env.scraper.headless ? 'new' : false });
    const page = await browser.newPage();
    await page.setUserAgent(env.scraper.userAgent);
    await page.goto(url, { waitUntil: 'domcontentloaded', timeout: env.scraper.timeoutMs });
    return page.content();
  } finally {
    if (browser) await browser.close();
  }
}

async function loadPage(url, options = {}) {
  const html = options.browser ? await fetchWithBrowser(url) : await fetchHtml(url);
  return cheerio.load(html);
}

function absoluteUrl(baseUrl, value) {
  try {
    return new URL(value, baseUrl).toString();
  } catch (_error) {
    return undefined;
  }
}

module.exports = {
  absoluteUrl,
  fetchHtml,
  fetchWithBrowser,
  loadPage
};
