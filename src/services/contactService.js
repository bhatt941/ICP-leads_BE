const { ContactRepository, CompanyRepository, FilterOptionRepository } = require('../repositories');
const { verifyContactStrict, VerificationError, logVerificationFailure } = require('./verificationService');

function regex(value) {
  return value ? new RegExp(String(value).trim(), 'i') : undefined;
}

async function buildContactFilter(filters = {}) {
  const query = { isDeleted: false };
  
  if (filters.companyId) query.companyId = filters.companyId;
  if (filters.designation) query.designation = regex(filters.designation);
  if (filters.department) query.department = regex(filters.department);
  if (filters.seniority) query.seniority = filters.seniority;
  
  // If the frontend sends keywords, query name or companyName or designation
  if (filters.keywords) {
    query.$or = [
      { name: regex(filters.keywords) },
      { companyName: regex(filters.keywords) },
      { designation: regex(filters.keywords) }
    ];
  }

  // Location filter on contact location (or company location)
  if (filters.location) {
    query.location = regex(filters.location);
  }

  // LinkedIn URL filter
  if (filters.linkedinUrl) {
    query.linkedinUrl = regex(filters.linkedinUrl);
  }

  // Filter contacts by Company Industry or Sector (subIndustry)
  if (filters.industry || filters.sector) {
    const companyQuery = { isDeleted: false };
    if (filters.industry) companyQuery.industry = regex(filters.industry);
    if (filters.sector) {
      companyQuery.$or = [
        { industry: regex(filters.sector) },
        { subIndustry: regex(filters.sector) }
      ];
    }
    
    // Find matching companies
    const companies = await CompanyRepository.findAll(companyQuery, { projection: { _id: 1 } });
    const companyIds = companies.map(c => c._id);
    query.companyId = { $in: companyIds };
  }

  return query;
}

const sectorByIndustry = {
  "AI Software": "Technology",
  "SaaS": "Technology",
  "FinTech": "Financial Services",
  "Cybersecurity": "Technology",
  "Data Infrastructure": "Technology",
  "HealthTech": "Healthcare",
  "MarTech": "Commercial",
  "Cloud Services": "Technology",
  "E-commerce": "Consumer",
  "Logistics": "Operations",
  "Financial Services": "Financial Services"
};

function sectorForIndustry(industry) {
  return sectorByIndustry[industry] || "Other";
}

class ContactService {
  async createContact(data) {
    const company = await resolveContactCompany(data);
    const verification = await verifyContactStrict(data, company);
    if (!verification.isAccepted) {
      logVerificationFailure('Contact', data, verification.reasons);
      throw new VerificationError('Contact verification failed', verification);
    }

    if (data.linkedinUrl && await ContactRepository.findOne({ linkedinUrl: data.linkedinUrl, isDeleted: false })) {
      logVerificationFailure('Contact', data, ['Duplicate LinkedIn URL']);
      throw new VerificationError('Contact duplicate skipped', { reasons: ['Duplicate LinkedIn URL'], score: 0 });
    }

    const contact = await ContactRepository.create(withContactVerification(data, verification));
    await this.recordFilterOptions(contact);
    return contact;
  }

  getContactById(id) {
    return ContactRepository.findById(id);
  }

  async listContacts(filters = {}, pagination = {}) {
    const query = await buildContactFilter(filters);
    return ContactRepository.search(query, pagination);
  }

  async updateContact(id, data) {
    const existing = await ContactRepository.findById(id);
    if (!existing) return null;
    const merged = { ...toPlain(existing), ...data };
    const company = await resolveContactCompany(merged);
    const verification = await verifyContactStrict(merged, company);
    if (!verification.isAccepted) {
      logVerificationFailure('Contact', merged, verification.reasons);
      throw new VerificationError('Contact verification failed', verification);
    }

    const contact = await ContactRepository.updateById(id, withContactVerification(data, verification));
    if (contact) {
      await this.recordFilterOptions(contact);
    }
    return contact;
  }

  deleteContact(id, userId) {
    return ContactRepository.softDelete(id, userId);
  }

  async bulkInsert(contacts = []) {
    const results = [];
    for (const contact of contacts) {
      try {
        if (contact.linkedinUrl && await ContactRepository.findOne({ linkedinUrl: contact.linkedinUrl, isDeleted: false })) {
          logVerificationFailure('Contact', contact, ['Duplicate LinkedIn URL']);
          results.push({ skipped: true, reason: 'Duplicate LinkedIn URL', linkedinUrl: contact.linkedinUrl });
          continue;
        }

        const company = await resolveContactCompany(contact);
        const verification = await verifyContactStrict(contact, company);
        if (!verification.isAccepted) {
          logVerificationFailure('Contact', contact, verification.reasons);
          results.push({ skipped: true, reason: verification.reasons.join('; '), name: contact.name });
          continue;
        }

        const saved = await ContactRepository.create(withContactVerification(contact, verification));
        await this.recordFilterOptions(saved);
        results.push(saved);
      } catch (error) {
        const reason = error.details?.reasons?.join('; ') || error.message;
        logVerificationFailure('Contact', contact, [reason]);
        results.push({ skipped: true, reason, name: contact.name });
      }
    }
    return results;
  }

