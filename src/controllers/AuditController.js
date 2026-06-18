const AuditService = require('../services/AuditService');
const response = require('../utils/response');

async function list(req, res) {
  try {
    const result = await AuditService.getLogs(req.user.organizationId, req.query, req.query);
    return response.success(res, result.data, 'Audit logs retrieved', 200, result.pagination);
  } catch (error) {
    return response.error(res, error.message, 400);
  }
}

module.exports = {
  list
};
