import * as leaseService from '../services/leaseService.js';
import { sendSuccess } from '../utils/response.js';

/**
 * @route   GET /api/v1/leases
 * @desc    Get all leases for authenticated user with filters
 * @access  Private
 */
export const getLeases = async (req, res, next) => {
  try {
    const result = await leaseService.getLeases(req.user._id, req.query);
    return sendSuccess(res, result, 200, 'Leases retrieved successfully');
  } catch (error) {
    next(error);
  }
};

/**
 * @route   POST /api/v1/leases
 * @desc    Create a new lease agreement
 * @access  Private
 */
export const createLease = async (req, res, next) => {
  try {
    const lease = await leaseService.createLease(req.user._id, req.body);
    return sendSuccess(res, lease, 201, 'Lease agreement created successfully');
  } catch (error) {
    next(error);
  }
};

/**
 * @route   GET /api/v1/leases/upcoming
 * @desc    Get upcoming lease events (expirations & move-ins within 30 days)
 * @access  Private
 */
export const getUpcomingEvents = async (req, res, next) => {
  try {
    const daysAhead = req.query.days ? parseInt(req.query.days, 10) : 30;
    const events = await leaseService.getUpcomingLeaseEvents(req.user._id, daysAhead);
    return sendSuccess(res, { events }, 200, 'Upcoming lease events retrieved successfully');
  } catch (error) {
    next(error);
  }
};

/**
 * @route   GET /api/v1/leases/:id
 * @desc    Get single lease details by ID
 * @access  Private
 */
export const getLeaseById = async (req, res, next) => {
  try {
    const lease = await leaseService.getLeaseById(req.user._id, req.params.id);
    return sendSuccess(res, lease, 200, 'Lease details retrieved successfully');
  } catch (error) {
    next(error);
  }
};

/**
 * @route   PUT /api/v1/leases/:id
 * @desc    Update lease agreement details
 * @access  Private
 */
export const updateLease = async (req, res, next) => {
  try {
    const lease = await leaseService.updateLease(req.user._id, req.params.id, req.body);
    return sendSuccess(res, lease, 200, 'Lease agreement updated successfully');
  } catch (error) {
    next(error);
  }
};

/**
 * @route   PATCH /api/v1/leases/:id/status
 * @desc    Explicitly update lease status (e.g. Terminated, Expired)
 * @access  Private
 */
export const updateLeaseStatus = async (req, res, next) => {
  try {
    const { status } = req.body;
    const lease = await leaseService.updateLeaseStatus(req.user._id, req.params.id, status);
    return sendSuccess(res, lease, 200, 'Lease status updated successfully');
  } catch (error) {
    next(error);
  }
};

/**
 * @route   DELETE /api/v1/leases/:id
 * @desc    Delete a lease agreement
 * @access  Private
 */
export const deleteLease = async (req, res, next) => {
  try {
    const result = await leaseService.deleteLease(req.user._id, req.params.id);
    return sendSuccess(res, result, 200, 'Lease deleted successfully');
  } catch (error) {
    next(error);
  }
};
