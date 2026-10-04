import express from 'express';
import { body, query } from 'express-validator';
import * as expenseController from '../controllers/expenseController.js';
import { protect } from '../middleware/authMiddleware.js';
import { validate } from '../middleware/validatorMiddleware.js';

const router = express.Router();

// Protect all expense routes
router.use(protect);

/**
 * Validation for logging a new expense
 */
const expenseCreationValidation = [
  body('propertyId')
    .optional({ nullable: true, checkFalsy: true })
    .isMongoId()
    .withMessage('Invalid propertyId format'),
  body('title')
    .trim()
    .notEmpty()
    .withMessage('Expense title is required')
    .isLength({ min: 2, max: 120 })
    .withMessage('Expense title must be between 2 and 120 characters'),
  body('category')
    .notEmpty()
    .withMessage('Expense category is required')
    .isIn(['Maintenance', 'Electricity', 'Water', 'Internet', 'Repairs', 'Taxes', 'Other', 'Rent'])
    .withMessage('Invalid expense category'),
  body('amount')
    .notEmpty()
    .withMessage('Expense amount is required')
    .isFloat({ min: 0 })
    .withMessage('Expense amount must be a non-negative number'),
  body('expenseDate')
    .notEmpty()
    .withMessage('Expense date is required')
    .isISO8601()
    .withMessage('Expense date must be a valid ISO 8601 date string'),
  body('isRecurringMonthly')
    .optional()
    .isBoolean()
    .withMessage('isRecurringMonthly must be a boolean'),
  validate
];

/**
 * Validation for updating an expense
 */
const expenseUpdateValidation = [
  body('propertyId')
    .optional({ nullable: true })
    .custom((val) => val === null || /^[0-9a-fA-F]{24}$/.test(val))
    .withMessage('Invalid propertyId format'),
  body('title')
    .optional()
    .trim()
    .isLength({ min: 2, max: 120 })
    .withMessage('Expense title must be between 2 and 120 characters'),
  body('category')
    .optional()
    .isIn(['Maintenance', 'Electricity', 'Water', 'Internet', 'Repairs', 'Taxes', 'Other', 'Rent'])
    .withMessage('Invalid expense category'),
  body('amount')
    .optional()
    .isFloat({ min: 0 })
    .withMessage('Expense amount must be a non-negative number'),
  body('expenseDate')
    .optional()
    .isISO8601()
    .withMessage('Expense date must be a valid ISO 8601 date string'),
  body('isRecurringMonthly')
    .optional()
    .isBoolean()
    .withMessage('isRecurringMonthly must be a boolean'),
  validate
];

/**
 * Validation for listing expenses
 */
const expenseListValidation = [
  query('category')
    .optional()
    .isIn(['Maintenance', 'Electricity', 'Water', 'Internet', 'Repairs', 'Taxes', 'Other', 'Rent'])
    .withMessage('Invalid category filter'),
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

router.get('/summary', expenseController.getExpenseSummary);
router.get('/', expenseListValidation, expenseController.getExpenses);
router.post('/', expenseCreationValidation, expenseController.createExpense);
router.get('/:id', expenseController.getExpenseById);
router.put('/:id', expenseUpdateValidation, expenseController.updateExpense);
router.delete('/:id', expenseController.deleteExpense);

export default router;
