function success(res, data = null, message = 'Success', statusCode = 200, pagination = undefined) {
  return res.status(statusCode).json({
    success: true,
    message,
    data,
    pagination: pagination || null,
    error: null
  });
}

function error(res, message = 'Error', statusCode = 500, errors = undefined) {
  return res.status(statusCode).json({
    success: false,
    message,
    data: null,
    pagination: null,
    error: errors || message
  });
}

module.exports = {
  error,
  success
};
