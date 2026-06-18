const OrganizationService = require('../services/OrganizationService');
const response = require('../utils/response');

async function invite(req, res) {
  try {
    const invitation = await OrganizationService.inviteMember(
      req.params.orgId || req.user.organizationId,
      req.body.invitedEmail,
      req.body.role,
      req.user._id
    );
    return response.success(res, invitation, 'Invitation sent', 201);
  } catch (error) {
    return response.error(res, error.message, 400);
  }
}

async function accept(req, res) {
  try {
    const result = await OrganizationService.acceptInvitation(req.body.token, req.user._id);
    return response.success(res, result, 'Invitation accepted');
  } catch (error) {
    return response.error(res, error.message, 400);
  }
}

async function list(req, res) {
  try {
    const members = await OrganizationService.listMembers(req.params.orgId || req.user.organizationId);
    return response.success(res, members, 'Team members retrieved');
  } catch (error) {
    return response.error(res, error.message, 400);
  }
}

async function updateRole(req, res) {
  try {
    const organization = await OrganizationService.updateMemberRole(
      req.params.orgId || req.user.organizationId,
      req.params.userId,
      req.body.role
    );
    return response.success(res, organization, 'Team member role updated');
  } catch (error) {
    return response.error(res, error.message, 400);
  }
}

async function remove(req, res) {
  try {
    const organization = await OrganizationService.removeMember(
      req.params.orgId || req.user.organizationId,
      req.params.userId,
      req.user._id
    );
    return response.success(res, organization, 'Team member removed');
  } catch (error) {
    return response.error(res, error.message, 400);
  }
}

module.exports = {
  accept,
  invite,
  list,
  remove,
  updateRole
};
