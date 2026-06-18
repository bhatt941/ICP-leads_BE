const cheerio = require('cheerio');
const logger = require('../../utils/logger');
const { loadPage } = require('../utils/pageLoader');
const { clean } = require('../utils/extractors');

const titlePattern = /(CEO|CTO|CFO|COO|CMO|Founder|Co-Founder|VP|Vice President|Director|Head of [A-Za-z ]+|Manager)/i;

async function parseLeadershipPage(pageUrl, companyName) {
  try {
    const { html } = await loadPage(pageUrl);
    if (!html) return [];
    const $ = cheerio.load(html);
    const people = [];

    $('h1,h2,h3,h4,p,li,div').each((_index, element) => {
      const text = clean($(element).text());
      if (!titlePattern.test(text)) return;
      const title = text.match(titlePattern)?.[0];
      const name = extractNameNearTitle(text, title);
      if (name && title) people.push({ name, designation: title, companyName, sourceUrl: pageUrl });
    });

    return dedupe(people).slice(0, 30);
  } catch (error) {
    logger.warn('Leadership page parse failed', { pageUrl, error: error.message });
    return [];
  }
}

function extractNameNearTitle(text, title) {
  const before = clean(text.split(title)[0]).split(/[|,-]/).pop();
  const after = clean(text.split(title)[1] || '').split(/[|,-]/)[0];
  const candidate = before || after;
  const match = clean(candidate).match(/[A-Z][a-z]+(?:\s+[A-Z][a-z]+){1,3}/);
  return match ? match[0] : undefined;
}

function dedupe(people) {
  const seen = new Set();
  return people.filter((person) => {
    const key = `${person.name}-${person.designation}`;
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });
}

module.exports = {
  parseLeadershipPage
};
