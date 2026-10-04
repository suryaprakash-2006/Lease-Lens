import * as expenseService from '../services/expenseService.js';
import { sendSuccess } from '../utils/response.js';

/**
 * @route   GET /api/v1/expenses
 * @desc    Get all expenses for authenticated user with filters
 * @access  Private
 */
export const getExpenses = async (req, res, next) => {
  try {
    const result = await expenseService.getExpenses(req.user._id, req.query);
    return sendSuccess(res, result, 200, 'Expenses retrieved successfully');
  } catch (error) {
    next(error);
  }
};

/**
 * @route   POST /api/v1/expenses
 * @desc    Create a new expense record
 * @access  Private
 */
export const createExpense = async (req, res, next) => {
  try {
    const expense = await expenseService.createExpense(req.user._id, req.body);
    return sendSuccess(res, expense, 201, 'Expense logged successfully');
  } catch (error) {
    next(error);
  }
};

/**
 * @route   GET /api/v1/expenses/summary
 * @desc    Get aggregated expense summary and breakdowns
 * @access  Private
 */
export const getExpenseSummary = async (req, res, next) => {
  try {
    const summary = await expenseService.getExpenseSummary(req.user._id, req.query);
    return sendSuccess(res, summary, 200, 'Expense summary calculated successfully');
  } catch (error) {
    next(error);
  }
};

/**
 * @route   GET /api/v1/expenses/:id
 * @desc    Get single expense details by ID
 * @access  Private
 */
export const getExpenseById = async (req, res, next) => {
  try {
    const expense = await expenseService.getExpenseById(req.user._id, req.params.id);
    return sendSuccess(res, expense, 200, 'Expense retrieved successfully');
  } catch (error) {
    next(error);
  }
};

/**
 * @route   PUT /api/v1/expenses/:id
 * @desc    Update an expense record
 * @access  Private
 */
export const updateExpense = async (req, res, next) => {
  try {
    const expense = await expenseService.updateExpense(req.user._id, req.params.id, req.body);
    return sendSuccess(res, expense, 200, 'Expense updated successfully');
  } catch (error) {
    next(error);
  }
};

/**
 * @route   DELETE /api/v1/expenses/:id
 * @desc    Delete an expense record
 * @access  Private
 */
export const deleteExpense = async (req, res, next) => {
  try {
    const result = await expenseService.deleteExpense(req.user._id, req.params.id);
    return sendSuccess(res, result, 200, 'Expense deleted successfully');
  } catch (error) {
    next(error);
  }
};
