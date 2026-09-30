import User from '../models/User.js';
import { generateToken } from '../utils/jwt.js';

/**
 * Register a new user account
 */
export const registerUser = async ({ name, email, password, phone }) => {
  // Check if email already exists
  const existingUser = await User.findOne({ email: email.toLowerCase().trim() });
  if (existingUser) {
    const error = new Error('An account with this email address already exists.');
    error.statusCode = 409;
    error.name = 'DuplicateResource';
    throw error;
  }

  // Hash password using User model static method
  const passwordHash = await User.hashPassword(password);

  const newUser = await User.create({
    name,
    email: email.toLowerCase().trim(),
    passwordHash,
    phone: phone || '',
    role: 'user'
  });

  // Generate JWT token
  const token = generateToken(newUser._id.toString(), newUser.role);

  return {
    user: newUser.toJSON(),
    token
  };
};

/**
 * Authenticate user with email and password
 */
export const loginUser = async ({ email, password }) => {
  // Find user by email
  const user = await User.findOne({ email: email.toLowerCase().trim() });
  if (!user) {
    const error = new Error('Invalid email or password.');
    error.statusCode = 401;
    error.name = 'AuthenticationFailed';
    throw error;
  }

  // Verify password
  const isMatch = await user.comparePassword(password);
  if (!isMatch) {
    const error = new Error('Invalid email or password.');
    error.statusCode = 401;
    error.name = 'AuthenticationFailed';
    throw error;
  }

  // Generate JWT token
  const token = generateToken(user._id.toString(), user.role);

  return {
    user: user.toJSON(),
    token
  };
};

/**
 * Retrieve authenticated user profile
 */
export const getUserProfile = async (userId) => {
  const user = await User.findById(userId).select('-passwordHash');
  if (!user) {
    const error = new Error('User not found.');
    error.statusCode = 404;
    error.name = 'NotFound';
    throw error;
  }
  return user.toJSON();
};

/**
 * Update authenticated user profile details
 */
export const updateUserProfile = async (userId, updates) => {
  const user = await User.findById(userId);
  if (!user) {
    const error = new Error('User not found.');
    error.statusCode = 404;
    error.name = 'NotFound';
    throw error;
  }

  if (updates.name) user.name = updates.name.trim();
  if (updates.phone !== undefined) user.phone = updates.phone.trim();

  // If user wants to update password
  if (updates.newPassword) {
    if (!updates.currentPassword) {
      const error = new Error('Current password is required to change password.');
      error.statusCode = 400;
      error.name = 'ValidationError';
      throw error;
    }

    const isMatch = await user.comparePassword(updates.currentPassword);
    if (!isMatch) {
      const error = new Error('Current password does not match.');
      error.statusCode = 400;
      error.name = 'ValidationError';
      throw error;
    }

    user.passwordHash = await User.hashPassword(updates.newPassword);
  }

  await user.save();
  return user.toJSON();
};
