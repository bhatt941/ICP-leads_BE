const emailPattern = /[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-z]{2,}/g;
const phonePattern = /(?:\+?\d{1,3}[\s.-]?)?(?:\(?\d{2,4}\)?[\s.-]?)?\d{3,4}[\s.-]?\d{4}/g;

function clean(value) {
  return value ? String(value).replace(/\s+/g, ' ').trim() : undefined;
}

function firstMatch(text, pattern) {
  const matches = String(text || '').match(pattern);
  return matches?.[0];
}

function extractEmails(text) {
  return [...new Set(String(text || '').match(emailPattern) || [])];
}

function extractPhones(text) {
  return [...new Set(String(text || '').match(phonePattern) || [])].map(clean);
}

function inferDepartment(designation = '') {
  const value = designation.toLowerCase();
  if (/(engineering|technology|cto|developer|architect)/.test(value)) return 'Engineering';
  if (/(marketing|cmo|brand|growth)/.test(value)) return 'Marketing';
  if (/(sales|revenue|business development)/.test(value)) return 'Sales';
  if (/(hr|people|talent|recruit)/.test(value)) return 'Human Resources';
  if (/(finance|cfo|account)/.test(value)) return 'Finance';
  if (/(operation|coo)/.test(value)) return 'Operations';
  return 'Leadership';
}

function inferSeniority(designation = '') {
  const value = designation.toLowerCase();
  if (/(chief|ceo|cto|cfo|coo|cmo|founder|owner|president)/.test(value)) return 'Executive';
  if (/(vice president|vp|head|director)/.test(value)) return 'Senior Leadership';
  if (/(manager|lead)/.test(value)) return 'Manager';
  return 'Individual Contributor';
}

function inferWorkplaceType(text = '') {
  const value = text.toLowerCase();
  if (value.includes('remote')) return 'remote';
  if (value.includes('hybrid')) return 'hybrid';
  if (value.includes('onsite') || value.includes('on-site')) return 'onsite';
  return 'unknown';
}

module.exports = {
  clean,
  extractEmails,
  extractPhones,
  firstMatch,
  inferDepartment,
  inferSeniority,
  inferWorkplaceType
};
