const logger = require('../utils/logger');
const response = require('../utils/response');

module.exports = function errorHandler(err, _req, res, _next) {
  let statusCode = err.statusCode || 500;
  let message = err.message || 'Internal server error';
  let errors = err.details;

  if (err.name === 'CastError') {
    statusCode = 400;
    message = 'Invalid resource identifier';
    errors = { path: err.path, value: err.value };
  }

  if (err.name === 'ValidationError') {
    statusCode = 400;
    message = 'Validation failed';
    errors = Object.values(err.errors || {}).map((item) => ({
      field: item.path,
      message: item.message
    }));
  }

  if (err.code === 11000) {
    statusCode = 409;
    message = 'Duplicate key error';
    errors = err.keyValue;
  }

  if (statusCode >= 500) {
    logger.error(message, { stack: err.stack });
    message = 'Internal server error';
  }

  return response.error(res, message, statusCode, errors);
};
