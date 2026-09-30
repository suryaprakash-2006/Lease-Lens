/**
 * Standardized success response structure
 */
export const sendSuccess = (res, data = null, statusCode = 200, message = null) => {
  const response = {
    success: true,
    statusCode
  };

  if (message) response.message = message;
  if (data !== null) response.data = data;

  return res.status(statusCode).json(response);
};

/**
 * Standardized error response structure
 */
export const sendError = (
  res,
  message = 'An unexpected error occurred',
  statusCode = 500,
  error = 'InternalServerError',
  details = null
) => {
  const response = {
    success: false,
    statusCode,
    error,
    message
  };

  if (details) response.details = details;

  return res.status(statusCode).json(response);
};
