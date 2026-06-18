const { loadPage } = require('./baseScraper');
const { clean } = require('./parsers');

function buildDuckDuckGoUrl({ industry, country, city, keywords }) {
  const query = [industry, country, city, keywords, 'company website']
    .filter(Boolean)
    .join(' ');
  return `https://duckduckgo.com/html/?q=${encodeURIComponent(query)}`;
}

async function discoverCompanies(input) {
  const searchUrl = buildDuckDuckGoUrl(input);
  const $ = await loadPage(searchUrl);
  const results = [];

  $('.result__a, a.result__url').each((_index, element) => {
    const href = unwrapSearchUrl($(element).attr('href'));
    const label = clean($(element).text());
    if (!href) return;
    try {
      const url = new URL(href.startsWith('//') ? `https:${href}` : href);
      results.push({
        companyName: label,
        website: `${url.protocol}//${url.hostname}`,
        sourceUrl: searchUrl
      });
    } catch (_error) {
      // Ignore malformed search result links.
    }
  });

  const unique = new Map();
  for (const result of results) {
    if (!unique.has(result.website)) unique.set(result.website, result);
  }
  return [...unique.values()].slice(0, 25);
}

function unwrapSearchUrl(href) {
  if (!href) return undefined;
  try {
    const url = new URL(href.startsWith('//') ? `https:${href}` : href, 'https://duckduckgo.com');
    return url.searchParams.get('uddg') || url.toString();
  } catch (_error) {
    return undefined;
  }
}

module.exports = {
  discoverCompanies
};
