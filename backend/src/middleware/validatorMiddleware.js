import { validationResult } from 'express-validator';
import { sendError } from '../utils/response.js';

/**
 * Middleware to check express-validator results and format structured 400 responses
 */
export const validate = (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    const formattedErrors = errors.array().map((err) => ({
      field: err.path || err.param,
      message: err.msg,
      value: err.value
    }));

    return sendError(
      res,
      'Request input validation failed',
      400,
      'ValidationError',
      formattedErrors
    );
  }
  next();
};
