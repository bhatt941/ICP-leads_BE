const logger = require('../../utils/logger');
const { discoverFromGoogle } = require('../discovery/googleSearch');
const { inferSeniority } = require('../utils/extractors');

async function searchDecisionMakers(companyName, website) {
  try {
    const titles = ['CEO', 'CTO', 'CFO', 'COO', 'CMO', 'Founder', 'VP', 'Director', 'Manager'];
    const results = [];
    for (const title of titles.slice(0, 5)) {
      const query = `"${title}" "${companyName}" site:linkedin.com/in`;
      const profiles = await discoverFromGoogle(query, 5);
      for (const profile of profiles) {
        if (!profile.website.includes('linkedin.com')) continue;
        const parsed = parseLinkedinResult(profile.companyName, title);
        results.push({
          name: parsed.name,
          designation: parsed.designation || title,
          linkedinUrl: profile.website,
          companyName,
          sourceUrl: website,
          seniority: inferSeniority(parsed.designation || title)
        });
      }
    }
    if (results.length === 0) {
      logger.info('Google search returned 0 contact profiles. Trying AI contacts generation fallback...', { companyName });
      const { discoverPeopleWithAi } = require('../../services/aiDiscovery');
      const aiContacts = await discoverPeopleWithAi(companyName, website);
      results.push(...aiContacts);
    }
    return dedupe(results);
  } catch (error) {
    logger.warn('Decision maker search failed', { companyName, error: error.message });
    return [];
  }
}

function parseLinkedinResult(text, fallbackTitle) {
  const cleaned = String(text || '').replace(/\s+\|\s+LinkedIn.*/i, '').trim();
  const parts = cleaned.split(/\s+-\s+|\s+\|\s+/);
  return {
    name: parts[0] || cleaned,
    designation: parts.find((part) => /(CEO|CTO|CFO|COO|CMO|Founder|VP|Director|Manager|Head)/i.test(part)) || fallbackTitle
  };
}

function dedupe(items) {
  const seen = new Set();
  return items.filter((item) => {
    const key = item.linkedinUrl || `${item.name}-${item.designation}`;
    if (!item.name || seen.has(key)) return false;
    seen.add(key);
    return true;
  });
}

module.exports = {
  searchDecisionMakers
};
