const cheerio = require('cheerio');
const logger = require('../../utils/logger');
const httpClient = require('../../utils/httpClient');
const { loadPage } = require('../utils/pageLoader');

const signatures = [
  ['React', /react|__react|reactroot/i],
  ['Angular', /ng-version|angular/i],
  ['Vue', /vue|__vue/i],
  ['Next.js', /_next\/static|nextjs/i],
  ['Nuxt', /_nuxt|nuxt/i],
  ['jQuery', /jquery/i],
  ['Bootstrap', /bootstrap/i],
  ['Tailwind', /tailwind/i],
  ['WordPress', /wp-content|wordpress/i],
  ['Shopify', /shopify|cdn\.shopify/i],
  ['Webflow', /webflow/i],
  ['Google Analytics', /google-analytics|gtag\(|googletagmanager/i],
  ['HubSpot', /hubspot|hs-scripts/i],
  ['Salesforce', /salesforce|force\.com/i],
  ['Intercom', /intercom/i],
  ['Zendesk', /zendesk/i],
  ['AWS', /cloudfront\.net|s3\.amazonaws\.com|amazonaws\.com/i],
  ['GCP', /googleapis\.com|gstatic\.com|firebaseapp\.com/i],
  ['Azure', /azure|windows\.net/i],
  ['MongoDB', /mongodb/i],
  ['Firebase', /firebase/i],
  ['Stripe', /stripe/i],
  ['Segment', /segment\.com|segment\.io/i]
];

async function detectTechnologies(websiteUrl) {
  try {
    const { html } = await loadPage(websiteUrl);
    if (!html) return { technologies: [], rawSignals: {} };
    const $ = cheerio.load(html);
    const signals = {
      scripts: $('script[src]').map((_i, el) => $(el).attr('src')).get(),
      links: $('link[href]').map((_i, el) => $(el).attr('href')).get(),
      metas: $('meta').map((_i, el) => `${$(el).attr('name') || ''}:${$(el).attr('content') || ''}`).get(),
      comments: extractComments(html),
      xPoweredBy: await getPoweredByHeader(websiteUrl)
    };
    const haystack = [html, ...signals.scripts, ...signals.links, ...signals.metas, ...signals.comments, signals.xPoweredBy].join('\n');
    const technologies = signatures.filter(([, pattern]) => pattern.test(haystack)).map(([name]) => name);
    if (/node|express/i.test(signals.xPoweredBy || '')) technologies.push('Node.js');
    return { technologies: [...new Set(technologies)], rawSignals: signals };
  } catch (error) {
    logger.warn('Technology detection failed', { websiteUrl, error: error.message });
    return { technologies: [], rawSignals: {} };
  }
}

async function getPoweredByHeader(url) {
  try {
    const response = await httpClient.get(url);
    return response.headers['x-powered-by'] || '';
  } catch (_error) {
    return '';
  }
}

function extractComments(html) {
  return [...String(html || '').matchAll(/<!--([\s\S]*?)-->/g)].map((match) => match[1]);
}

module.exports = {
  detectTechnologies
};
