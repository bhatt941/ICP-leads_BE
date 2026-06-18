const cheerio = require('cheerio');
const logger = require('../../utils/logger');
const { loadPage } = require('../utils/pageLoader');
const { absoluteUrl, clean } = require('../utils/extractors');

async function scrapeClutch(industry, location, maxPages = 3) {
  try {
    const results = [];
    for (let page = 0; page < maxPages; page += 1) {
      const params = new URLSearchParams();
      if (industry) params.set('search', industry);
      if (location) params.set('location', location);
      if (page) params.set('page', page);
      const url = `https://clutch.co/directory?${params.toString()}`;
      const { html } = await loadPage(url);
      if (!html) continue;
      const $ = cheerio.load(html);

      $('[data-position], .provider-row, .company_info, .directory-list div').each((_index, element) => {
        const card = $(element);
        const name = clean(card.find('h3, h2, .company-name, .provider__title').first().text());
        const websiteHref = card.find('a[href*="http"]').first().attr('href');
        const website = websiteHref ? absoluteUrl('https://clutch.co', websiteHref) : undefined;
        const description = clean(card.find('.description, .provider__description, p').first().text());
        if (name || website) {
          results.push({ companyName: name || website, website, description, discoverySource: 'clutch' });
        }
      });
    }
    return dedupe(results);
  } catch (error) {
    logger.warn('Clutch scrape failed', { industry, location, error: error.message });
    return [];
  }
}

function dedupe(items) {
  const seen = new Set();
  return items.filter((item) => {
    const key = item.website || item.companyName;
    if (!key || seen.has(key)) return false;
    seen.add(key);
    return true;
  });
}

module.exports = {
  scrapeClutch
};
