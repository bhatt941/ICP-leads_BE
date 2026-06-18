const response = require('../utils/response');

function authorizeRoles(...roles) {
  return function authorize(req, res, next) {
    if (!req.user) {
      return response.error(res, 'Authentication required', 401);
    }

    if (!roles.includes(req.user.role)) {
      return response.error(res, 'Forbidden', 403);
    }

    return next();
  };
}

module.exports = {
  authorizeRoles
};
