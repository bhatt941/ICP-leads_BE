const BaseRepository = require('./BaseRepository');
const { Contact } = require('../models');

class ContactRepository extends BaseRepository {
  constructor() {
    super(Contact);
  }

  findByCompany(companyId) {
    return this.findAll({ companyId, isDeleted: false });
  }

  async bulkUpsert(contacts = []) {
    const results = [];
    for (const contact of contacts) {
      const existing = contact.linkedinUrl
        ? await this.findOne({ linkedinUrl: contact.linkedinUrl })
        : null;
      results.push(existing ? await this.updateById(existing._id, contact) : await this.create(contact));
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
}

function buildPagination(page, limit, totalRecords) {
  const totalPages = Math.ceil(totalRecords / limit) || 1;
  return { page, limit, totalRecords, totalPages, hasNextPage: page < totalPages, hasPreviousPage: page > 1 };
}

function sortOption(pagination, fallback) {
  if (!pagination.sort) return fallback;
  return { [pagination.sort]: pagination.order === 'asc' ? 1 : -1 };
}

module.exports = ContactRepository;
