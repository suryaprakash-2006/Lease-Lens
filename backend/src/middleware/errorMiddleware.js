import { sendError } from '../utils/response.js';

/**
 * Handle 404 for undefined endpoints
 */
export const notFoundHandler = (req, res) => {
  return sendError(
    res,
    `Cannot ${req.method} ${req.originalUrl} - Endpoint not found`,
    404,
    'NotFound'
  );
};

/**
 * Centralized global error handling middleware
 */
export const errorHandler = (err, req, res, next) => { // eslint-disable-line no-unused-vars
  console.error(`[Unhandled Error] ${req.method} ${req.originalUrl}:`, err);

  let statusCode = err.statusCode || 500;
  let message = err.message || 'Internal server error';
  let errorType = err.name || 'InternalServerError';
  let details = null;

  // Handle Mongoose Duplicate Key Error (e.g. unique email)
  if (err.code === 11000) {
    statusCode = 409;
    errorType = 'DuplicateResource';
    const field = Object.keys(err.keyValue || {})[0];
    message = `A record with this ${field} already exists.`;
    details = err.keyValue;
  }

  // Handle Mongoose Validation Error
  if (err.name === 'ValidationError') {
    statusCode = 400;
    errorType = 'ValidationError';
    message = 'Validation failed on resource schema';
    details = Object.values(err.errors).map((e) => ({
      field: e.path,
      message: e.message
    }));
  }

  // Handle Mongoose CastError (invalid ObjectId)
  if (err.name === 'CastError') {
    statusCode = 400;
    errorType = 'InvalidId';
    message = `Invalid ${err.path}: ${err.value}`;
  }

  // Avoid exposing stack traces in production
  const responseDetails = process.env.NODE_ENV === 'development' && !details
    ? { stack: err.stack }
    : details;

  return sendError(res, message, statusCode, errorType, responseDetails);
};
