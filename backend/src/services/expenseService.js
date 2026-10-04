import mongoose from 'mongoose';
import Expense from '../models/Expense.js';
import Property from '../models/Property.js';

/**
 * Create a new expense entry
 */
export const createExpense = async (userId, expenseData) => {
  const { propertyId, expenseDate } = expenseData;

  // If associated with a property, ensure the property belongs to the user
  if (propertyId) {
    if (!mongoose.Types.ObjectId.isValid(propertyId)) {
      const error = new Error('Invalid property ID format');
      error.statusCode = 400;
      error.name = 'InvalidId';
      throw error;
    }

    const property = await Property.findOne({ _id: propertyId, userId });
    if (!property) {
      const error = new Error('Associated property not found or access denied');
      error.statusCode = 404;
      error.name = 'NotFound';
      throw error;
    }
  }

  const expense = await Expense.create({
    ...expenseData,
    userId,
    expenseDate: expenseDate ? new Date(expenseDate) : new Date()
  });

  return await Expense.findById(expense._id).populate('propertyId', 'title address bhk');
};

/**
 * Get all expenses for authenticated user with flexible filtering
 */
export const getExpenses = async (userId, query = {}) => {
  const {
    propertyId,
    category,
    startDate,
    endDate,
    month,
    year,
    page = 1,
    limit = 20
  } = query;

  const filter = { userId: new mongoose.Types.ObjectId(userId) };

  if (propertyId) {
    if (propertyId === 'unassigned') {
      filter.propertyId = null;
    } else if (mongoose.Types.ObjectId.isValid(propertyId)) {
      filter.propertyId = new mongoose.Types.ObjectId(propertyId);
    }
  }

  if (category) {
    filter.category = category;
  }

  // Date filtering
  if (startDate || endDate) {
    filter.expenseDate = {};
    if (startDate) filter.expenseDate.$gte = new Date(startDate);
    if (endDate) filter.expenseDate.$lte = new Date(endDate);
  } else if (year || month) {
    const yr = year ? parseInt(year, 10) : new Date().getFullYear();
    if (month) {
      const mo = parseInt(month, 10) - 1; // 0-indexed month
      const startOfMonth = new Date(yr, mo, 1);
      const endOfMonth = new Date(yr, mo + 1, 0, 23, 59, 59, 999);
      filter.expenseDate = { $gte: startOfMonth, $lte: endOfMonth };
    } else {
      const startOfYear = new Date(yr, 0, 1);
      const endOfYear = new Date(yr, 11, 31, 23, 59, 59, 999);
      filter.expenseDate = { $gte: startOfYear, $lte: endOfYear };
    }
  }

  const pageNum = Math.max(1, parseInt(page, 10) || 1);
  const limitNum = Math.min(100, Math.max(1, parseInt(limit, 10) || 20));
  const skip = (pageNum - 1) * limitNum;

  const [expenses, totalCount] = await Promise.all([
    Expense.find(filter)
      .populate('propertyId', 'title address bhk')
      .sort({ expenseDate: -1, createdAt: -1 })
      .skip(skip)
      .limit(limitNum)
      .lean(),
    Expense.countDocuments(filter)
  ]);

  return {
    expenses,
    pagination: {
      total: totalCount,
      page: pageNum,
      limit: limitNum,
      totalPages: Math.ceil(totalCount / limitNum) || 1
    }
  };
};

/**
 * Get single expense record by ID
 */
export const getExpenseById = async (userId, expenseId) => {
  if (!mongoose.Types.ObjectId.isValid(expenseId)) {
    const error = new Error('Invalid expense ID format');
    error.statusCode = 400;
    error.name = 'InvalidId';
    throw error;
  }

  const expense = await Expense.findOne({ _id: expenseId, userId })
    .populate('propertyId', 'title address bhk')
    .lean();

  if (!expense) {
    const error = new Error('Expense record not found or access denied');
    error.statusCode = 404;
    error.name = 'NotFound';
    throw error;
  }

  return expense;
};

/**
 * Update an existing expense record
 */
