const { createWorker } = require('./workerUtils');
const ContactService = require('../services/ContactService');
const { queueLeadScoring } = require('../queues/producers');
const { parseLeadershipPage } = require('../scrapers/people/leadershipParser');
const { searchDecisionMakers } = require('../scrapers/people/searchPeople');
const { CompanyRepository, AuditRepository } = require('../repositories');
const { verifyContactWithAi, verifyCompanyRequirements } = require('../services/verificationService');
const logger = require('../utils/logger');

const worker = createWorker('people-discovery', async (job) => {
  logger.info('Processing people discovery job', job.data);
  const { companyId, companyName, website } = job.data;

  const company = await CompanyRepository.findById(companyId);
  if (!company) {
    logger.warn('Company not found for people discovery', { companyId });
    return { contacts: 0 };
  }

  const searched = await searchDecisionMakers(companyName, website);
  const leadershipUrls = [website && new URL('/team', website).toString(), website && new URL('/leadership', website).toString()].filter(Boolean);
  const parsed = [];
  for (const pageUrl of leadershipUrls) {
    parsed.push(...await parseLeadershipPage(pageUrl, companyName));
  }

  const rawContacts = [...searched, ...parsed];
  const verifiedContacts = [];

  for (const rawContact of rawContacts) {
    const contactData = { ...rawContact, companyId, companyName };
    const verification = await verifyContactWithAi(contactData, company);
    
    // Save to Audit Collection
    try {
      await AuditRepository.create({
        organizationId: company.organizationId,
        sourceUrl: rawContact.linkedinUrl || rawContact.sourceUrl || website || 'unknown',
        verificationSource: verification.verificationSource || 'None',
        confidenceScore: verification.confidenceScore,
        entityType: 'Contact',
        entityId: companyId,
        metadata: {
          contactName: rawContact.name,
          designation: rawContact.designation,
          reason: verification.reason
        }
      });
    } catch (auditErr) {
      logger.warn('Failed to save audit log', { error: auditErr.message });
    }

    if (verification.confidenceScore >= 85) {
      contactData.confidenceScore = verification.confidenceScore;
      contactData.verificationSource = verification.verificationSource;
      verifiedContacts.push(contactData);
    }
  }

  if (verifiedContacts.length > 0) {
    await ContactService.bulkInsert(verifiedContacts);
  }

  // Evaluate company requirements
  const allContactsForCompany = await ContactService.listContacts({ companyId }, { limit: 100 });
  const allExistingContacts = allContactsForCompany.contacts || [];
  const combinedContacts = [...allExistingContacts, ...verifiedContacts];

  const meetsRequirements = verifyCompanyRequirements(company, combinedContacts);
  if (!meetsRequirements) {
    logger.info('Discarding company due to incomplete details or lack of decision maker.', { companyName });
    await CompanyRepository.softDelete(companyId);
    for (const c of allExistingContacts) {
      await ContactService.deleteContact(c._id);
    }
    return { contacts: 0, status: 'discarded' };
  } else {
    const avgScore = verifiedContacts.length > 0 
      ? Math.round(verifiedContacts.reduce((acc, c) => acc + c.confidenceScore, 0) / verifiedContacts.length)
      : 85;
    await CompanyRepository.updateById(companyId, {
      confidenceScore: avgScore,
      verificationSource: 'LinkedIn & AI Verification'
    });
  }

  await queueLeadScoring(companyId);
  return { contacts: verifiedContacts.length };
});

module.exports = worker;
