const OrganizationService = require('../services/OrganizationService');
const response = require('../utils/response');

async function create(req, res) {
  try {
    const organization = await OrganizationService.createOrganization(req.body);
    return response.success(res, organization, 'Organization created', 201);
  } catch (error) {
    return response.error(res, error.message, 400);
  }
}

async function getById(req, res) {
  try {
    const organization = await OrganizationService.getById(req.params.id);
    if (!organization) return response.error(res, 'Organization not found', 404);
    return response.success(res, organization, 'Organization retrieved');
  } catch (error) {
    return response.error(res, error.message, 400);
  }
}

async function update(req, res) {
  try {
    const organization = await OrganizationService.update(req.params.id, req.body);
    if (!organization) return response.error(res, 'Organization not found', 404);
    return response.success(res, organization, 'Organization updated');
  } catch (error) {
    return response.error(res, error.message, 400);
  }
}

async function removeMember(req, res) {
  try {
    const organization = await OrganizationService.removeMember(req.params.id, req.params.userId, req.user._id);
    return response.success(res, organization, 'Member removed');
  } catch (error) {
    return response.error(res, error.message, 400);
  }
}

async function updateMemberRole(req, res) {
  try {
    const organization = await OrganizationService.updateMemberRole(req.params.id, req.params.userId, req.body.role);
    return response.success(res, organization, 'Member role updated');
  } catch (error) {
    return response.error(res, error.message, 400);
  }
}

module.exports = {
  create,
  getById,
  removeMember,
  update,
  updateMemberRole
};
