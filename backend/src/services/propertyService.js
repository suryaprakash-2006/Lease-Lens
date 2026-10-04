import mongoose from 'mongoose';
import Property from '../models/Property.js';
import Lease from '../models/Lease.js';
import Expense from '../models/Expense.js';

/**
 * Create a new property owned by authenticated user
 */
export const createProperty = async (userId, propertyData) => {
  // Ensure userId cannot be spoofed
  const data = {
    ...propertyData,
    userId
  };

  const property = await Property.create(data);
  return property;
};

/**
 * Retrieve user's properties with optional filtering and pagination
 */
export const getProperties = async (userId, query = {}) => {
  const {
    search,
    city,
    bhk,
    status,
    propertyType,
    furnishingStatus,
    page = 1,
    limit = 20,
    sortBy = 'createdAt',
    sortOrder = 'desc'
  } = query;

  // Base query strictly scoped to authenticated user
  const filter = { userId: new mongoose.Types.ObjectId(userId) };

  if (city) {
    filter['address.city'] = { $regex: new RegExp(`^${city.trim()}$`, 'i') };
  }

  if (bhk) {
    const bhkNum = Number(bhk);
    if (!isNaN(bhkNum)) {
      filter.bhk = bhkNum;
    }
  }

  if (status) {
    filter.status = status;
  }

  if (propertyType) {
    filter.propertyType = propertyType;
  }

  if (furnishingStatus) {
    filter.furnishingStatus = furnishingStatus;
  }

  if (search && search.trim()) {
    const searchRegex = new RegExp(search.trim(), 'i');
    filter.$or = [
      { title: searchRegex },
      { 'address.locality': searchRegex },
      { 'address.city': searchRegex }
    ];
  }

  const pageNum = Math.max(1, parseInt(page, 10) || 1);
  const limitNum = Math.min(100, Math.max(1, parseInt(limit, 10) || 20));
  const skip = (pageNum - 1) * limitNum;
  const sort = { [sortBy]: sortOrder === 'asc' ? 1 : -1 };

  const [properties, totalCount] = await Promise.all([
    Property.find(filter).sort(sort).skip(skip).limit(limitNum).lean(),
    Property.countDocuments(filter)
  ]);

  return {
    properties,
    pagination: {
      total: totalCount,
      page: pageNum,
      limit: limitNum,
      totalPages: Math.ceil(totalCount / limitNum) || 1
    }
  };
};

/**
 * Get detailed property by ID including its active lease and expense statistics
 */
export const getPropertyById = async (userId, propertyId) => {
  if (!mongoose.Types.ObjectId.isValid(propertyId)) {
    const error = new Error('Invalid property ID format');
    error.statusCode = 400;
    error.name = 'InvalidId';
    throw error;
  }

  const property = await Property.findOne({
    _id: propertyId,
    userId
  }).lean();

  if (!property) {
    const error = new Error('Property not found or access denied');
    error.statusCode = 404;
    error.name = 'NotFound';
    throw error;
  }

  // Fetch active lease details if any
  const activeLease = await Lease.findOne({
    propertyId,
    userId,
    status: 'Active'
  }).lean();

  // Aggregate total expenses for this property
  const expenseAggregation = await Expense.aggregate([
    {
      $match: {
        propertyId: new mongoose.Types.ObjectId(propertyId),
        userId: new mongoose.Types.ObjectId(userId)
      }
    },
    {
      $group: {
        _id: null,
        totalAmount: { $sum: '$amount' },
        count: { $sum: 1 }
      }
    }
  ]);

  const expenseSummary = {
    totalExpenses: expenseAggregation.length > 0 ? expenseAggregation[0].totalAmount : 0,
    expenseCount: expenseAggregation.length > 0 ? expenseAggregation[0].count : 0
  };

  return {
    property,
    activeLease: activeLease || null,
    expenseSummary
  };
};

/**
 * Update an existing property
 */
export const updateProperty = async (userId, propertyId, updateData) => {
  if (!mongoose.Types.ObjectId.isValid(propertyId)) {
    const error = new Error('Invalid property ID format');
    error.statusCode = 400;
    error.name = 'InvalidId';
    throw error;
  }

  // Prevent modifying ownership
  delete updateData.userId;
  delete updateData._id;

  const property = await Property.findOneAndUpdate(
    { _id: propertyId, userId },
    { $set: updateData },
    { new: true, runValidators: true }
  );

  if (!property) {
    const error = new Error('Property not found or access denied');
    error.statusCode = 404;
    error.name = 'NotFound';
    throw error;
  }

  return property;
};

/**
 * Delete a property with active lease safeguard
 */
export const deleteProperty = async (userId, propertyId) => {
  if (!mongoose.Types.ObjectId.isValid(propertyId)) {
    const error = new Error('Invalid property ID format');
    error.statusCode = 400;
    error.name = 'InvalidId';
    throw error;
  }

  const property = await Property.findOne({ _id: propertyId, userId });
  if (!property) {
    const error = new Error('Property not found or access denied');
    error.statusCode = 404;
    error.name = 'NotFound';
    throw error;
  }

  // Safeguard: Check if an Active lease is currently attached to this property
  const activeLease = await Lease.findOne({
    propertyId,
    userId,
    status: 'Active'
  });

  if (activeLease) {
    const error = new Error(
      'Cannot delete property with an active lease agreement. Please terminate or expire the lease first.'
    );
    error.statusCode = 409;
    error.name = 'Conflict';
    throw error;
  }

  await Property.deleteOne({ _id: propertyId, userId });

  return { message: 'Property deleted successfully', propertyId };
};
