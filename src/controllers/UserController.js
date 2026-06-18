const { UserRepository } = require('../repositories');
const response = require('../utils/response');

function sanitizeUser(user) {
  const plain = typeof user.toObject === 'function' ? user.toObject() : { ...user };
  delete plain.passwordHash;
  delete plain.mfaSecret;
  return plain;
}

async function getProfile(req, res) {
  return response.success(res, sanitizeUser(req.user), 'Profile retrieved');
}

async function updateProfile(req, res) {
  try {
    const allowed = ['firstName', 'lastName', 'avatar'];
    const updates = {};
    for (const key of allowed) {
      if (req.body[key] !== undefined) updates[key] = req.body[key];
    }
    const user = await UserRepository.updateById(req.user._id, updates);
    return response.success(res, sanitizeUser(user), 'Profile updated');
  } catch (error) {
    return response.error(res, error.message, 400);
  }
}

async function deleteAccount(req, res) {
  try {
    await UserRepository.updateById(req.user._id, { isActive: false });
    return response.success(res, null, 'Account deleted');
  } catch (error) {
    return response.error(res, error.message, 400);
  }
}

module.exports = {
  deleteAccount,
  getProfile,
  updateProfile
};
