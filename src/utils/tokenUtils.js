const crypto = require('crypto');
const jwt = require('jsonwebtoken');
const config = require('../config/env');

function generateAccessToken(payload) {
  return jwt.sign(payload, config.jwt.accessTokenSecret, {
    expiresIn: config.jwt.accessTokenExpires
  });
}

function generateRefreshToken(payload) {
  return jwt.sign(payload, config.jwt.refreshTokenSecret, {
    expiresIn: config.jwt.refreshTokenExpires
  });
}

function verifyAccessToken(token) {
  return jwt.verify(token, config.jwt.accessTokenSecret);
}

function verifyRefreshToken(token) {
  return jwt.verify(token, config.jwt.refreshTokenSecret);
}

function generateRandomToken() {
  return crypto.randomBytes(32).toString('hex');
}

function generateApiKey() {
  return `sk_live_${crypto.randomBytes(24).toString('hex')}`;
}

module.exports = {
  generateAccessToken,
  generateApiKey,
  generateRandomToken,
  generateRefreshToken,
  verifyAccessToken,
  verifyRefreshToken
};
