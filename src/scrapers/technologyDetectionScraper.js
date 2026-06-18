const { fetchHtml } = require('./baseScraper');

const signatures = [
  { name: 'React', patterns: [/react/i, /_next\/static/i] },
  { name: 'Angular', patterns: [/ng-version/i, /angular/i] },
  { name: 'Vue', patterns: [/vue/i, /__vue/i] },
  { name: 'Node.js', patterns: [/node\.js/i, /express/i] },
  { name: 'Java', patterns: [/java/i, /spring/i] },
  { name: 'Python', patterns: [/python/i, /django/i, /flask/i] },
  { name: 'AWS', patterns: [/amazonaws\.com/i, /aws/i] },
  { name: 'Azure', patterns: [/azure/i, /windows\.net/i] },
  { name: 'GCP', patterns: [/googleapis\.com/i, /gcp/i] },
  { name: 'Salesforce', patterns: [/salesforce/i, /force\.com/i] },
  { name: 'HubSpot', patterns: [/hubspot/i, /hs-scripts/i] },
  { name: 'WordPress', patterns: [/wp-content/i, /wordpress/i] },
  { name: 'Shopify', patterns: [/shopify/i, /cdn\.shopify/i] }
];

async function detectTechnologies(url) {
  const html = await fetchHtml(url);
  return signatures
    .filter((signature) => signature.patterns.some((pattern) => pattern.test(html)))
    .map((signature) => signature.name);
}

module.exports = {
  detectTechnologies
};
