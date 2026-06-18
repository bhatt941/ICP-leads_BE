const { UserRepository } = require('../repositories');
const response = require('../utils/response');
const { verifyAccessToken } = require('../utils/tokenUtils');

module.exports = async function authenticate(req, res, next) {
  try {
    const header = req.headers.authorization || '';
    let token = header.startsWith('Bearer ') ? header.slice(7) : null;
    if (!token && req.query.token) {
      token = req.query.token;
    }

    if (!token) {
      return response.error(res, 'Authentication token is required', 401);
    }

    const payload = verifyAccessToken(token);
    const user = await UserRepository.findById(payload.sub || payload.userId);
    if (!user || user.isActive === false) {
      return response.error(res, 'Invalid or inactive user', 401);
    }

    req.user = user;
    req.auth = payload;
    return next();
  } catch (_error) {
    return response.error(res, 'Invalid or expired token', 401);
  }
};
