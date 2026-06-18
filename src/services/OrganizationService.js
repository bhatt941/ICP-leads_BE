const BaseRepository = require('../repositories/BaseRepository');
const { Organization, TeamInvitation } = require('../models');
const { UserRepository } = require('../repositories');
const { generateRandomToken } = require('../utils/tokenUtils');
const { sendTeamInviteEmail } = require('../utils/emailUtils');

const organizationRepo = new BaseRepository(Organization);
const invitationRepo = new BaseRepository(TeamInvitation);

class OrganizationService {
  createOrganization(data) {
    return organizationRepo.create({
      ...data,
      slug: data.slug || slugify(data.name)
    });
  }

  getById(id) {
    return organizationRepo.findById(id);
  }

  update(id, data) {
    return organizationRepo.updateById(id, data);
  }

  async inviteMember(orgId, invitedEmail, role, invitedByUserId) {
    const organization = await organizationRepo.findById(orgId);
    if (!organization) throw new Error('Organization not found');

    const token = generateRandomToken();
    const invitation = await invitationRepo.create({
      organizationId: orgId,
      invitedEmail: String(invitedEmail || '').toLowerCase(),
      role,
      token,
      invitedBy: invitedByUserId,
      expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
      isAccepted: false
    });

    await sendTeamInviteEmail(invitedEmail, token, organization.name, role);
    return invitation;
  }

  async acceptInvitation(token, userId) {
    const invitation = await invitationRepo.findOne({ token });
    if (!invitation || invitation.isAccepted || new Date(invitation.expiresAt).getTime() < Date.now()) {
      throw new Error('Invalid or expired invitation');
    }

    const organization = await organizationRepo.findById(invitation.organizationId);
    if (!organization) throw new Error('Organization not found');

    const members = normalizeMembers(organization.members);
    if (!members.some((member) => String(member.userId) === String(userId))) {
      members.push({ userId, role: invitation.role, joinedAt: new Date() });
    }

    await organizationRepo.updateById(organization._id, { members });
    await invitationRepo.updateById(invitation._id, { isAccepted: true });
    await UserRepository.updateById(userId, { organizationId: organization._id, role: invitation.role });
    return { organization: await organizationRepo.findById(organization._id), invitation };
  }

  async removeMember(orgId, userId, _removedByUserId) {
    const organization = await organizationRepo.findById(orgId);
    if (!organization) throw new Error('Organization not found');
    const members = normalizeMembers(organization.members).filter((member) => String(member.userId) !== String(userId));
    await organizationRepo.updateById(orgId, { members });
    await UserRepository.updateById(userId, { organizationId: null });
    return organizationRepo.findById(orgId);
  }

  async updateMemberRole(orgId, userId, newRole) {
    const organization = await organizationRepo.findById(orgId);
    if (!organization) throw new Error('Organization not found');
    const members = normalizeMembers(organization.members).map((member) =>
      String(member.userId) === String(userId) ? { ...member, role: newRole } : member
    );
    await organizationRepo.updateById(orgId, { members });
    await UserRepository.updateById(userId, { role: newRole });
    return organizationRepo.findById(orgId);
  }

  async listMembers(orgId) {
    const organization = await organizationRepo.findById(orgId);
    if (!organization) throw new Error('Organization not found');
    return normalizeMembers(organization.members);
  }
}

function normalizeMembers(members = []) {
  return Array.isArray(members) ? members.map((member) => (typeof member.toObject === 'function' ? member.toObject() : member)) : [];
}

function slugify(value = '') {
  return String(value || 'organization')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '') || `org-${Date.now()}`;
}

module.exports = new OrganizationService();