  async getFilterOptions() {
    let options = await FilterOptionRepository.findAll({});
    
    // Group them by key
    const grouped = {
      sector: [],
      industry: [],
      location: [],
      department: [],
      seniority: []
    };
    
    options.forEach(opt => {
      if (grouped[opt.key] && opt.value) {
        const val = String(opt.value).trim();
        if (val && !grouped[opt.key].includes(val)) {
          grouped[opt.key].push(val);
        }
      }
    });

    const isEmpty = Object.values(grouped).every(arr => arr.length === 0);
    if (isEmpty) {
      await this.syncFilterOptions();
      // Re-fetch
      options = await FilterOptionRepository.findAll({});
      options.forEach(opt => {
        if (grouped[opt.key] && opt.value) {
          const val = String(opt.value).trim();
          if (val && !grouped[opt.key].includes(val)) {
            grouped[opt.key].push(val);
          }
        }
      });
    }
    
    return grouped;
  }

  async recordFilterOptions(contact) {
    if (!contact) return;
    
    if (contact.department) {
      await this.recordFilterOption('department', contact.department);
    }
    if (contact.seniority && contact.seniority !== 'unknown') {
      await this.recordFilterOption('seniority', contact.seniority);
    }
    if (contact.location) {
      await this.recordFilterOption('location', contact.location);
    }

    let company = null;
    if (contact.companyId) {
      company = await CompanyRepository.findById(contact.companyId);
    }

    if (company) {
      if (company.industry) {
        await this.recordFilterOption('industry', company.industry);
        const sector = company.sector || company.subIndustry || sectorForIndustry(company.industry);
        if (sector) {
          await this.recordFilterOption('sector', sector);
        }
      }
      if (company.country) {
        await this.recordFilterOption('location', company.country);
      }
      if (company.location) {
        await this.recordFilterOption('location', company.location);
      }
    } else if (contact.companyName) {
      company = await CompanyRepository.findOne({ name: new RegExp('^' + contact.companyName.trim() + '$', 'i') });
      if (company) {
        if (company.industry) {
          await this.recordFilterOption('industry', company.industry);
          const sector = company.sector || company.subIndustry || sectorForIndustry(company.industry);
          if (sector) {
            await this.recordFilterOption('sector', sector);
          }
        }
        if (company.country) {
          await this.recordFilterOption('location', company.country);
        }
      }
    }
  }

  async recordFilterOption(key, value) {
    if (!value) return;
    const trimmed = String(value).trim();
    if (!trimmed) return;
    try {
      const exists = await FilterOptionRepository.findOne({ key, value: trimmed });
      if (!exists) {
        await FilterOptionRepository.create({ key, value: trimmed });
      }
    } catch (err) {
      // Ignore errors (e.g. duplicate keys)
    }
  }

  async syncFilterOptions() {
    const contacts = await ContactRepository.findAll({ isDeleted: false });
    const companies = await CompanyRepository.findAll({ isDeleted: false });

    for (const c of contacts) {
      if (c.department) await this.recordFilterOption('department', c.department);
      if (c.seniority && c.seniority !== 'unknown') await this.recordFilterOption('seniority', c.seniority);
      if (c.location) await this.recordFilterOption('location', c.location);
    }

    for (const comp of companies) {
      if (comp.industry) {
        await this.recordFilterOption('industry', comp.industry);
        const sector = comp.sector || comp.subIndustry || sectorForIndustry(comp.industry);
        if (sector) {
          await this.recordFilterOption('sector', sector);
        }
      }
      if (comp.country) await this.recordFilterOption('location', comp.country);
      if (comp.location) await this.recordFilterOption('location', comp.location);
    }

    const defaultSeniorities = ['c_level', 'vp', 'director', 'manager', 'senior', 'mid', 'junior'];
    for (const s of defaultSeniorities) {
      await this.recordFilterOption('seniority', s);
    }
  }
}

async function resolveContactCompany(contact) {
  if (contact.companyId) {
    const company = await CompanyRepository.findById(contact.companyId);
    if (company) return company;
  }
  if (contact.companyName) {
    const company = await CompanyRepository.findOne({ companyName: new RegExp('^' + escapeRegex(contact.companyName.trim()) + '$', 'i'), isDeleted: false });
    if (company) return company;
  }
  throw new VerificationError('Contact company dependency missing', { reasons: ['Contact company dependency missing'], score: 0 });
}

function withContactVerification(data, verification) {
  return {
    ...data,
    confidenceScore: verification.score,
    confidence_score: verification.score,
    verificationSource: verification.sources?.join(', ') || undefined,
    verification_sources: verification.sources || [],
    verificationStatus: verification.status,
    verificationReasons: verification.reasons || [],
    isLowConfidence: Boolean(verification.isLowConfidence)
  };
}

function escapeRegex(value) {
  return String(value).replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

function toPlain(value) {
  return typeof value.toObject === 'function' ? value.toObject() : value;
}

module.exports = new ContactService();
