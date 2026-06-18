const { createWorker } = require('./workerUtils');
const CompanyService = require('../services/CompanyService');
const { ContactRepository, JobRepository, LeadScoreRepository } = require('../repositories');
const logger = require('../utils/logger');

const worker = createWorker('lead-scoring', async (job) => {
  logger.info('Processing lead scoring job', job.data);
  const { companyId } = job.data;
  const company = await CompanyService.getCompanyById(companyId);
  if (!company) return null;

  const contacts = await ContactRepository.findByCompany(companyId);
  const jobs = await JobRepository.findByCompany(companyId);
  const technologyStack = (company.technologyStack || []).map((item) => String(item).toLowerCase());

  const signals = {
    ceoFound: contacts.some((contact) => /ceo|chief executive/i.test(contact.designation || '')),
    ctoFound: contacts.some((contact) => /cto|chief technology/i.test(contact.designation || '')),
    hiringEngineers: jobs.some((job) => /engineer/i.test(job.title || '')),
    hiringAiTalent: jobs.some((job) => /(\bai\b|\bml\b|machine learning)/i.test(`${job.title || ''} ${job.description || ''}`)),
    usesAws: technologyStack.includes('aws'),
    usesSalesforce: technologyStack.includes('salesforce'),
    usesHubspot: technologyStack.includes('hubspot'),
    activeCareerPage: Boolean(company.careersUrl),
    largeHeadcount: Number(company.headcount || 0) > 200
  };

  const totalScore = calculateScore(signals);
  const grade = gradeScore(totalScore);
  const scores = {
    hiringScore: (signals.hiringEngineers ? 20 : 0) + (signals.hiringAiTalent ? 25 : 0),
    growthScore: signals.largeHeadcount ? 10 : 0,
    technologyScore: (signals.usesAws ? 10 : 0) + (signals.usesSalesforce ? 10 : 0) + (signals.usesHubspot ? 10 : 0),
    decisionMakerScore: (signals.ceoFound ? 15 : 0) + (signals.ctoFound ? 15 : 0),
    totalScore
  };

  const existing = await LeadScoreRepository.findOne({ companyId });
  const leadScore = existing
    ? await LeadScoreRepository.updateById(existing._id, { signals, scores, grade, gradedAt: new Date() })
    : await LeadScoreRepository.create({ companyId, signals, scores, grade, gradedAt: new Date() });

  await CompanyService.updateCompany(companyId, { leadScore: totalScore, leadGrade: grade });
  return leadScore;
});

function calculateScore(signals) {
  return [
    signals.ceoFound ? 15 : 0,
    signals.ctoFound ? 15 : 0,
    signals.hiringEngineers ? 20 : 0,
    signals.hiringAiTalent ? 25 : 0,
    signals.usesAws ? 10 : 0,
    signals.usesSalesforce ? 10 : 0,
    signals.usesHubspot ? 10 : 0,
    signals.activeCareerPage ? 5 : 0,
    signals.largeHeadcount ? 10 : 0
  ].reduce((sum, value) => sum + value, 0);
}

function gradeScore(score) {
  if (score >= 80) return 'A';
  if (score >= 60) return 'B';
  if (score >= 40) return 'C';
  return 'D';
}

module.exports = worker;
