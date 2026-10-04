import mongoose from 'mongoose';
import Property from '../models/Property.js';
import Lease from '../models/Lease.js';
import Expense from '../models/Expense.js';
import { getUpcomingLeaseEvents } from './leaseService.js';

/**
 * Calculate high-level KPI dashboard metrics for authenticated user
 */
export const getDashboardMetrics = async (userId) => {
  const userObjectId = new mongoose.Types.ObjectId(userId);

  const now = new Date();
  const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
  const endOfMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59, 999);

  // Parallel aggregations for performance
  const [
    propertyStats,
    leaseStats,
    allTimeExpenseStats,
    monthlyExpenseStats
  ] = await Promise.all([
    // Property counts grouped by status
    Property.aggregate([
      { $match: { userId: userObjectId } },
      {
        $group: {
          _id: '$status',
          count: { $sum: 1 }
        }
      }
    ]),

    // Lease stats (active counts and sum of monthly rents)
    Lease.aggregate([
      { $match: { userId: userObjectId } },
      {
        $group: {
          _id: '$status',
          count: { $sum: 1 },
          totalMonthlyRent: {
            $sum: {
              $cond: [{ $eq: ['$status', 'Active'] }, '$monthlyRent', 0]
            }
          }
        }
      }
    ]),

    // All-time expenses
    Expense.aggregate([
      { $match: { userId: userObjectId } },
      {
        $group: {
          _id: null,
          totalAmount: { $sum: '$amount' },
          count: { $sum: 1 }
        }
      }
    ]),

    // Current month expenses
    Expense.aggregate([
      {
        $match: {
          userId: userObjectId,
          expenseDate: { $gte: startOfMonth, $lte: endOfMonth }
        }
      },
      {
        $group: {
          _id: null,
          monthlyTotal: { $sum: '$amount' },
          count: { $sum: 1 }
        }
      }
    ])
  ]);

  // Parse Property metrics
  let totalProperties = 0;
  let availableProperties = 0;
  let rentedProperties = 0;
  let maintenanceProperties = 0;

  for (const item of propertyStats) {
    totalProperties += item.count;
    if (item._id === 'Available') availableProperties = item.count;
    if (item._id === 'Rented') rentedProperties = item.count;
    if (item._id === 'Under Maintenance') maintenanceProperties = item.count;
  }

  // Parse Lease metrics
  let activeLeases = 0;
  let upcomingLeases = 0;
  let expiredLeases = 0;
  let terminatedLeases = 0;
  let totalMonthlyRent = 0;

  for (const item of leaseStats) {
    if (item._id === 'Active') {
      activeLeases = item.count;
      totalMonthlyRent += item.totalMonthlyRent;
    } else if (item._id === 'Upcoming') {
      upcomingLeases = item.count;
    } else if (item._id === 'Expired') {
      expiredLeases = item.count;
    } else if (item._id === 'Terminated') {
      terminatedLeases = item.count;
    }
  }

  // Parse Expense metrics
  const totalExpenses = allTimeExpenseStats.length > 0 ? allTimeExpenseStats[0].totalAmount : 0;
  const currentMonthExpenses = monthlyExpenseStats.length > 0 ? monthlyExpenseStats[0].monthlyTotal : 0;
  const netMonthlyCashFlow = totalMonthlyRent - currentMonthExpenses;
  const occupancyRate = totalProperties > 0
    ? Number(((rentedProperties / totalProperties) * 100).toFixed(1))
    : 0;

  return {
    properties: {
      total: totalProperties,
      available: availableProperties,
      rented: rentedProperties,
      underMaintenance: maintenanceProperties,
      occupancyRate
    },
    leases: {
      active: activeLeases,
      upcoming: upcomingLeases,
      expired: expiredLeases,
      terminated: terminatedLeases,
      totalMonthlyRent
    },
    expenses: {
      totalAllTime: totalExpenses,
      currentMonth: currentMonthExpenses
    },
    financials: {
      monthlyRentalIncome: totalMonthlyRent,
      monthlyExpenses: currentMonthExpenses,
      netMonthlyCashFlow
    }
  };
};

/**
 * Retrieve time series and categorical expense breakdown for charts
 */
