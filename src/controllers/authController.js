const AuthService = require('../services/AuthService');
const response = require('../utils/response');

function getDeviceInfo(req) {
  return {
    ip: req.ip,
    userAgent: req.headers['user-agent'],
    device: req.headers['sec-ch-ua-platform'],
    browser: req.headers['sec-ch-ua'],
    os: req.headers['sec-ch-ua-platform']
  };
}

async function register(req, res) {
  try {
    const result = await AuthService.register(req.body);
    return response.success(res, result, 'Registration successful. Please verify your email.', 201);
  } catch (error) {
    return response.error(res, error.message, 400);
  }
}

async function verifyEmail(req, res) {
  try {
    const result = await AuthService.verifyEmail(req.body.token || req.query.token);
    return response.success(res, result, result.message);
  } catch (error) {
    return response.error(res, error.message, 400);
  }
}

async function login(req, res) {
  try {
    const result = await AuthService.login({ ...req.body, deviceInfo: getDeviceInfo(req) });
    return response.success(res, result, 'Login successful');
  } catch (error) {
    return response.error(res, error.message, 401);
  }
}

async function googleLogin(req, res) {
  try {
    const result = await AuthService.googleLogin({ ...req.body, deviceInfo: getDeviceInfo(req) });
    return response.success(res, result, 'Google login successful');
  } catch (error) {
    return response.error(res, error.message, 401);
  }
}

async function refreshToken(req, res) {
  try {
    const result = await AuthService.refreshToken(req.body.refreshToken, getDeviceInfo(req));
    return response.success(res, result, 'Token refreshed');
  } catch (error) {
    return response.error(res, error.message, 401);
  }
}

async function logout(req, res) {
  try {
    const result = await AuthService.logout(req.body.refreshToken, req.body.sessionId);
    return response.success(res, result, result.message);
  } catch (error) {
    return response.error(res, error.message, 400);
  }
}

async function logoutAll(req, res) {
  try {
    const result = await AuthService.logoutAll(req.user._id);
    return response.success(res, result, result.message);
  } catch (error) {
    return response.error(res, error.message, 400);
  }
}

async function forgotPassword(req, res) {
  try {
    const result = await AuthService.forgotPassword(req.body.email);
    return response.success(res, result, result.message);
  } catch (error) {
    return response.error(res, error.message, 400);
  }
}

async function resetPassword(req, res) {
  try {
    const result = await AuthService.resetPassword(req.body.token, req.body.newPassword);
    return response.success(res, result, result.message);
  } catch (error) {
    return response.error(res, error.message, 400);
  }
}

module.exports = {
  forgotPassword,
  googleLogin,
  login,
  logout,
  logoutAll,
  refreshToken,
  register,
  resetPassword,
  verifyEmail
};
