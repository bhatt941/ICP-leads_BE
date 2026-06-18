const { JobRepository } = require('../repositories');

function regex(value) {
  return value ? new RegExp(String(value).trim(), 'i') : undefined;
}

function parseList(value) {
  if (!value) return undefined;
  return String(value).split(',').map((item) => item.trim()).filter(Boolean);
}

function buildJobFilter(filters = {}) {
  const query = { isDeleted: false };
  if (filters.companyId) query.companyId = filters.companyId;
  if (filters.title) query.title = regex(filters.title);
  if (filters.industry) query.industry = regex(filters.industry);
  if (filters.country) query.country = regex(filters.country);
  if (filters.workplaceType) query.workplaceType = filters.workplaceType;
  if (filters.department) query.department = regex(filters.department);
  const skills = parseList(filters.requiredSkills);
  if (skills?.length) query.requiredSkills = { $in: skills.map(regex) };
  if (filters.keywords) query.title = regex(filters.keywords);
  return query;
}

class JobService {
  createJob(data) {
    return JobRepository.create(data);
  }

  getJobById(id) {
    return JobRepository.findById(id);
  }

  listJobs(filters = {}, pagination = {}) {
    return JobRepository.search(buildJobFilter(filters), pagination);
  }

  updateJob(id, data) {
    return JobRepository.updateById(id, data);
  }

  deleteJob(id, userId) {
    return JobRepository.softDelete(id, userId);
  }

  bulkInsert(jobs = []) {
    return JobRepository.bulkUpsert(jobs);
  }

  bulkUpsertScrapedJobs(jobs = []) {
    return JobRepository.bulkUpsert(jobs);
  }

  async getApolloJobPostings(organizationId, page = 1, perPage = 10, companyId = null) {
    const { getJobPostingsWithApollo } = require('./aiDiscovery');
    const apolloData = await getJobPostingsWithApollo(organizationId, page, perPage);
    const postings = apolloData?.organization_job_postings || [];

    let savedJobs = [];
    if (companyId && postings.length > 0) {
      const CompanyService = require('./companyService');
      const company = await CompanyService.getCompanyById(companyId);
      if (company) {
        const jobsToUpsert = postings.map(post => ({
          title: post.title || 'Untitled Role',
          companyId: company._id,
          companyName: company.companyName,
          organizationId: company.organizationId,
          city: post.city || '',
          state: post.state || '',
          country: post.country || '',
          location: [post.city, post.state, post.country].filter(Boolean).join(', ') || 'Unknown',
          jobUrl: post.url || '',
          sourcePlatform: 'apollo',
          postedDate: post.posted_at ? new Date(post.posted_at) : new Date(),
          posted_date: post.posted_at ? new Date(post.posted_at) : new Date(),
          isActive: true,
          isDeleted: false
        }));

        savedJobs = await JobRepository.bulkUpsert(jobsToUpsert);

        // Update company hiring signal
        await CompanyService.updateCompany(company._id, {
          hiringStatus: 'active',
          hiringIntensity: Math.min(savedJobs.length * 10, 100)
        });
      }
    }

    return {
      organization_job_postings: postings,
      savedCount: savedJobs.length,
      savedJobs: savedJobs
    };
  }
}

module.exports = new JobService();
