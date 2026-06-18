const crypto = require('crypto');
const BaseRepository = require('../repositories/BaseRepository');
const { ApiKey } = require('../models');
const { generateApiKey } = require('../utils/tokenUtils');

const apiKeyRepo = new BaseRepository(ApiKey);

class ApiKeyService {
  async createKey(orgId, userId, name, scopes = []) {
    const rawKey = generateApiKey();
    const keyHash = hashKey(rawKey);
    const record = await apiKeyRepo.create({
      organizationId: orgId,
      userId,
      name,
      keyHash,
      keyPrefix: rawKey.slice(0, 12),
      scopes,
      isActive: true,
      usageCount: 0
    });
    return { apiKey: rawKey, record: sanitizeKey(record) };
  }

  async listKeys(orgId) {
    const keys = await apiKeyRepo.findAll({ organizationId: orgId });
    return keys.map(sanitizeKey);
  }

  async revokeKey(keyId, orgId) {
    const key = await apiKeyRepo.findById(keyId);
    if (!key || String(key.organizationId) !== String(orgId)) throw new Error('API key not found');
    return sanitizeKey(await apiKeyRepo.updateById(keyId, { isActive: false }));
  }

  async validateKey(rawKey) {
    if (!rawKey) return null;
    const key = await apiKeyRepo.findOne({ keyHash: hashKey(rawKey) });
    if (!key || key.isActive === false) return null;
    const updated = await apiKeyRepo.updateById(key._id, {
      usageCount: Number(key.usageCount || 0) + 1,
      lastUsedAt: new Date()
    });
    return updated;
  }
}

function hashKey(rawKey) {
  return crypto.createHash('sha256').update(rawKey).digest('hex');
}

function sanitizeKey(key) {
  if (!key) return key;
  const plain = typeof key.toObject === 'function' ? key.toObject() : { ...key };
  delete plain.keyHash;
  return plain;
}

module.exports = new ApiKeyService();
