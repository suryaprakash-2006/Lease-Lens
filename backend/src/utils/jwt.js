import jwt from 'jsonwebtoken';

/**
 * Generate a signed JWT token
 * @param {string} userId - Mongo ObjectId as string
 * @param {string} role - User role (e.g. 'user', 'admin')
 * @returns {string} Signed JWT token string
 */
export const generateToken = (userId, role = 'user') => {
  const secret = process.env.JWT_SECRET;
  if (!secret) {
    throw new Error('JWT_SECRET is not configured in environment variables');
  }

  const expiresIn = process.env.JWT_EXPIRES_IN || '7d';

  return jwt.sign({ id: userId, role }, secret, { expiresIn });
};

/**
 * Verify and decode a JWT token
 * @param {string} token - Raw JWT token
 * @returns {object} Decoded payload
 */
export const verifyToken = (token) => {
  const secret = process.env.JWT_SECRET;
  if (!secret) {
    throw new Error('JWT_SECRET is not configured in environment variables');
  }

  return jwt.verify(token, secret);
};
