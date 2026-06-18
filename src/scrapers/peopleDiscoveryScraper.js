const { loadPage } = require('./baseScraper');
const { clean, inferDepartment, inferSeniority } = require('./parsers');

const decisionMakerTitles = [
  'CEO',
  'CTO',
  'CFO',
  'COO',
  'CMO',
  'Founder',
  'Co-Founder',
  'Owner',
  'President',
  'Vice President',
  'Director',
  'Engineering Manager',
  'Head of Engineering',
  'Head of Marketing',
  'Head of Sales',
  'Head of HR',
  'Talent Acquisition Manager',
  'Recruiter'
];

async function discoverPeople(company) {
  const query = `${company.companyName} (${decisionMakerTitles.slice(0, 8).join(' OR ')}) LinkedIn`;
  const searchUrl = `https://duckduckgo.com/html/?q=${encodeURIComponent(query)}`;
  const $ = await loadPage(searchUrl);
  const contacts = [];

  $('.result__a').each((_index, element) => {
    const text = clean($(element).text());
    const href = unwrapSearchUrl($(element).attr('href'));
    if (!text || !href || !href.includes('linkedin.com/in')) return;
    const title = decisionMakerTitles.find((item) => text.toLowerCase().includes(item.toLowerCase()));
    if (!title) return;
    const name = clean(text.split('-')[0] || text.split('|')[0]);
    contacts.push({
      name,
      designation: title,
      companyName: company.companyName,
      companyId: company._id,
      linkedinUrl: href,
      department: inferDepartment(title),
      seniority: inferSeniority(title),
      location: company.location,
      sourceUrl: searchUrl,
      confidence: 45,
      lastVerifiedAt: new Date()
    });
  });

  return contacts.slice(0, 20);
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
  discoverPeople
};
