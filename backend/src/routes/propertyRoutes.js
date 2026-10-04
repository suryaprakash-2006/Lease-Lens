import express from 'express';
import { body, query } from 'express-validator';
import * as propertyController from '../controllers/propertyController.js';
import { protect } from '../middleware/authMiddleware.js';
import { validate } from '../middleware/validatorMiddleware.js';

const router = express.Router();

// Protect all property routes
router.use(protect);

/**
 * Validation for creating a property
 */
const propertyCreationValidation = [
  body('title')
    .trim()
    .notEmpty()
    .withMessage('Property title is required')
    .isLength({ min: 2, max: 120 })
    .withMessage('Title must be between 2 and 120 characters'),
  body('propertyType')
    .optional()
    .isIn(['Apartment', 'Independent House', 'Villa', 'Studio', 'Commercial', 'Other'])
    .withMessage('Invalid property type'),
  body('address.locality')
    .trim()
    .notEmpty()
    .withMessage('Locality is required'),
  body('address.city')
    .trim()
    .notEmpty()
    .withMessage('City is required'),
  body('bhk')
    .notEmpty()
    .withMessage('BHK is required')
    .isInt({ min: 1 })
    .withMessage('BHK must be an integer of at least 1'),
  body('areaSqFt')
    .notEmpty()
    .withMessage('Area in sq ft is required')
    .isFloat({ min: 50 })
    .withMessage('Area must be at least 50 sq ft'),
  body('bedrooms')
    .notEmpty()
    .withMessage('Bedrooms count is required')
    .isInt({ min: 1 })
    .withMessage('Bedrooms must be at least 1'),
  body('bathrooms')
    .notEmpty()
    .withMessage('Bathrooms count is required')
    .isInt({ min: 1 })
    .withMessage('Bathrooms must be at least 1'),
  body('furnishingStatus')
    .optional()
    .isIn(['Furnished', 'Semi-Furnished', 'Unfurnished'])
    .withMessage('Invalid furnishing status'),
  body('parking')
    .optional()
    .isBoolean()
    .withMessage('Parking must be a boolean value'),
  body('listedRent')
    .notEmpty()
    .withMessage('Listed rent is required')
    .isFloat({ min: 0 })
    .withMessage('Listed rent must be a non-negative number'),
  body('status')
    .optional()
    .isIn(['Available', 'Rented', 'Under Maintenance'])
    .withMessage('Invalid property status'),
  validate
];

/**
 * Validation for updating a property
 */
const propertyUpdateValidation = [
  body('title')
    .optional()
    .trim()
    .isLength({ min: 2, max: 120 })
    .withMessage('Title must be between 2 and 120 characters'),
  body('propertyType')
    .optional()
    .isIn(['Apartment', 'Independent House', 'Villa', 'Studio', 'Commercial', 'Other'])
    .withMessage('Invalid property type'),
  body('bhk')
    .optional()
    .isInt({ min: 1 })
    .withMessage('BHK must be an integer of at least 1'),
  body('areaSqFt')
    .optional()
    .isFloat({ min: 50 })
    .withMessage('Area must be at least 50 sq ft'),
  body('bedrooms')
    .optional()
    .isInt({ min: 1 })
    .withMessage('Bedrooms must be at least 1'),
  body('bathrooms')
    .optional()
    .isInt({ min: 1 })
    .withMessage('Bathrooms must be at least 1'),
  body('furnishingStatus')
    .optional()
    .isIn(['Furnished', 'Semi-Furnished', 'Unfurnished'])
    .withMessage('Invalid furnishing status'),
  body('parking')
    .optional()
    .isBoolean()
    .withMessage('Parking must be a boolean value'),
  body('listedRent')
    .optional()
    .isFloat({ min: 0 })
    .withMessage('Listed rent must be a non-negative number'),
  body('status')
    .optional()
    .isIn(['Available', 'Rented', 'Under Maintenance'])
    .withMessage('Invalid property status'),
  validate
];

/**
 * Validation for querying property list
 */
const propertyListValidation = [
  query('bhk')
    .optional()
    .isInt({ min: 1 })
    .withMessage('BHK filter must be a positive integer'),
  query('status')
    .optional()
    .isIn(['Available', 'Rented', 'Under Maintenance'])
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

router.get('/', propertyListValidation, propertyController.getProperties);
router.post('/', propertyCreationValidation, propertyController.createProperty);
router.get('/:id', propertyController.getPropertyById);
router.put('/:id', propertyUpdateValidation, propertyController.updateProperty);
router.delete('/:id', propertyController.deleteProperty);

export default router;
