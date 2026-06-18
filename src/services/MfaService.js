const BaseRepository = require('../repositories/BaseRepository');
const { UserRepository } = require('../repositories');
const { MfaSecret } = require('../models');

const mfaRepo = new BaseRepository(MfaSecret);

class MfaService {
  async setup(userId) {
    const speakeasy = require('speakeasy');
    const qrcode = require('qrcode');
    const secret = speakeasy.generateSecret({
      name: `Lead Intelligence (${userId})`
    });

    const existing = await mfaRepo.findOne({ userId });
    if (existing) {
      await mfaRepo.updateById(existing._id, { secret: secret.base32, isActive: false });
    } else {
      await mfaRepo.create({ userId, secret: secret.base32, isActive: false });
    }

    const qrCodeUrl = await qrcode.toDataURL(secret.otpauth_url);
    return { secret: secret.base32, qrCodeUrl };
  }

  async verify(userId, code) {
    const speakeasy = require('speakeasy');
    const record = await mfaRepo.findOne({ userId });
    if (!record) throw new Error('MFA setup not found');

    const verified = speakeasy.totp.verify({
      secret: record.secret,
      encoding: 'base32',
      token: code,
      window: 1
    });
    if (!verified) throw new Error('Invalid MFA code');

    await mfaRepo.updateById(record._id, { isActive: true });
    await UserRepository.updateById(userId, { mfaEnabled: true });
    return { verified: true };
  }

  async disable(userId, code) {
    await this.verify(userId, code);
    const record = await mfaRepo.findOne({ userId });
    if (record) await mfaRepo.updateById(record._id, { isActive: false });
    await UserRepository.updateById(userId, { mfaEnabled: false });
    return { disabled: true };
  }
}

module.exports = new MfaService();
