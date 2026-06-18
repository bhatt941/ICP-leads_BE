function clean(value) {
  return String(value || '').replace(/\s+/g, ' ').trim();
}

function absoluteUrl(baseUrl, href) {
  try {
    return new URL(href, baseUrl).toString();
  } catch (_error) {
    return undefined;
  }
}

function hostname(value) {
  try {
    return new URL(value).hostname.replace(/^www\./, '');
  } catch (_error) {
    return '';
  }
}

function extractEmails(text) {
  return [...new Set(String(text || '').match(/[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-z]{2,}/g) || [])];
}

function extractPhones(text) {
  return [...new Set(String(text || '').match(/(?:\+?\d{1,3}[\s.-]?)?(?:\(?\d{2,4}\)?[\s.-]?)?\d{3,4}[\s.-]?\d{4}/g) || [])]
    .map(clean)
    .filter((phone) => phone.length >= 7);
}

function inferSeniority(title = '') {
  const value = title.toLowerCase();
  if (/(ceo|cto|cfo|coo|cmo|founder|chief)/.test(value)) return 'c_level';
  if (/\bvp\b|vice president/.test(value)) return 'vp';
  if (/director/.test(value)) return 'director';
  if (/manager/.test(value)) return 'manager';
  if (/senior|head/.test(value)) return 'senior';
  return 'unknown';
}

function extractSkills(text = '') {
  const keywords = [
    'JavaScript',
    'TypeScript',
    'React',
    'Angular',
    'Vue',
    'Node.js',
    'Python',
    'Java',
    'AWS',
    'Azure',
    'GCP',
    'Docker',
    'Kubernetes',
    'MongoDB',
    'PostgreSQL',
    'Machine Learning',
    'AI',
    'ML',
    'Salesforce',
    'HubSpot'
  ];
  const lower = text.toLowerCase();
  return keywords.filter((skill) => lower.includes(skill.toLowerCase()));
}

module.exports = {
  absoluteUrl,
  clean,
  extractEmails,
  extractPhones,
  extractSkills,
  hostname,
  inferSeniority
};
