const JobService = require('../services/JobService');
const response = require('../utils/response');
const { getFilters, getPagination } = require('./controllerUtils');

async function list(req, res) {
  try {
    const result = await JobService.listJobs(getFilters(req.query), getPagination(req.query));
    return response.success(res, result.data, 'Jobs retrieved', 200, result.pagination);
  } catch (error) {
    return response.error(res, error.message, 400);
  }
}

async function getById(req, res) {
  try {
    const job = await JobService.getJobById(req.params.id);
    if (!job) return response.error(res, 'Job not found', 404);
    return response.success(res, job, 'Job retrieved');
  } catch (error) {
    return response.error(res, error.message, 400);
  }
}

async function create(req, res) {
  try {
    const job = await JobService.createJob(req.body);
    return response.success(res, job, 'Job created', 201);
  } catch (error) {
    return response.error(res, error.message, 400);
  }
}

async function update(req, res) {
  try {
    const job = await JobService.updateJob(req.params.id, req.body);
    if (!job) return response.error(res, 'Job not found', 404);
    return response.success(res, job, 'Job updated');
  } catch (error) {
    return response.error(res, error.message, 400);
  }
}

async function remove(req, res) {
  try {
    const job = await JobService.deleteJob(req.params.id, req.user?._id);
    if (!job) return response.error(res, 'Job not found', 404);
    return response.success(res, job, 'Job deleted');
  } catch (error) {
    return response.error(res, error.message, 400);
  }
}

async function getApolloJobs(req, res) {
  try {
    const { organization_id } = req.params;
    const page = Number(req.query.page) || 1;
    const perPage = Number(req.query.per_page) || 10;
    const { companyId } = req.query;

    const result = await JobService.getApolloJobPostings(organization_id, page, perPage, companyId);
    return response.success(res, result, 'Apollo job postings retrieved successfully');
  } catch (error) {
    return response.error(res, error.message, 400);
  }
}

module.exports = {
  create,
  getById,
  list,
  remove,
  update,
  getApolloJobs
};
