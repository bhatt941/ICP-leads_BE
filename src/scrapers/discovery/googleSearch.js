const cheerio = require('cheerio');
const logger = require('../../utils/logger');
const { loadPage } = require('../utils/pageLoader');
const { clean, hostname } = require('../utils/extractors');

const excludedHosts = ['google.com', 'youtube.com', 'linkedin.com', 'facebook.com', 'wikipedia.org'];

async function discoverFromGoogle(query, maxResults = 10) {
  try {
    const searchUrl = `https://www.google.com/search?q=${encodeURIComponent(query)}&num=20`;
    const { html } = await loadPage(searchUrl);
    if (!html) return [];

    const $ = cheerio.load(html);
    const results = [];
    const allowLinkedin = /site:linkedin\.com/i.test(query);

    $('#search a[href]').each((_index, element) => {
      const href = unwrapGoogleUrl($(element).attr('href'));
      if (!href || !isLikelyCompanyHomepage(href, allowLinkedin)) return;
      const companyName = clean($(element).text()) || hostname(href);
      results.push({ companyName, website: allowLinkedin ? href : normalizeHomepage(href), discoverySource: 'google' });
    });

    return dedupe(results).slice(0, maxResults);
  } catch (error) {
    logger.warn('Google discovery failed', { query, error: error.message });
    return [];
  }
}

function unwrapGoogleUrl(href) {
  if (!href) return undefined;
  try {
    const url = new URL(href, 'https://www.google.com');
    return url.pathname === '/url' ? url.searchParams.get('q') : url.toString();
  } catch (_error) {
    return undefined;
  }
}

function isLikelyCompanyHomepage(url, allowLinkedin = false) {
  const host = hostname(url);
  if (!host) return false;
  if (excludedHosts.some((excluded) => host.includes(excluded) && !(allowLinkedin && excluded === 'linkedin.com'))) return false;
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
  discoverFromGoogle
};
