const { absoluteUrl, loadPage } = require('./baseScraper');
const { clean, inferWorkplaceType } = require('./parsers');

const jobTitlePattern = /(engineer|developer|manager|sales|marketing|recruiter|analyst|designer|product|data|finance|operations)/i;

async function discoverJobsFromCareersPage(company) {
  const root = company.website;
  const candidatePaths = ['/careers', '/jobs', '/join-us', '/work-with-us'];
  const jobs = [];

  for (const path of candidatePaths) {
    const url = absoluteUrl(root, path);
    try {
      const $ = await loadPage(url);
      $('a[href]').each((_index, element) => {
        const label = clean($(element).text());
        if (!label || !jobTitlePattern.test(label)) return;
        const jobUrl = absoluteUrl(url, $(element).attr('href'));
        if (!jobUrl) return;
        jobs.push({
          title: label,
          companyId: company._id,
          companyName: company.companyName,
          description: label,
          location: company.location || 'Unknown',
          workplaceType: inferWorkplaceType(label),
          department: inferDepartmentFromTitle(label),
          employmentType: 'full_time',
          jobUrl,
          sourcePlatform: 'Company Careers Page',
          industry: company.industry,
          isActive: true,
          postedDate: new Date()
        });
      });
    } catch (_error) {
      // Careers URL may not exist; continue trying common paths.
    }
  }

  const unique = new Map();
  for (const job of jobs) {
    if (!unique.has(job.jobUrl)) unique.set(job.jobUrl, job);
  }
  return [...unique.values()].slice(0, 50);
}

function inferDepartmentFromTitle(title) {
  const value = title.toLowerCase();
  if (/(engineer|developer|data|architect|qa|devops)/.test(value)) return 'Engineering';
  if (/(sales|account executive|revenue)/.test(value)) return 'Sales';
  if (/(marketing|growth|seo|content)/.test(value)) return 'Marketing';
  if (/(recruit|talent|hr|people)/.test(value)) return 'Human Resources';
  if (/(finance|accountant|controller)/.test(value)) return 'Finance';
  if (/(product|designer|ux|ui)/.test(value)) return 'Product';
  return 'General';
}

module.exports = {
  discoverJobsFromCareersPage
};
