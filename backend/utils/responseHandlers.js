/**
 * Standardized response handlers for consistent API responses
 */

const success = (res, data = {}, message = 'Success', status = 200) => {
  return res.status(status).json({
    success: true,
    message,
    ...data,
  });
};

const error = (res, message = 'Server error', status = 500, details = null) => {
  const response = {
    success: false,
    message,
  };

  if (details && process.env.NODE_ENV === 'development') {
    response.details = details;
  }

  return res.status(status).json(response);
};

const validationError = (res, message = 'Validation failed', errors = []) => {
  return res.status(400).json({
    success: false,
    message,
    errors,
  });
};

const unauthorized = (res, message = 'Unauthorized') => {
  return res.status(401).json({
    success: false,
    message,
  });
};

const forbidden = (res, message = 'Forbidden') => {
  return res.status(403).json({
    success: false,
    message,
  });
};

const notFound = (res, message = 'Not found') => {
  return res.status(404).json({
    success: false,
    message,
  });
};

const created = (res, data = {}, message = 'Created successfully') => {
  return success(res, data, message, 201);
};

module.exports = {
  success,
  error,
  validationError,
  unauthorized,
  forbidden,
  notFound,
  created,
};
