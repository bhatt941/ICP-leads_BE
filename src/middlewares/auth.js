const { UserRepository } = require('../repositories');
const AppError = require('../utils/AppError');
const asyncHandler = require('../utils/asyncHandler');
const { verifyAccessToken } = require('../utils/tokenUtils');

const authenticate = asyncHandler(async (req, _res, next) => {
  const header = req.headers.authorization;
  const token = header?.startsWith('Bearer ') ? header.slice(7) : undefined;

  if (!token) {
    throw new AppError('Authentication token is required', 401);
  }

  const payload = verifyAccessToken(token);
  const user = await UserRepository.findById(payload.sub || payload.userId);
  if (!user || user.isActive === false) {
    throw new AppError('User is no longer active', 401);
  }

  req.user = user;
  req.auth = payload;
  return next();
});

const authorize = (...roles) => (req, _res, next) => {
  if (!roles.includes(req.user.role)) {
    return next(new AppError('You do not have permission to perform this action', 403));
  }
  return next();
};

module.exports = {
  authenticate,
  authorize
};
