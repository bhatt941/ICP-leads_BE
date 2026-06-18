const SessionService = require('../services/SessionService');
const response = require('../utils/response');

async function list(req, res) {
  try {
    const sessions = await SessionService.listActive(req.user._id);
    return response.success(res, sessions, 'Sessions retrieved');
  } catch (error) {
    return response.error(res, error.message, 400);
  }
}

async function revoke(req, res) {
  try {
    const session = await SessionService.revoke(req.params.id, req.user._id);
    return response.success(res, session, 'Session revoked');
  } catch (error) {
    return response.error(res, error.message, 400);
  }
}

module.exports = {
  list,
  revoke
};
