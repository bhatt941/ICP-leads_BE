const BaseRepository = require('../repositories/BaseRepository');
const { AuditLog } = require('../models');

const auditRepo = new BaseRepository(AuditLog);

class AuditService {
  log(userId, orgId, action, collection, recordId, ip, metadata = {}) {
    return auditRepo.create({
      userId,
      organizationId: orgId,
      action,
      collection,
      recordId,
      ipAddress: ip,
      metadata
    });
  }

  async getLogs(orgId, filters = {}, pagination = {}) {
    const page = Math.max(Number(pagination.page) || 1, 1);
    const limit = Math.min(Math.max(Number(pagination.limit) || 20, 1), 100);
    const filter = { organizationId: orgId };
    if (filters.action) filter.action = filters.action;
    if (filters.userId) filter.userId = filters.userId;
    if (filters.collection) filter.collection = filters.collection;

    const [data, totalRecords] = await Promise.all([
      auditRepo.findAll(filter, { skip: (page - 1) * limit, limit, sort: { createdAt: -1 } }),
      auditRepo.count(filter)
    ]);

    const totalPages = Math.ceil(totalRecords / limit) || 1;
    return {
      data,
      pagination: {
        page,
        limit,
        totalRecords,
        totalPages,
        hasNextPage: page < totalPages,
        hasPreviousPage: page > 1
      }
    };
  }
}

module.exports = new AuditService();