export const getExpenseChartData = async (userId, months = 6) => {
  const userObjectId = new mongoose.Types.ObjectId(userId);
  const monthCount = Math.min(24, Math.max(1, parseInt(months, 10) || 6));

  const now = new Date();
  const startDate = new Date(now.getFullYear(), now.getMonth() - (monthCount - 1), 1);

  // Time-series monthly aggregation
  const monthlyAgg = await Expense.aggregate([
    {
      $match: {
        userId: userObjectId,
        expenseDate: { $gte: startDate }
      }
    },
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
    { $sort: { '_id.year': 1, '_id.month': 1 } }
  ]);

  // Category breakdown over same time window
  const categoryAgg = await Expense.aggregate([
    {
      $match: {
        userId: userObjectId,
        expenseDate: { $gte: startDate }
      }
    },
    {
      $group: {
        _id: '$category',
        totalAmount: { $sum: '$amount' },
        count: { $sum: 1 }
      }
    },
    { $sort: { totalAmount: -1 } }
  ]);

  // Build complete month timeline with 0s for missing months
  const monthlyTimeline = [];
  const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

  for (let i = monthCount - 1; i >= 0; i--) {
    const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
    const y = d.getFullYear();
    const m = d.getMonth() + 1;

    const matched = monthlyAgg.find(
      (entry) => entry._id.year === y && entry._id.month === m
    );

    monthlyTimeline.push({
      year: y,
      month: m,
      label: `${monthNames[m - 1]} ${y}`,
      totalAmount: matched ? matched.totalAmount : 0,
      count: matched ? matched.count : 0
    });
  }

  const totalPeriodExpenses = categoryAgg.reduce((acc, curr) => acc + curr.totalAmount, 0);

  const categories = categoryAgg.map((item) => ({
    category: item._id,
    totalAmount: item.totalAmount,
    count: item.count,
    percentage: totalPeriodExpenses > 0
      ? Number(((item.totalAmount / totalPeriodExpenses) * 100).toFixed(2))
      : 0
  }));

  return {
    timeframeMonths: monthCount,
    totalPeriodExpenses,
    monthlyTimeline,
    categories
  };
};

/**
 * Retrieve real recent portfolio activity for authenticated user
 */
export const getRecentActivity = async (userId, limit = 10) => {
  const userObjectId = new mongoose.Types.ObjectId(userId);
  const limitCount = Math.min(50, Math.max(1, parseInt(limit, 10) || 10));

  const [recentProperties, recentLeases, recentExpenses] = await Promise.all([
    Property.find({ userId: userObjectId })
      .sort({ createdAt: -1 })
      .limit(limitCount)
      .select('title address status createdAt')
      .lean(),
    Lease.find({ userId: userObjectId })
      .sort({ createdAt: -1 })
      .limit(limitCount)
      .populate('propertyId', 'title')
      .select('tenant monthlyRent status startDate endDate createdAt')
      .lean(),
    Expense.find({ userId: userObjectId })
      .sort({ expenseDate: -1, createdAt: -1 })
      .limit(limitCount)
      .populate('propertyId', 'title')
      .select('title category amount expenseDate createdAt')
      .lean()
  ]);

  const activities = [];

  for (const prop of recentProperties) {
    activities.push({
      type: 'PROPERTY',
      action: 'Property Listed',
      title: prop.title,
      subtitle: `${prop.address.locality}, ${prop.address.city}`,
      status: prop.status,
      timestamp: prop.createdAt,
      refId: prop._id
    });
  }

  for (const lease of recentLeases) {
    activities.push({
      type: 'LEASE',
      action: `Lease ${lease.status}`,
      title: lease.propertyId ? lease.propertyId.title : 'Lease Agreement',
      subtitle: `Tenant: ${lease.tenant.name} · ₹${lease.monthlyRent.toLocaleString('en-IN')}/mo`,
      status: lease.status,
      timestamp: lease.createdAt,
      refId: lease._id
    });
  }

  for (const exp of recentExpenses) {
    activities.push({
      type: 'EXPENSE',
      action: 'Expense Logged',
      title: exp.title,
      subtitle: `${exp.category} · ₹${exp.amount.toLocaleString('en-IN')}${exp.propertyId ? ` (${exp.propertyId.title})` : ''}`,
      amount: exp.amount,
      timestamp: exp.expenseDate || exp.createdAt,
      refId: exp._id
    });
  }

  // Sort unified feed chronologically descending
  activities.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());

  return {
    activity: activities.slice(0, limitCount)
  };
};

export { getUpcomingLeaseEvents };
