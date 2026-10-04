import mongoose from 'mongoose';
import Lease from '../models/Lease.js';
import Property from '../models/Property.js';

/**
 * Determine lifecycle status based on dates unless already terminated
 */
export const computeLifecycleStatus = (startDate, endDate, currentStatus) => {
  if (currentStatus === 'Terminated') {
    return 'Terminated';
  }

  const now = new Date();
  const start = new Date(startDate);
  const end = new Date(endDate);

  if (start > now) {
    return 'Upcoming';
  } else if (start <= now && end >= now) {
    return 'Active';
  } else {
    return 'Expired';
  }
};

/**
 * Create a new lease agreement
 */
export const createLease = async (userId, leaseData) => {
  const { propertyId, startDate, endDate } = leaseData;

  if (!mongoose.Types.ObjectId.isValid(propertyId)) {
    const error = new Error('Invalid property ID format');
    error.statusCode = 400;
    error.name = 'InvalidId';
    throw error;
  }

  // Security Check: Verify property exists and is owned by the authenticated user
  const property = await Property.findOne({ _id: propertyId, userId });
  if (!property) {
    const error = new Error('Associated property not found or does not belong to you');
    error.statusCode = 404;
    error.name = 'NotFound';
    throw error;
  }

  const start = new Date(startDate);
  const end = new Date(endDate);
  if (isNaN(start.getTime()) || isNaN(end.getTime())) {
    const error = new Error('Invalid start or end date format');
    error.statusCode = 400;
    error.name = 'ValidationError';
    throw error;
  }

  if (start >= end) {
    const error = new Error('Lease start date must be strictly before the end date');
    error.statusCode = 400;
    error.name = 'ValidationError';
    throw error;
  }

  // Compute status based on start & end dates
  const calculatedStatus = computeLifecycleStatus(start, end, leaseData.status);

  const newLease = await Lease.create({
    ...leaseData,
    userId,
    status: calculatedStatus
  });

  // If lease is active immediately, synchronize property status to 'Rented'
  if (calculatedStatus === 'Active' && property.status !== 'Rented') {
    property.status = 'Rented';
    await property.save();
  }

  return await Lease.findById(newLease._id).populate(
    'propertyId',
    'title address propertyType bhk listedRent status'
  );
};

/**
 * Get all leases for authenticated user with filters
 */
export const getLeases = async (userId, query = {}) => {
  const { propertyId, status, expiringSoon, page = 1, limit = 20 } = query;

  const filter = { userId: new mongoose.Types.ObjectId(userId) };

  if (propertyId && mongoose.Types.ObjectId.isValid(propertyId)) {
    filter.propertyId = new mongoose.Types.ObjectId(propertyId);
  }

  if (status) {
    filter.status = status;
  }

  if (expiringSoon === 'true' || expiringSoon === true) {
    const now = new Date();
    const thirtyDaysFromNow = new Date();
    thirtyDaysFromNow.setDate(now.getDate() + 30);

    filter.status = 'Active';
    filter.endDate = { $gte: now, $lte: thirtyDaysFromNow };
  }

  const pageNum = Math.max(1, parseInt(page, 10) || 1);
  const limitNum = Math.min(100, Math.max(1, parseInt(limit, 10) || 20));
  const skip = (pageNum - 1) * limitNum;

  const [leases, totalCount] = await Promise.all([
    Lease.find(filter)
      .populate('propertyId', 'title address propertyType bhk listedRent status')
      .sort({ startDate: -1 })
      .skip(skip)
      .limit(limitNum)
      .lean(),
    Lease.countDocuments(filter)
  ]);

  return {
    leases,
    pagination: {
      total: totalCount,
      page: pageNum,
      limit: limitNum,
      totalPages: Math.ceil(totalCount / limitNum) || 1
    }
  };
};

/**
 * Get detailed lease agreement by ID
 */
export const getLeaseById = async (userId, leaseId) => {
  if (!mongoose.Types.ObjectId.isValid(leaseId)) {
    const error = new Error('Invalid lease ID format');
    error.statusCode = 400;
    error.name = 'InvalidId';
    throw error;
  }

  const lease = await Lease.findOne({ _id: leaseId, userId })
    .populate('propertyId', 'title address propertyType bhk listedRent status')
    .lean();

  if (!lease) {
    const error = new Error('Lease agreement not found or access denied');
    error.statusCode = 404;
    error.name = 'NotFound';
    throw error;
  }

  return lease;
};

/**
 * Update lease terms
 */