export const updateExpense = async (userId, expenseId, updateData) => {
  if (!mongoose.Types.ObjectId.isValid(expenseId)) {
    const error = new Error('Invalid expense ID format');
    error.statusCode = 400;
    error.name = 'InvalidId';
    throw error;
  }

  // Prevent modifying userId
  delete updateData.userId;
  delete updateData._id;

  if (updateData.propertyId) {
    const property = await Property.findOne({ _id: updateData.propertyId, userId });
    if (!property) {
      const error = new Error('Target property not found or does not belong to you');
      error.statusCode = 404;
      error.name = 'NotFound';
      throw error;
    }
  }

  if (updateData.expenseDate) {
    updateData.expenseDate = new Date(updateData.expenseDate);
  }

  const updatedExpense = await Expense.findOneAndUpdate(
    { _id: expenseId, userId },
    { $set: updateData },
    { new: true, runValidators: true }
  ).populate('propertyId', 'title address bhk');

  if (!updatedExpense) {
    const error = new Error('Expense record not found or access denied');
    error.statusCode = 404;
    error.name = 'NotFound';
    throw error;
  }

  return updatedExpense;
};

/**
 * Delete an expense record
 */
export const deleteExpense = async (userId, expenseId) => {
  if (!mongoose.Types.ObjectId.isValid(expenseId)) {
    const error = new Error('Invalid expense ID format');
    error.statusCode = 400;
    error.name = 'InvalidId';
    throw error;
  }

  const expense = await Expense.findOne({ _id: expenseId, userId });
  if (!expense) {
    const error = new Error('Expense record not found or access denied');
    error.statusCode = 404;
    error.name = 'NotFound';
    throw error;
  }

  await Expense.deleteOne({ _id: expenseId, userId });

  return { message: 'Expense deleted successfully', expenseId };
};

/**
 * Aggregated summary of expenses using MongoDB aggregation pipelines
 */
export const getExpenseSummary = async (userId, query = {}) => {
  const { propertyId, startDate, endDate, year } = query;

  const matchFilter = { userId: new mongoose.Types.ObjectId(userId) };

  if (propertyId && mongoose.Types.ObjectId.isValid(propertyId)) {
    matchFilter.propertyId = new mongoose.Types.ObjectId(propertyId);
  }

  if (startDate || endDate) {
    matchFilter.expenseDate = {};
    if (startDate) matchFilter.expenseDate.$gte = new Date(startDate);
    if (endDate) matchFilter.expenseDate.$lte = new Date(endDate);
  } else if (year) {
    const yr = parseInt(year, 10);
    matchFilter.expenseDate = {
      $gte: new Date(yr, 0, 1),
      $lte: new Date(yr, 11, 31, 23, 59, 59, 999)
    };
  }

  const summary = await Expense.aggregate([
    { $match: matchFilter },
    {
      $facet: {
        overall: [
          {
            $group: {
              _id: null,
              totalAmount: { $sum: '$amount' },
              totalCount: { $sum: 1 },
              averageAmount: { $avg: '$amount' }
            }
          }
        ],
        byCategory: [
          {
            $group: {
              _id: '$category',
              category: { $first: '$category' },
              totalAmount: { $sum: '$amount' },
              count: { $sum: 1 }
            }
          },
          { $sort: { totalAmount: -1 } }
        ],
        byMonth: [
          {
            $group: {
              _id: {
                year: { $year: '$expenseDate' },
                month: { $month: '$expenseDate' }
              },
              totalAmount: { $sum: '$amount' },
              count: { $sum: 1 }
            }
          },
          { $sort: { '_id.year': -1, '_id.month': -1 } }
        ]
      }
    }
  ]);

  const facetResult = summary[0] || {};
  const overallStats = facetResult.overall && facetResult.overall.length > 0
    ? facetResult.overall[0]
    : { totalAmount: 0, totalCount: 0, averageAmount: 0 };

  const byCategory = (facetResult.byCategory || []).map((cat) => ({
    category: cat._id,
    totalAmount: cat.totalAmount,
    count: cat.count,
    percentage: overallStats.totalAmount > 0
      ? Number(((cat.totalAmount / overallStats.totalAmount) * 100).toFixed(2))
      : 0
  }));

  const byMonth = (facetResult.byMonth || []).map((m) => ({
    year: m._id.year,
    month: m._id.month,
    totalAmount: m.totalAmount,
    count: m.count
  }));

  return {
    totalExpenses: overallStats.totalAmount,
    expenseCount: overallStats.totalCount,
    averageExpense: Math.round(overallStats.averageAmount || 0),
    byCategory,
    byMonth
  };
};
