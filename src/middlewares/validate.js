const { validationResult } = require('express-validator');
const response = require('../utils/response');

module.exports = function validate(req, res, next) {
  const result = validationResult(req);
  if (result.isEmpty()) return next();

  const errors = result.array().map((error) => ({
    field: error.path,
    message: error.msg,
    value: error.value
  }));

  return response.error(res, 'Validation failed', 422, errors);
};
