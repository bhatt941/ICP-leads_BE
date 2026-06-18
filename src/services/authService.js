const bcrypt = require('bcryptjs');
const config = require('../config/env');
const BaseRepository = require('../repositories/BaseRepository');
const { UserRepository } = require('../repositories');
const {
  EmailVerification,
  Organization,
  PasswordReset,
  RefreshToken,
  Session,
  User
} = require('../models');
const {
  generateAccessToken,
  generateRandomToken,
  generateRefreshToken,
  verifyRefreshToken
} = require('../utils/tokenUtils');
const {
  sendPasswordResetEmail,
  sendVerificationEmail
} = require('../utils/emailUtils');

const organizationRepo = new BaseRepository(Organization);
const emailVerificationRepo = new BaseRepository(EmailVerification);
const refreshTokenRepo = new BaseRepository(RefreshToken);
const sessionRepo = new BaseRepository(Session);
const passwordResetRepo = new BaseRepository(PasswordReset);

class AuthService {
  async register({ firstName, lastName, email, password, companyName }) {
    const normalizedEmail = String(email || '').toLowerCase();
    const existing = await UserRepository.findByEmail(normalizedEmail);
    if (existing) throw new Error('Email already registered');

    const organization = await organizationRepo.create({
      name: companyName,
      slug: slugify(companyName)
    });

    const passwordHash = await bcrypt.hash(password, config.bcryptSaltRounds);
    const user = await UserRepository.create({
      firstName,
      lastName,
      email: normalizedEmail,
      passwordHash,
      role: 'org_owner',
      organizationId: organization._id,
      isVerified: false,
      isActive: true
    });

    await organizationRepo.updateById(organization._id, {
      members: [{ userId: user._id, role: 'org_owner', joinedAt: new Date() }]
    });

    const token = generateRandomToken();
    await emailVerificationRepo.create({
      userId: user._id,
      token,
      expiresAt: addHours(24),
      isUsed: false
    });

    await sendVerificationEmail(normalizedEmail, token, user.firstName || user.fullName || 'there');
    return { user: sanitizeUser(user), organization };
  }

  async verifyEmail(token) {
    const record = await emailVerificationRepo.findOne({ token });
    if (!record || record.isUsed || isExpired(record.expiresAt)) {
      throw new Error('Invalid or expired verification token');
    }

    await UserRepository.updateById(record.userId, {
      isVerified: true,
      isActive: true
    });
    await emailVerificationRepo.updateById(record._id, { isUsed: true });
    return { message: 'Email verified' };
  }

  async login({ email, password, deviceInfo = {} }) {
    const user = await UserRepository.findByEmail(email);
    if (!user) throw new Error('Invalid email or password');
    if (!user.isVerified&&process.env.NODE_ENV!=="development") throw new Error('Please verify your email before logging in');
    if (user.isActive === false) throw new Error('User is inactive');

    const passwordHash = await getPasswordHash(user);
    const validPassword = await bcrypt.compare(password, passwordHash || '');
    if (!validPassword) throw new Error('Invalid email or password');

    if (user.mfaEnabled) {
      return { mfaRequired: true, userId: user._id };
    }

    return this.issueLoginTokens(user, deviceInfo);
  }

  async googleLogin({ googleId, email, firstName, lastName, avatar, deviceInfo = {} }) {
    const normalizedEmail = String(email || '').toLowerCase();
    let user = await UserRepository.findByGoogleId(googleId);
    if (!user) user = await UserRepository.findByEmail(normalizedEmail);

    if (!user) {
      const organization = await organizationRepo.create({
        name: `${firstName || 'Google'} Workspace`,
        slug: slugify(`${normalizedEmail}-workspace`)
      });
      user = await UserRepository.create({
        firstName,
        lastName,
        email: normalizedEmail,
        googleId,
        avatar,
        role: 'org_owner',
        organizationId: organization._id,
        isVerified: true,
        isActive: true
      });
      await organizationRepo.updateById(organization._id, {
        members: [{ userId: user._id, role: 'org_owner', joinedAt: new Date() }]
      });
    } else if (!user.googleId) {
      user = await UserRepository.updateById(user._id, { googleId, avatar, isVerified: true });
    }

    return this.issueLoginTokens(user, deviceInfo);
  }

