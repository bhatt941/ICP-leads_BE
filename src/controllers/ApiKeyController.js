const ApiKeyService = require('../services/ApiKeyService');
const response = require('../utils/response');

async function create(req, res) {
  try {
    const result = await ApiKeyService.createKey(req.user.organizationId, req.user._id, req.body.name, req.body.scopes || []);
    return response.success(res, result, 'API key created', 201);
  } catch (error) {
    return response.error(res, error.message, 400);
  }
}

async function list(req, res) {
  try {
    const keys = await ApiKeyService.listKeys(req.user.organizationId);
    return response.success(res, keys, 'API keys retrieved');
  } catch (error) {
    return response.error(res, error.message, 400);
  }
}

async function revoke(req, res) {
  try {
    const key = await ApiKeyService.revokeKey(req.params.id, req.user.organizationId);
    return response.success(res, key, 'API key revoked');
  } catch (error) {
    return response.error(res, error.message, 400);
  }
}

module.exports = {
  create,
  list,
  revoke
};
