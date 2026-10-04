import express from 'express';
import { body, query } from 'express-validator';
import * as leaseController from '../controllers/leaseController.js';
import { protect } from '../middleware/authMiddleware.js';
import { validate } from '../middleware/validatorMiddleware.js';

const router = express.Router();

// Protect all lease routes
router.use(protect);

/**
 * Validation for creating a new lease agreement
 */
const leaseCreationValidation = [
  body('propertyId')
    .notEmpty()
    .withMessage('Property ID is required')
    .isMongoId()
    .withMessage('Invalid Property ID format'),
  body('tenant.name')
    .trim()
    .notEmpty()
    .withMessage('Tenant name is required')
    .isLength({ min: 2, max: 100 })
    .withMessage('Tenant name must be between 2 and 100 characters'),
  body('tenant.email')
    .trim()
    .notEmpty()
    .withMessage('Tenant email is required')
    .isEmail()
    .withMessage('Please provide a valid tenant email address')
    .normalizeEmail(),
  body('tenant.phone')
    .trim()
    .notEmpty()
    .withMessage('Tenant phone number is required'),
  body('tenant.occupantsCount')
    .optional()
    .isInt({ min: 1 })
    .withMessage('Occupants count must be at least 1'),
  body('monthlyRent')
    .notEmpty()
    .withMessage('Monthly rent is required')
    .isFloat({ min: 0 })
    .withMessage('Monthly rent must be a non-negative number'),
  body('securityDeposit')
    .notEmpty()
    .withMessage('Security deposit is required')
    .isFloat({ min: 0 })
    .withMessage('Security deposit must be a non-negative number'),
  body('startDate')
    .notEmpty()
    .withMessage('Lease start date is required')
    .isISO8601()
    .withMessage('Start date must be a valid ISO 8601 date string'),
  body('endDate')
    .notEmpty()
    .withMessage('Lease end date is required')
    .isISO8601()
    .withMessage('End date must be a valid ISO 8601 date string'),
  body('noticePeriodDays')
    .optional()
    .isInt({ min: 0 })
    .withMessage('Notice period must be non-negative'),
  body('paymentDueDay')
    .optional()
    .isInt({ min: 1, max: 31 })
    .withMessage('Payment due day must be between 1 and 31'),
  body('status')
    .optional()
    .isIn(['Active', 'Upcoming', 'Expired', 'Terminated'])
    .withMessage('Invalid lease status'),
  validate
];

/**
 * Validation for updating a lease
 */
const leaseUpdateValidation = [
  body('propertyId')
    .optional()
    .isMongoId()
    .withMessage('Invalid Property ID format'),
  body('tenant.email')
    .optional()
    .isEmail()
    .withMessage('Please provide a valid tenant email address'),
  body('monthlyRent')
    .optional()
    .isFloat({ min: 0 })
    .withMessage('Monthly rent must be non-negative'),
  body('securityDeposit')
    .optional()
    .isFloat({ min: 0 })
    .withMessage('Security deposit must be non-negative'),
  body('startDate')
    .optional()
    .isISO8601()
    .withMessage('Start date must be a valid ISO 8601 date string'),
  body('endDate')
    .optional()
    .isISO8601()
    .withMessage('End date must be a valid ISO 8601 date string'),
  body('status')
    .optional()
    .isIn(['Active', 'Upcoming', 'Expired', 'Terminated'])
    .withMessage('Invalid lease status'),
  validate
];

/**
 * Validation for status update patch
 */
const leaseStatusPatchValidation = [
  body('status')
    .notEmpty()
    .withMessage('Status is required')
    .isIn(['Active', 'Upcoming', 'Expired', 'Terminated'])
    .withMessage('Invalid lease status'),
  validate
];

/**
 * Validation for querying lease list
 */
const leaseListValidation = [
  query('propertyId')
    .optional()
    .isMongoId()
    .withMessage('Invalid propertyId filter'),
  query('status')
    .optional()
    .isIn(['Active', 'Upcoming', 'Expired', 'Terminated'])
    .withMessage('Invalid status filter'),
  query('page')
    .optional()
    .isInt({ min: 1 })
    .withMessage('Page must be a positive integer'),
  query('limit')
    .optional()
    .isInt({ min: 1, max: 100 })
    .withMessage('Limit must be between 1 and 100'),
  validate
];

router.get('/', leaseListValidation, leaseController.getLeases);
router.post('/', leaseCreationValidation, leaseController.createLease);
router.get('/upcoming', leaseController.getUpcomingEvents);
router.get('/:id', leaseController.getLeaseById);
router.put('/:id', leaseUpdateValidation, leaseController.updateLease);
router.patch('/:id/status', leaseStatusPatchValidation, leaseController.updateLeaseStatus);
router.delete('/:id', leaseController.deleteLease);

export default router;
