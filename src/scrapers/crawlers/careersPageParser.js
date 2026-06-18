const cheerio = require('cheerio');
const logger = require('../../utils/logger');
const { loadPage } = require('../utils/pageLoader');
const { absoluteUrl, clean } = require('../utils/extractors');

async function parseCareersPage(careersUrl) {
  try {
    if (!careersUrl) return { platform: 'unknown', jobs: [], totalJobsFound: 0 };
    const { html, finalUrl } = await loadPage(careersUrl);
    if (!html) return { platform: 'unknown', jobs: [], totalJobsFound: 0 };
    const $ = cheerio.load(html);
    const platform = detectPlatform(finalUrl || careersUrl, html);
    const jobs = [];

    $('a[href]').each((_index, element) => {
      const title = clean($(element).text());
      if (!isJobTitle(title)) return;
      const jobUrl = absoluteUrl(finalUrl || careersUrl, $(element).attr('href'));
      const container = $(element).closest('li, tr, div, article');
      const location = clean(container.find('[class*="location"], [data-qa*="location"]').first().text());
      const department = clean(container.find('[class*="department"], [data-qa*="department"]').first().text());
      const postedDate = clean(container.find('time').attr('datetime') || container.find('time').text());
      jobs.push({ title, location, department, jobUrl, postedDate: postedDate ? new Date(postedDate) : undefined });
    });

    return { platform, jobs: dedupeJobs(jobs), totalJobsFound: dedupeJobs(jobs).length };
  } catch (error) {
    logger.warn('Careers page parse failed', { careersUrl, error: error.message });
    return { platform: 'unknown', jobs: [], totalJobsFound: 0 };
  }
}

function detectPlatform(url, html) {
  const value = `${url} ${html}`.toLowerCase();
  if (value.includes('greenhouse.io')) return 'Greenhouse';
  if (value.includes('lever.co')) return 'Lever';
  if (value.includes('myworkdayjobs') || value.includes('workday')) return 'Workday';
  if (value.includes('ashbyhq')) return 'Ashby';
  return 'unknown';
}

function isJobTitle(text) {
  return text.length > 4 && /(engineer|developer|manager|sales|marketing|designer|analyst|product|data|recruiter|director|lead|specialist)/i.test(text);
}

function dedupeJobs(jobs) {
  const seen = new Set();
  return jobs.filter((job) => {
    const key = job.jobUrl || job.title;
    if (!key || seen.has(key)) return false;
    seen.add(key);
    return true;
  });
}

module.exports = {
  parseCareersPage
};
