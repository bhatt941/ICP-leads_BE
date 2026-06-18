const BaseRepository = require('./BaseRepository');
const { Company, Contact, Job, LeadScore } = require('../models');

class CompanyRepository extends BaseRepository {
  constructor() {
    super(Company);
  }

  findByWebsite(url) {
    return this.findOne({ website: url });
  }

  findByLinkedin(url) {
    return this.findOne({ linkedinCompanyUrl: url });
  }

  async upsertByWebsite(data) {
    const existing = data.website ? await this.findByWebsite(data.website) : null;
    if (existing) return this.updateById(existing._id, data);
    return this.create(data);
  }

  async bulkUpsert(companies = []) {
    const results = [];
    for (const company of companies) {
      results.push(await this.upsertByWebsite(company));
    }
    return results;
  }

  async search(filters = {}, pagination = {}) {
    const page = Math.max(Number(pagination.page) || 1, 1);
    const limit = Math.min(Math.max(Number(pagination.limit) || 25, 1), 100);
    const skip = (page - 1) * limit;
    const [data, totalRecords] = await Promise.all([
      this.findAll(filters, { skip, limit, sort: sortOption(pagination, { createdAt: -1 }) }),
      this.count(filters)
    ]);
    return { data, pagination: buildPagination(page, limit, totalRecords) };
  }

  async findWithContacts(id) {
    const company = await this.findById(id);
    if (!company) return null;

    if (this.isMemory()) {
      const contacts = await new BaseRepository(Contact).findAll({ companyId: id, isDeleted: false });
      return { ...company, contacts };
    }

    const contacts = await Contact.find({ companyId: id, isDeleted: false });
    return { ...company.toObject(), contacts };
  }

  async findWithJobs(id) {
    const company = await this.findById(id);
    if (!company) return null;

    if (this.isMemory()) {
      const jobs = await new BaseRepository(Job).findAll({ companyId: id, isDeleted: false });
      return { ...company, jobs };
    }

    const jobs = await Job.find({ companyId: id, isDeleted: false });
    return { ...company.toObject(), jobs };
  }

  async findFull(id) {
    const company = await this.findById(id);
    if (!company) return null;

    if (this.isMemory()) {
      const contactRepo = new BaseRepository(Contact);
      const jobRepo = new BaseRepository(Job);
      const scoreRepo = new BaseRepository(LeadScore);
      return {
        ...company,
        contacts: await contactRepo.findAll({ companyId: id, isDeleted: false }),
        jobs: await jobRepo.findAll({ companyId: id, isDeleted: false }),
        leadScore: await scoreRepo.findOne({ companyId: id })
      };
    }

    const [contacts, jobs, leadScore] = await Promise.all([
      Contact.find({ companyId: id, isDeleted: false }),
      Job.find({ companyId: id, isDeleted: false }),
      LeadScore.findOne({ companyId: id })
    ]);
    return { ...company.toObject(), contacts, jobs, leadScore };
  }
}

function buildPagination(page, limit, totalRecords) {
  const totalPages = Math.ceil(totalRecords / limit) || 1;
  return {
    page,
    limit,
    totalRecords,
    totalPages,
    hasNextPage: page < totalPages,
    hasPreviousPage: page > 1
  };
}

function sortOption(pagination, fallback) {
  if (!pagination.sort) return fallback;
  return { [pagination.sort]: pagination.order === 'asc' ? 1 : -1 };
}

module.exports = CompanyRepository;
