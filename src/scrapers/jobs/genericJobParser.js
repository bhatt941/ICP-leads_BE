const cheerio = require('cheerio');
const logger = require('../../utils/logger');
const { loadPage } = require('../utils/pageLoader');
const { clean, extractSkills } = require('../utils/extractors');

async function parseJobPage(jobUrl, companyId, companyName) {
  try {
    const { html, finalUrl } = await loadPage(jobUrl);
    if (!html) return emptyJob(jobUrl, companyId, companyName);
    const $ = cheerio.load(html);
    const text = clean($('body').text());
    const title = clean($('h1').first().text() || $('title').first().text());
    const description = clean($('[class*="description"], [id*="description"], main, article').first().text()) || text;
    return {
      title,
      companyId,
      companyName,
      description,
      location: extractByLabel(text, /(Location|Where)[:\s]+([^|•\n]+)/i),
      requiredSkills: extractSkills(description),
      employmentType: inferEmploymentType(text),
      workplaceType: inferWorkplaceType(text),
      jobUrl: finalUrl || jobUrl,
      sourcePlatform: 'generic',
      isActive: true
    };
  } catch (error) {
    logger.warn('Generic job parse failed', { jobUrl, error: error.message });
    return emptyJob(jobUrl, companyId, companyName);
  }
}

function emptyJob(jobUrl, companyId, companyName) {
  return {
    title: '',
    companyId,
    companyName,
    description: '',
    location: '',
    requiredSkills: [],
    employmentType: 'unknown',
    workplaceType: 'unknown',
    jobUrl,
    sourcePlatform: 'generic',
    isActive: true
  };
}

function extractByLabel(text, pattern) {
  const match = text.match(pattern);
  return match ? clean(match[2]) : '';
}

function inferEmploymentType(text) {
  const value = text.toLowerCase();
  if (value.includes('part-time')) return 'part_time';
  if (value.includes('contract')) return 'contract';
  if (value.includes('intern')) return 'internship';
  if (value.includes('full-time') || value.includes('full time')) return 'full_time';
  return 'unknown';
}

function inferWorkplaceType(text) {
  const value = text.toLowerCase();
  if (value.includes('remote')) return 'remote';
  if (value.includes('hybrid')) return 'hybrid';
  if (value.includes('onsite') || value.includes('on-site')) return 'onsite';
  return 'unknown';
}

module.exports = {
  parseJobPage
};
