const SavedLeadService = require('../services/SavedLeadService');
const response = require('../utils/response');

async function list(req, res) {
  try {
    const result = await SavedLeadService.list(req.user._id, req.query);
    return response.success(res, result.data, 'Saved leads retrieved', 200, result.pagination);
  } catch (error) {
    return response.error(res, error.message, 400);
  }
}

async function create(req, res) {
  try {
    const result = await SavedLeadService.create({ ...req.body, userId: req.user._id });
    const io = req.app?.get('io');
    if (io && req.user?._id) {
      io.to(`user:${String(req.user._id)}`).emit('lead:discovered', { type: 'created', lead: result });
    }
    return response.success(res, result, 'Saved lead created', 201);
  } catch (error) {
    return response.error(res, error.message, 400);
  }
}

async function update(req, res) {
  try {
    const result = await SavedLeadService.update(req.params.id, req.user._id, req.body);
    return response.success(res, result, 'Saved lead updated');
  } catch (error) {
    return response.error(res, error.message, 400);
  }
}

async function remove(req, res) {
  try {
    const result = await SavedLeadService.remove(req.params.id, req.user._id);
    return response.success(res, result, 'Saved lead removed');
  } catch (error) {
    return response.error(res, error.message, 400);
  }
}

module.exports = {
  create,
  list,
  remove,
  update
};
