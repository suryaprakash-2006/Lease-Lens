import * as authService from '../services/authService.js';
import { sendSuccess } from '../utils/response.js';

/**
 * @route   POST /api/v1/auth/register
 * @desc    Register a new user account
 * @access  Public
 */
export const register = async (req, res, next) => {
  try {
    const { name, email, password, phone } = req.body;
    const result = await authService.registerUser({ name, email, password, phone });

    return sendSuccess(
      res,
      result,
      201,
      'User account registered successfully'
    );
  } catch (error) {
    next(error);
  }
};

/**
 * @route   POST /api/v1/auth/login
 * @desc    Authenticate user & return JWT token
 * @access  Public
 */
export const login = async (req, res, next) => {
  try {
    const { email, password } = req.body;
    const result = await authService.loginUser({ email, password });

    return sendSuccess(
      res,
      result,
      200,
      'Login successful'
    );
  } catch (error) {
    next(error);
  }
};

/**
 * @route   GET /api/v1/auth/me
 * @desc    Get currently logged in user profile
 * @access  Private (JWT protected)
 */
export const getMe = async (req, res, next) => {
  try {
    const user = await authService.getUserProfile(req.user._id);

    return sendSuccess(
      res,
      { user },
      200,
      'Profile retrieved successfully'
    );
  } catch (error) {
    next(error);
  }
};

/**
 * @route   PUT /api/v1/auth/profile
 * @desc    Update user profile
 * @access  Private (JWT protected)
 */
export const updateProfile = async (req, res, next) => {
  try {
    const { name, phone, currentPassword, newPassword } = req.body;
    const updatedUser = await authService.updateUserProfile(req.user._id, {
      name,
      phone,
      currentPassword,
      newPassword
    });

    return sendSuccess(
      res,
      { user: updatedUser },
      200,
      'Profile updated successfully'
    );
  } catch (error) {
    next(error);
  }
};
