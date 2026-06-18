const BaseRepository = require('../repositories/BaseRepository');
const { SavedLead } = require('../models');
const { CompanyRepository, ContactRepository } = require('../repositories');
const { verifyLeadStrict, VerificationError, logVerificationFailure } = require('./verificationService');

const savedLeadRepo = new BaseRepository(SavedLead);

class SavedLeadService {
  async list(userId, query = {}) {
    const page = Number(query.page || 1);
    const limit = Math.min(Number(query.limit || 25), 100);
    const filters = { userId, isDeleted: false, ...query };

    delete filters.page;
    delete filters.limit;

    const data = await savedLeadRepo.findAll(filters, { sort: { createdAt: -1 }, skip: (page - 1) * limit, limit });
    const totalRecords = await savedLeadRepo.count(filters);

    return {
      data,
      pagination: {
        currentPage: page,
        totalPages: Math.max(1, Math.ceil(totalRecords / limit)),
        totalRecords,
        hasNextPage: page * limit < totalRecords,
        hasPreviousPage: page > 1
      }
    };
  }

  async create(data) {
    const { company, contact } = await resolveLeadDependencies(data);
    const verification = await verifyLeadStrict(data, company, contact);
    if (!verification.isAccepted) {
      logVerificationFailure('Lead', data, verification.reasons);
      throw new VerificationError('Lead verification failed', verification);
    }

    const duplicate = await savedLeadRepo.findOne({
      userId: data.userId,
      companyId: company._id,
      linkedinUrl: contact.linkedinUrl,
      isDeleted: false
    });
    if (duplicate) {
      logVerificationFailure('Lead', data, ['Duplicate lead for company and LinkedIn URL']);
      throw new VerificationError('Lead duplicate skipped', { reasons: ['Duplicate lead for company and LinkedIn URL'], score: 0 });
    }

    return savedLeadRepo.create({
      ...data,
      companyId: company._id,
      companyName: company.companyName,
      website: company.website,
      linkedinUrl: contact.linkedinUrl,
      executiveName: contact.name,
      designation: contact.designation,
      confidenceScore: verification.score,
      verificationStatus: verification.status,
      verificationReasons: verification.reasons || [],
      isLowConfidence: Boolean(verification.isLowConfidence),
      saved: Boolean(data.saved),
      favorite: Boolean(data.favorite),
      archived: Boolean(data.archived),
      tags: Array.isArray(data.tags) ? data.tags : []
    });
  }

  async update(id, userId, data) {
    const existing = await savedLeadRepo.findById(id);
    if (!existing || String(existing.userId) !== String(userId)) throw new Error('Saved lead not found');
    return savedLeadRepo.updateById(id, { ...data, updatedAt: new Date() });
  }

  async remove(id, userId) {
    const existing = await savedLeadRepo.findById(id);
    if (!existing || String(existing.userId) !== String(userId)) throw new Error('Saved lead not found');
    return savedLeadRepo.updateById(id, { isDeleted: true, archived: true, updatedAt: new Date() });
  }
}

async function resolveLeadDependencies(data) {
  const company = data.companyId
    ? await CompanyRepository.findById(data.companyId)
    : await CompanyRepository.findOne({ website: data.website, companyName: data.companyName, isDeleted: false });

  if (!company) {
    throw new VerificationError('Lead company dependency missing', { reasons: ['Lead company dependency missing'], score: 0 });
  }

  const contactQuery = data.contactId
    ? { _id: data.contactId, isDeleted: false }
    : { linkedinUrl: data.linkedinUrl, isDeleted: false };
  const contact = data.contactId
    ? await ContactRepository.findById(data.contactId)
    : await ContactRepository.findOne(contactQuery);

  if (!contact || String(contact.companyId) !== String(company._id)) {
    throw new VerificationError('Lead contact dependency missing or mismatched', { reasons: ['Lead contact dependency missing or mismatched'], score: 0 });
  }

  return { company, contact };
}

module.exports = new SavedLeadService();
