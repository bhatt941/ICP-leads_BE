const {
  CompanyRepository,
  ContactRepository,
  JobRepository,
  LeadScoreRepository
} = require('../repositories');
const redisClient = require('../config/redis');
const { verifyCompanyStrict, VerificationError, logVerificationFailure } = require('./verificationService');

const CACHE_TTL_SECONDS = 300;

function regex(value) {
  return value ? new RegExp(String(value).trim(), 'i') : undefined;
}

function parseList(value) {
  if (!value) return undefined;
  return String(value).split(',').map((item) => item.trim()).filter(Boolean);
}

function buildCompanyFilter(filters = {}) {
  const query = { isDeleted: false };
  if (filters.industry) query.industry = regex(filters.industry);
  if (filters.country) query.country = regex(filters.country);
  if (filters.city) query.city = regex(filters.city);
  if (filters.hiringStatus) query.hiringStatus = filters.hiringStatus;
  if (filters.headcountMin || filters.headcountMax) {
    query.headcount = {};
    if (filters.headcountMin) query.headcount.$gte = Number(filters.headcountMin);
    if (filters.headcountMax) query.headcount.$lte = Number(filters.headcountMax);
  }
  const technologyStack = parseList(filters.technologyStack);
  if (technologyStack?.length) query.technologyStack = { $in: technologyStack.map(regex) };
  if (filters.keywords) query.companyName = regex(filters.keywords);
  return query;
}

class CompanyService {
  async createCompany(data) {
    const verification = await verifyCompanyStrict(data);
    if (!verification.isAccepted) {
      logVerificationFailure('Company', data, verification.reasons);
      throw new VerificationError('Company verification failed', verification);
    }

    if (data.website && await CompanyRepository.findByWebsite(data.website)) {
      throw new Error('Company website already exists');
    }
    if (data.linkedinCompanyUrl && await CompanyRepository.findByLinkedin(data.linkedinCompanyUrl)) {
      throw new Error('Company LinkedIn URL already exists');
    }
    return CompanyRepository.create(withCompanyVerification(data, verification));
  }

  getCompanyById(id) {
    return CompanyRepository.findById(id);
  }

  listCompanies(filters = {}, pagination = {}) {
    return CompanyRepository.search(buildCompanyFilter(filters), pagination);
  }

  searchCompanies(body = {}) {
    return this.listCompanies(body.filters || body, body.pagination || body);
  }

  async updateCompany(id, data) {
    const existing = await CompanyRepository.findById(id);
    if (!existing) return null;
    const merged = { ...toPlain(existing), ...data };
    const verification = await verifyCompanyStrict(merged);
    if (!verification.isAccepted) {
      logVerificationFailure('Company', merged, verification.reasons);
      throw new VerificationError('Company verification failed', verification);
    }

    return CompanyRepository.updateById(id, withCompanyVerification(data, verification)).then(async (company) => {
      await invalidateCompanyCache(id);
      return company;
    });
  }

  deleteCompany(id, userId) {
    return CompanyRepository.softDelete(id, userId).then(async (company) => {
      await invalidateCompanyCache(id);
      return company;
    });
  }

  async getCompanyFull(id) {
    const cached = await getCachedCompany(id);
    if (cached) return cached;

    const company = await CompanyRepository.findById(id);
    if (!company) return null;
    const [contacts, jobs, leadScore] = await Promise.all([
      ContactRepository.findByCompany(id),
      JobRepository.findByCompany(id),
      LeadScoreRepository.findOne({ companyId: id })
    ]);
    const result = { ...toPlain(company), contacts, jobs, leadScore };
    await cacheCompany(id, result);
    return result;
  }

  async bulkInsert(companies = []) {
    const results = [];
    const verifications = await Promise.all(companies.map((company) => verifyCompanyStrict(company)));
    for (let i = 0; i < companies.length; i += 1) {
      const company = companies[i];
      const verification = verifications[i];
      if (!verification.isAccepted) {
        logVerificationFailure('Company', company, verification.reasons);
        results.push({ skipped: true, reason: verification.reasons.join('; '), companyName: company.companyName });
        continue;
      }
      results.push(await CompanyRepository.upsertByWebsite(withCompanyVerification(company, verification)));
    }
    return results;
  }

  async upsertDiscoveredCompany(data) {
    const verification = await verifyCompanyStrict(data);
    if (!verification.isAccepted) {
      logVerificationFailure('Company', data, verification.reasons);
      throw new VerificationError('Company verification failed', verification);
    }

    return CompanyRepository.upsertByWebsite({
      ...data,
      ...verificationFields(verification),
      isDeleted: false
    });
  }

  async getApolloCompanyInfo(id, companyId = null) {
    const { getOrganizationInfoWithApollo } = require('./aiDiscovery');
    const apolloData = await getOrganizationInfoWithApollo(id);
    const org = apolloData?.organization || {};

    let savedCompany = null;
    if (companyId && org.name) {
      const updates = {
        companyName: org.name,
        website: org.primary_domain || org.website_url || undefined,
        linkedinCompanyUrl: org.linkedin_url || undefined,
        foundedYear: org.founded_year || undefined,
        address: org.raw_address || org.street_address || undefined,
        city: org.city || undefined,
        state: org.state || undefined,
        country: org.country || undefined,
        description: org.short_description || undefined,
        employee_count: org.estimated_num_employees || 0,
        headcount: org.estimated_num_employees || 0,
        industry: org.industry || undefined,
        technologyStack: org.technology_names || [],
        isEnriched: true
      };

      savedCompany = await CompanyRepository.updateById(companyId, updates);
      await invalidateCompanyCache(companyId);
    }

    return {
      organization: org,
      savedCompany
    };
  }
}

function withCompanyVerification(data, verification) {
  return {
    ...data,
    ...verificationFields(verification)
  };
}

function verificationFields(verification) {
  return {
    confidenceScore: verification.score,
    verificationSource: verification.sources?.join(', ') || undefined,
    verificationStatus: verification.status,
    verificationReasons: verification.reasons || [],
    isLowConfidence: Boolean(verification.isLowConfidence)
  };
}

async function getCachedCompany(id) {
  try {
    const cached = await redisClient.get(`company:${id}`);
    return cached ? JSON.parse(cached) : null;
  } catch (_error) {
    return null;
  }
}

async function cacheCompany(id, data) {
  try {
    if (typeof redisClient.setex === 'function') {
      await redisClient.setex(`company:${id}`, CACHE_TTL_SECONDS, JSON.stringify(data));
    } else {
      await redisClient.set(`company:${id}`, JSON.stringify(data), 'EX', CACHE_TTL_SECONDS);
    }
  } catch (_error) {}
}

async function invalidateCompanyCache(id) {
  try {
    await redisClient.del(`company:${id}`);
  } catch (_error) {}
}

function toPlain(value) {
  return typeof value.toObject === 'function' ? value.toObject() : value;
}

module.exports = new CompanyService();
