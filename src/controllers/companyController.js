const CompanyService = require('../services/CompanyService');
const CompanyDiscoveryService = require('../services/CompanyDiscoveryService');
const ExportService = require('../services/ExportService');
const { queueCompanyDiscovery } = require('../queues/producers');
const { crawlWebsite } = require('../scrapers/crawlers/websiteCrawler');
const response = require('../utils/response');
const { getFilters, getPagination } = require('./controllerUtils');

async function list(req, res) {
  try {
    const result = await CompanyService.listCompanies(getFilters(req.query), getPagination(req.query));
    return response.success(res, result.data, 'Companies retrieved', 200, result.pagination);
  } catch (error) {
    return response.error(res, error.message, 400);
  }
}

async function getById(req, res) {
  try {
    const company = await CompanyService.getCompanyFull(req.params.id);
    if (!company) return response.error(res, 'Company not found', 404);
    return response.success(res, company, 'Company retrieved');
  } catch (error) {
    return response.error(res, error.message, 400);
  }
}

async function search(req, res) {
  try {
    const runAsync = req.body.async === true || req.body.async === 'true';
    if (runAsync) {
      const { async: _async, ...bodyWithoutAsync } = req.body;
      const job = await queueCompanyDiscovery(req.body.filters || bodyWithoutAsync);
      return response.success(res, { jobId: job.id, message: 'Discovery queued' }, 'Discovery queued', 202);
    }

    const url = req.body.url || req.body.website || req.body.websiteUrl;
    if (url) {
      const crawled = await crawlWebsite(url);
      return response.success(res, { website: url, ...crawled }, 'Company crawled');
    }

    const result = await CompanyDiscoveryService.discoverAndSave(req.body.filters || req.body);
    return response.success(res, result.companies, 'Company discovery completed', 200, {
      totalRecords: result.savedCount,
      totalPages: 1,
      currentPage: 1,
      hasNextPage: false,
      hasPreviousPage: false
    });
  } catch (error) {
    return response.error(res, error.message, 400);
  }
}

async function create(req, res) {
  try {
    const company = await CompanyService.createCompany(req.body);
    return response.success(res, company, 'Company created', 201);
  } catch (error) {
    return response.error(res, error.message, 400);
  }
}

async function update(req, res) {
  try {
    const company = await CompanyService.updateCompany(req.params.id, req.body);
    if (!company) return response.error(res, 'Company not found', 404);
    return response.success(res, company, 'Company updated');
  } catch (error) {
    return response.error(res, error.message, 400);
  }
}

async function remove(req, res) {
  try {
    const company = await CompanyService.deleteCompany(req.params.id, req.user?._id);
    if (!company) return response.error(res, 'Company not found', 404);
    return response.success(res, company, 'Company deleted');
  } catch (error) {
    return response.error(res, error.message, 400);
  }
}

async function bulk(req, res) {
  try {
    const companies = Array.isArray(req.body) ? req.body : req.body.companies;
    const result = await CompanyService.bulkInsert(companies || []);
    return response.success(res, result, 'Companies bulk inserted', 201);
  } catch (error) {
    return response.error(res, error.message, 400);
  }
}

async function exportCompanies(req, res) {
  try {
    const result = await ExportService.exportCompanies(req.query, req.query.format || 'csv', req.user?._id, req.user?.organizationId);
    res.setHeader('Content-Type', result.mimeType);
    res.setHeader('Content-Disposition', `attachment; filename="${result.filename}"`);
    return res.status(200).send(result.data);
  } catch (error) {
    return response.error(res, error.message, 400);
  }
}

async function getApolloCompany(req, res) {
  try {
    const { id } = req.params;
    const { companyId } = req.query;

    const result = await CompanyService.getApolloCompanyInfo(id, companyId);
    return response.success(res, result, 'Apollo company details retrieved successfully');
  } catch (error) {
    return response.error(res, error.message, 400);
  }
}

module.exports = {
  bulk,
  create,
  exportCompanies,
  getById,
  list,
  remove,
  search,
  update,
  getApolloCompany
};
