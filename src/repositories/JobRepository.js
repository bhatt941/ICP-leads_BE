const BaseRepository = require('./BaseRepository');
const { Job } = require('../models');

class JobRepository extends BaseRepository {
  constructor() {
    super(Job);
  }

  findByCompany(companyId) {
    return this.findAll({ companyId, isDeleted: false });
  }

  async bulkUpsert(jobs = []) {
    const results = [];
    for (const job of jobs) {
      const existing = job.jobUrl
        ? await this.findOne({ jobUrl: job.jobUrl })
        : await this.findOne({ companyId: job.companyId, title: job.title, location: job.location || '' });
      results.push(existing ? await this.updateById(existing._id, job) : await this.create(job));
    }
    return results;
  }

  async search(filters = {}, pagination = {}) {
    const page = Math.max(Number(pagination.page) || 1, 1);
    const limit = Math.min(Math.max(Number(pagination.limit) || 25, 1), 100);
    const skip = (page - 1) * limit;
    const [data, totalRecords] = await Promise.all([
      this.findAll(filters, { skip, limit, sort: sortOption(pagination, { postedDate: -1, createdAt: -1 }) }),
      this.count(filters)
    ]);
    return { data, pagination: buildPagination(page, limit, totalRecords) };
  }

  findActiveJobs(filters = {}) {
    return this.findAll({ ...filters, isActive: true, isDeleted: false });
  }
}

function buildPagination(page, limit, totalRecords) {
  const totalPages = Math.ceil(totalRecords / limit) || 1;
  return { page, limit, totalRecords, totalPages, hasNextPage: page < totalPages, hasPreviousPage: page > 1 };
}

function sortOption(pagination, fallback) {
  if (!pagination.sort) return fallback;
  return { [pagination.sort]: pagination.order === 'asc' ? 1 : -1 };
}

module.exports = JobRepository;
