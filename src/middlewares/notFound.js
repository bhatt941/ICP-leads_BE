const response = require('../utils/response');

module.exports = function notFound(_req, res) {
  return response.error(res, 'Route not found', 404);
};
