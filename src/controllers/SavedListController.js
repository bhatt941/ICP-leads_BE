const SavedListService = require('../services/SavedListService');
const response = require('../utils/response');

async function create(req, res) {
  try {
    const list = await SavedListService.create({
      ...req.body,
      userId: req.user._id,
      organizationId: req.user.organizationId
    });
    return response.success(res, list, 'Saved list created', 201);
  } catch (error) {
    return response.error(res, error.message, 400);
  }
}

async function list(req, res) {
  try {
    const lists = await SavedListService.list(req.user.organizationId, req.user._id);
    return response.success(res, lists, 'Saved lists retrieved');
  } catch (error) {
    return response.error(res, error.message, 400);
  }
}

async function getById(req, res) {
  try {
    const savedList = await SavedListService.getById(req.params.id);
    if (!savedList) return response.error(res, 'Saved list not found', 404);
    return response.success(res, savedList, 'Saved list retrieved');
  } catch (error) {
    return response.error(res, error.message, 400);
  }
}

async function update(req, res) {
  try {
    const savedList = await SavedListService.update(req.params.id, req.body);
    return response.success(res, savedList, 'Saved list updated');
  } catch (error) {
    return response.error(res, error.message, 400);
  }
}

async function remove(req, res) {
  try {
    const savedList = await SavedListService.remove(req.params.id);
    return response.success(res, savedList, 'Saved list deleted');
  } catch (error) {
    return response.error(res, error.message, 400);
  }
}

async function addCompany(req, res) {
  try {
    const savedList = await SavedListService.addCompany(req.params.id, req.body.companyId);
    return response.success(res, savedList, 'Company added to saved list');
  } catch (error) {
    return response.error(res, error.message, 400);
  }
}

async function removeCompany(req, res) {
  try {
    const savedList = await SavedListService.removeCompany(req.params.id, req.params.companyId);
    return response.success(res, savedList, 'Company removed from saved list');
  } catch (error) {
    return response.error(res, error.message, 400);
  }
}

module.exports = {
  addCompany,
  create,
  getById,
  list,
  remove,
  removeCompany,
  update
};