  async refreshToken(token, deviceInfo = {}) {
    const record = await refreshTokenRepo.findOne({ token });
    if (!record || record.isRevoked || isExpired(record.expiresAt)) {
      throw new Error('Invalid refresh token');
    }

    const payload = verifyRefreshToken(token);
    await refreshTokenRepo.updateById(record._id, { isRevoked: true });

    const userId = payload.sub || payload.userId || record.userId;
    const user = await UserRepository.findById(userId);
    if (!user || user.isActive === false) throw new Error('Invalid user');

    return this.issueRefreshPair(user, deviceInfo);
  }

  async logout(refreshToken, sessionId) {
    if (refreshToken) {
      const tokenRecord = await refreshTokenRepo.findOne({ token: refreshToken });
      if (tokenRecord) await refreshTokenRepo.updateById(tokenRecord._id, { isRevoked: true });
    }
    if (sessionId) {
      await sessionRepo.updateById(sessionId, { isActive: false, lastActiveAt: new Date() });
    }
    return { message: 'Logged out' };
  }

  async logoutAll(userId) {
    await bulkUpdate(refreshTokenRepo, { userId }, { isRevoked: true });
    await bulkUpdate(sessionRepo, { userId }, { isActive: false, lastActiveAt: new Date() });
    return { message: 'Logged out from all sessions' };
  }

  async forgotPassword(email) {
    const message = 'If an account exists, password reset instructions have been sent';
    const user = await UserRepository.findByEmail(email);
    if (!user) return { message };

    const token = generateRandomToken();
    await passwordResetRepo.create({
      userId: user._id,
      token,
      expiresAt: addHours(1),
      isUsed: false
    });
    await sendPasswordResetEmail(user.email, token, user.firstName || 'there');
    return { message };
  }

  async resetPassword(token, newPassword) {
    const record = await passwordResetRepo.findOne({ token });
    if (!record || record.isUsed || isExpired(record.expiresAt)) {
      throw new Error('Invalid or expired reset token');
    }

    const passwordHash = await bcrypt.hash(newPassword, config.bcryptSaltRounds);
    await UserRepository.updateById(record.userId, { passwordHash });
    await passwordResetRepo.updateById(record._id, { isUsed: true });
    await bulkUpdate(refreshTokenRepo, { userId: record.userId }, { isRevoked: true });
    return { message: 'Password reset successful' };
  }

  async issueLoginTokens(user, deviceInfo) {
    const payload = tokenPayload(user);
    const accessToken = generateAccessToken(payload);
    const refreshToken = generateRefreshToken(payload);
    await refreshTokenRepo.create({
      token: refreshToken,
      userId: user._id,
      expiresAt: addDays(30),
      isRevoked: false,
      deviceInfo
    });
    const session = await sessionRepo.create({
      userId: user._id,
      ...deviceInfo,
      loginAt: new Date(),
      lastActiveAt: new Date(),
      isActive: true
    });
    await UserRepository.updateById(user._id, { lastLoginAt: new Date() });
    return { accessToken, refreshToken, user: sanitizeUser(user), sessionId: session._id };
  }

  async issueRefreshPair(user, deviceInfo) {
    const payload = tokenPayload(user);
    const accessToken = generateAccessToken(payload);
    const refreshToken = generateRefreshToken(payload);
    await refreshTokenRepo.create({
      token: refreshToken,
      userId: user._id,
      expiresAt: addDays(30),
      isRevoked: false,
      deviceInfo
    });
    return { accessToken, refreshToken };
  }
}

async function getPasswordHash(user) {
  if (user.passwordHash) return user.passwordHash;
  if (UserRepository.isMemory()) return user.passwordHash;
  const userWithPassword = await User.findById(user._id).select('+passwordHash');
  return userWithPassword?.passwordHash;
}

function tokenPayload(user) {
  return {
    sub: String(user._id),
    userId: String(user._id),
    role: user.role,
    organizationId: user.organizationId ? String(user.organizationId) : undefined
  };
}

function sanitizeUser(user) {
  const plain = typeof user.toObject === 'function' ? user.toObject() : { ...user };
  delete plain.passwordHash;
  delete plain.mfaSecret;
  return plain;
}

function slugify(value = '') {
  return String(value || 'organization')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '') || `org-${Date.now()}`;
}

function addHours(hours) {
  return new Date(Date.now() + hours * 60 * 60 * 1000);
}

function addDays(days) {
  return new Date(Date.now() + days * 24 * 60 * 60 * 1000);
}

function isExpired(date) {
  return date && new Date(date).getTime() < Date.now();
}

async function bulkUpdate(repo, filter, data) {
  const records = await repo.findAll(filter);
  await Promise.all(records.map((record) => repo.updateById(record._id, data)));
}

module.exports = new AuthService();