export const updateLease = async (userId, leaseId, updateData) => {
  if (!mongoose.Types.ObjectId.isValid(leaseId)) {
    const error = new Error('Invalid lease ID format');
    error.statusCode = 400;
    error.name = 'InvalidId';
    throw error;
  }

  const existingLease = await Lease.findOne({ _id: leaseId, userId });
  if (!existingLease) {
    const error = new Error('Lease agreement not found or access denied');
    error.statusCode = 404;
    error.name = 'NotFound';
    throw error;
  }

  // Prevent modifying userId
  delete updateData.userId;
  delete updateData._id;

  // If changing propertyId, verify new property belongs to user
  if (updateData.propertyId && updateData.propertyId.toString() !== existingLease.propertyId.toString()) {
    const propExists = await Property.findOne({ _id: updateData.propertyId, userId });
    if (!propExists) {
      const error = new Error('Target property not found or does not belong to you');
      error.statusCode = 404;
      error.name = 'NotFound';
      throw error;
    }
  }

  const startDate = updateData.startDate || existingLease.startDate;
  const endDate = updateData.endDate || existingLease.endDate;

  if (new Date(startDate) >= new Date(endDate)) {
    const error = new Error('Lease start date must be strictly before the end date');
    error.statusCode = 400;
    error.name = 'ValidationError';
    throw error;
  }

  // Re-evaluate lifecycle status unless explicitly Terminated
  if (!updateData.status) {
    updateData.status = computeLifecycleStatus(startDate, endDate, existingLease.status);
  }

  const updatedLease = await Lease.findOneAndUpdate(
    { _id: leaseId, userId },
    { $set: updateData },
    { new: true, runValidators: true }
  ).populate('propertyId', 'title address propertyType bhk listedRent status');

  return updatedLease;
};

/**
 * Explicitly transition lease status (e.g. to 'Terminated')
 */
export const updateLeaseStatus = async (userId, leaseId, newStatus) => {
  if (!mongoose.Types.ObjectId.isValid(leaseId)) {
    const error = new Error('Invalid lease ID format');
    error.statusCode = 400;
    error.name = 'InvalidId';
    throw error;
  }

  const validStatuses = ['Active', 'Upcoming', 'Expired', 'Terminated'];
  if (!validStatuses.includes(newStatus)) {
    const error = new Error(`Invalid status '${newStatus}'. Allowed: ${validStatuses.join(', ')}`);
    error.statusCode = 400;
    error.name = 'ValidationError';
    throw error;
  }

  const lease = await Lease.findOne({ _id: leaseId, userId });
  if (!lease) {
    const error = new Error('Lease agreement not found or access denied');
    error.statusCode = 404;
    error.name = 'NotFound';
    throw error;
  }

  lease.status = newStatus;
  await lease.save();

  // If terminated or expired, update property status back to Available if no other active leases exist
  if (newStatus === 'Terminated' || newStatus === 'Expired') {
    const otherActive = await Lease.findOne({
      propertyId: lease.propertyId,
      userId,
      _id: { $ne: lease._id },
      status: 'Active'
    });

    if (!otherActive) {
      await Property.updateOne(
        { _id: lease.propertyId, userId },
        { status: 'Available' }
      );
    }
  } else if (newStatus === 'Active') {
    await Property.updateOne(
      { _id: lease.propertyId, userId },
      { status: 'Rented' }
    );
  }

  return await Lease.findById(leaseId).populate(
    'propertyId',
    'title address propertyType bhk listedRent status'
  );
};

/**
 * Delete a lease agreement
 */
export const deleteLease = async (userId, leaseId) => {
  if (!mongoose.Types.ObjectId.isValid(leaseId)) {
    const error = new Error('Invalid lease ID format');
    error.statusCode = 400;
    error.name = 'InvalidId';
    throw error;
  }

  const lease = await Lease.findOne({ _id: leaseId, userId });
  if (!lease) {
    const error = new Error('Lease agreement not found or access denied');
    error.statusCode = 404;
    error.name = 'NotFound';
    throw error;
  }

  await Lease.deleteOne({ _id: leaseId, userId });

  // If the deleted lease was Active, check if property needs status reset to Available
  if (lease.status === 'Active') {
    const remainingActive = await Lease.findOne({
      propertyId: lease.propertyId,
      userId,
      status: 'Active'
    });
    if (!remainingActive) {
      await Property.updateOne(
        { _id: lease.propertyId, userId },
        { status: 'Available' }
      );
    }
  }

  return { message: 'Lease deleted successfully', leaseId };
};

/**
 * Identify leases expiring or starting in next N days (default 30 days)
 */
export const getUpcomingLeaseEvents = async (userId, daysAhead = 30) => {
  const now = new Date();
  const futureThreshold = new Date();
  futureThreshold.setDate(now.getDate() + Number(daysAhead));

  const leases = await Lease.find({
    userId: new mongoose.Types.ObjectId(userId),
    $or: [
      // Active leases expiring within window
      {
        status: 'Active',
        endDate: { $gte: now, $lte: futureThreshold }
      },
      // Upcoming leases starting within window
      {
        status: 'Upcoming',
        startDate: { $gte: now, $lte: futureThreshold }
      }
    ]
  })
    .populate('propertyId', 'title address propertyType bhk status')
    .sort({ endDate: 1, startDate: 1 })
    .lean();

  return leases.map((lease) => {
    const targetDate = lease.status === 'Active' ? new Date(lease.endDate) : new Date(lease.startDate);
    const diffTime = targetDate.getTime() - now.getTime();
    const daysRemaining = Math.max(0, Math.ceil(diffTime / (1000 * 60 * 60 * 24)));

    return {
      _id: lease._id,
      eventType: lease.status === 'Active' ? 'EXPIRATION' : 'COMMENCEMENT',
      daysRemaining,
      targetDate,
      status: lease.status,
      monthlyRent: lease.monthlyRent,
      tenant: lease.tenant,
      property: lease.propertyId
    };
  });
};
