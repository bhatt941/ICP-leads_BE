const ApiKeyService = require('../services/ApiKeyService');
const { UserRepository, BaseRepository } = require('../repositories');
const { Organization } = require('../models');
const response = require('../utils/response');

const organizationRepo = new BaseRepository(Organization);

module.exports = async function apiKeyAuth(req, res, next) {
  try {
    const rawKey = req.headers['x-api-key'];
    const apiKey = await ApiKeyService.validateKey(rawKey);
    if (!apiKey) return response.error(res, 'Invalid API key', 401);

    req.apiKey = apiKey;
    req.organization = await organizationRepo.findById(apiKey.organizationId);
    req.user = await UserRepository.findById(apiKey.userId);
    return next();
  } catch (_error) {
    return response.error(res, 'Invalid API key', 401);
  }
};
