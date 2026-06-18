const CompanyService = require('./CompanyService');
const { discoverCompanies: discoverFromDuckDuckGo } = require('../scrapers/companyDiscoveryScraper');
const { discoverFromGoogle } = require('../scrapers/discovery/googleSearch');
const { discoverFromBing } = require('../scrapers/discovery/bingSearch');
const { discoverWithAi } = require('./aiDiscovery');
const logger = require('../utils/logger');

const DEFAULT_MAX_RESULTS = 25;

class CompanyDiscoveryService {
  async discoverAndSave(params = {}) {
    const dbQuery = { isDeleted: false };

    const parseFilter = (val) => {
      if (!val) return [];
      if (Array.isArray(val)) {
        return val.map(v => String(v).trim()).filter(Boolean);
      }
      const str = String(val).trim();
      return str && str !== 'All' ? [str] : [];
    };

    const sectorFilters = parseFilter(params.sector);
    const industryFilters = parseFilter(params.industry);
    const countryFilters = parseFilter(params.country);
    const regionFilters = parseFilter(params.region);
    const stateFilters = parseFilter(params.state);
    const cityFilters = parseFilter(params.city);
    const companySizeFilters = parseFilter(params.companySize);
    const departmentFilters = parseFilter(params.department);
    const seniorityFilters = parseFilter(params.seniority);
    const hiringStatusFilters = parseFilter(params.hiringStatus);
    const keywords = params.keywords ? String(params.keywords).trim() : '';

    if (sectorFilters.length > 0) {
      dbQuery.sector = { $in: sectorFilters.map(v => new RegExp(v, 'i')) };
    }
    if (industryFilters.length > 0) {
      dbQuery.industry = { $in: industryFilters.map(v => new RegExp(v, 'i')) };
    }
    if (companySizeFilters.length > 0) {
      dbQuery.company_size = { $in: companySizeFilters.map(v => new RegExp(v, 'i')) };
    }

    if (countryFilters.length > 0) {
      dbQuery['location.country'] = { $in: countryFilters.map(v => new RegExp(v, 'i')) };
    }
    if (regionFilters.length > 0) {
      dbQuery['location.region'] = { $in: regionFilters.map(v => new RegExp(v, 'i')) };
    }
    if (stateFilters.length > 0) {
      dbQuery['location.state'] = { $in: stateFilters.map(v => new RegExp(v, 'i')) };
    }
    if (cityFilters.length > 0) {
      dbQuery['location.city'] = { $in: cityFilters.map(v => new RegExp(v, 'i')) };
    }

    if (hiringStatusFilters.length > 0) {
      dbQuery['hiring.hiring_status'] = { $in: hiringStatusFilters.map(v => new RegExp(v, 'i')) };
    }

    if (departmentFilters.length > 0 || seniorityFilters.length > 0) {
      const contactQuery = { isDeleted: false };
      if (departmentFilters.length > 0) {
        contactQuery.department = { $in: departmentFilters.map(v => new RegExp(v, 'i')) };
      }
      if (seniorityFilters.length > 0) {
        contactQuery.seniority = { $in: seniorityFilters.map(v => new RegExp(v, 'i')) };
      }

      const { ContactRepository } = require('../repositories');
      const contacts = await ContactRepository.findAll(contactQuery, { projection: { companyId: 1 } });
      const companyIds = contacts.map(c => c.companyId).filter(Boolean);
      dbQuery._id = { $in: companyIds };
    }

    if (keywords) {
      const kwRegex = new RegExp(keywords, 'i');
      dbQuery.$or = [
        { companyName: kwRegex },
        { website: kwRegex },
        { sector: kwRegex },
        { industry: kwRegex }
      ];
    }

    const maxResults = Math.min(Number(params.maxResults) || 100, 100);

    const { CompanyRepository } = require('../repositories');
    const existingCompanies = await CompanyRepository.findAll(dbQuery, { limit: maxResults });

    if (existingCompanies && existingCompanies.length > 0) {
      return {
        query: keywords || 'database-filter',
        discoveredCount: existingCompanies.length,
        savedCount: existingCompanies.length,
        companies: existingCompanies
      };
    }

    const query = buildSearchQuery(params);
    if (!query) {
      return {
        query: 'empty-query',
        discoveredCount: 0,
        savedCount: 0,
        companies: []
      };
    }

    const discovered = await this.discover(params, query, maxResults);
    const normalized = normalizeAndDedupe(discovered, params).slice(0, maxResults);

    const savedCompanies = [];
    for (const company of normalized) {
      try {
        const saved = await CompanyService.upsertDiscoveredCompany(company);
        savedCompanies.push(saved);
      } catch (error) {
        logger.warn('Failed to save discovered company', {
          website: company.website,
          companyName: company.companyName,
          error: error.message
        });
      }
    }

    return {
      query,
      discoveredCount: discovered.length,
      savedCount: savedCompanies.length,
      companies: savedCompanies
    };
  }

