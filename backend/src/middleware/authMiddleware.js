import { verifyToken } from '../utils/jwt.js';
import User from '../models/User.js';
import { sendError } from '../utils/response.js';

/**
 * Protect routes by requiring and validating a Bearer JWT token
 */
export const protect = async (req, res, next) => {
  try {
    let token = null;

    if (
      req.headers.authorization &&
      req.headers.authorization.startsWith('Bearer ')
    ) {
      token = req.headers.authorization.split(' ')[1];
    }

    if (!token) {
      return sendError(
        res,
        'Access denied. No authorization token provided.',
        401,
        'Unauthorized'
      );
    }

    try {
      const decoded = verifyToken(token);

      // Verify that user still exists in database
      const user = await User.findById(decoded.id).select('-passwordHash');
      if (!user) {
        return sendError(
          res,
          'User session invalid. User account no longer exists.',
          401,
          'Unauthorized'
        );
      }

      // Attach user object to request
      req.user = user;
      next();
    } catch (tokenErr) {
      if (tokenErr.name === 'TokenExpiredError') {
        return sendError(
          res,
          'Authorization token has expired. Please log in again.',
          401,
          'TokenExpired'
        );
      }
      return sendError(
        res,
        'Invalid authorization token.',
        401,
        'InvalidToken'
      );
    }
  } catch (error) {
    next(error);
  }
};
