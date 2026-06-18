const cheerio = require('cheerio');
const logger = require('../../utils/logger');
const { loadPage } = require('../utils/pageLoader');
const { clean, hostname } = require('../utils/extractors');

const excludedHosts = ['bing.com', 'youtube.com', 'linkedin.com', 'facebook.com', 'wikipedia.org'];

async function discoverFromBing(query, maxResults = 10) {
  try {
    const searchUrl = `https://www.bing.com/search?q=${encodeURIComponent(query)}`;
    const { html } = await loadPage(searchUrl);
    if (!html) return [];

    const $ = cheerio.load(html);
    const results = [];

    $('#b_results a[href], li.b_algo h2 a[href]').each((_index, element) => {
      const href = $(element).attr('href');
      if (!href || !isLikelyCompanyHomepage(href)) return;
      const companyName = clean($(element).text()) || hostname(href);
      results.push({ companyName, website: normalizeHomepage(href), discoverySource: 'bing' });
    });

    return dedupe(results).slice(0, maxResults);
  } catch (error) {
    logger.warn('Bing discovery failed', { query, error: error.message });
    return [];
  }
}

function isLikelyCompanyHomepage(url) {
  const host = hostname(url);
  if (!host) return false;
  if (excludedHosts.some((excluded) => host.includes(excluded))) return false;
  return /^https?:\/\//i.test(url);
}

function normalizeHomepage(url) {
  const parsed = new URL(url);
  return `${parsed.protocol}//${parsed.hostname}`;
}

function dedupe(items) {
  const seen = new Set();
  return items.filter((item) => {
    if (seen.has(item.website)) return false;
    seen.add(item.website);
    return true;
  });
}

module.exports = {
  discoverFromBing
};