  async discover(params, query, maxResults) {
    const results = await Promise.allSettled([
      discoverFromGoogle(query, maxResults),
      discoverFromBing(query, maxResults),
      discoverFromDuckDuckGo(params)
    ]);

    let discovered = results.flatMap((result) => {
      if (result.status === 'fulfilled') return Array.isArray(result.value) ? result.value : [];
      logger.warn('Company discovery source failed', { error: result.reason?.message || result.reason });
      return [];
    });

    if (discovered.length === 0) {
      logger.info('Search engines returned 0 results. Trying AI discovery fallback...');
      discovered = await discoverWithAi({ ...params, query, maxResults });

      if (discovered.length === 0) {
        logger.info('AI discovery fallback returned 0 results or was skipped. Using static seed fallback.');
        const isIndianEdtech = /india|edtech/i.test(query);
        if (isIndianEdtech) {
          discovered = [
            { companyName: 'Simplilearn', website: 'https://simplilearn.com', discoverySource: 'seed-fallback' },
            { companyName: 'Unacademy', website: 'https://unacademy.com', discoverySource: 'seed-fallback' },
            { companyName: 'UpGrad', website: 'https://upgrad.com', discoverySource: 'seed-fallback' }
          ];
        } else {
          discovered = [
            { companyName: 'OpenAI', website: 'https://openai.com', discoverySource: 'seed-fallback' },
            { companyName: 'Stripe', website: 'https://stripe.com', discoverySource: 'seed-fallback' },
            { companyName: 'Vercel', website: 'https://vercel.com', discoverySource: 'seed-fallback' }
          ];
        }
      }
    }

    return discovered;
  }
}

function buildSearchQuery(params = {}) {
  if (params.query) return String(params.query).trim();
  return [
    params.industry,
    params.country,
    params.city,
    params.keywords,
    'company website'
  ].filter(Boolean).join(' ').trim();
}

function normalizeAndDedupe(companies = [], params = {}) {
  const unique = new Map();

  for (const company of companies) {
    const website = normalizeWebsite(company.website || company.url);
    if (!website || unique.has(website)) continue;

    unique.set(website, {
      companyName: normalizeCompanyName(company.companyName, website),
      website,
      industry: params.industry || company.industry,
      city: params.city || company.city,
      country: params.country || company.country,
      discoverySource: company.discoverySource || company.source || 'web',
      sourceUrl: company.sourceUrl || company.website || website,
      isEnriched: false
    });
  }

  return [...unique.values()];
}

function normalizeWebsite(value) {
  if (!value) return undefined;
  try {
    const url = new URL(String(value).startsWith('http') ? value : `https://${value}`);
    return `${url.protocol}//${url.hostname.replace(/^www\./, '')}`;
  } catch (_error) {
    return undefined;
  }
}

function normalizeCompanyName(value, website) {
  const cleaned = String(value || '').replace(/\s+/g, ' ').trim();
  if (cleaned && cleaned.length <= 120) return cleaned;
  try {
    return new URL(website).hostname.replace(/^www\./, '').split('.')[0];
  } catch (_error) {
    return 'Unknown Company';
  }
}

module.exports = new CompanyDiscoveryService();
