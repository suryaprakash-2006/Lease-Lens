import * as dashboardService from '../services/dashboardService.js';
import { sendSuccess } from '../utils/response.js';

/**
 * @route   GET /api/v1/dashboard/metrics
 * @desc    Get portfolio KPI metrics (properties, leases, rent income, expenses)
 * @access  Private
 */
export const getMetrics = async (req, res, next) => {
  try {
    const metrics = await dashboardService.getDashboardMetrics(req.user._id);
    return sendSuccess(res, metrics, 200, 'Dashboard metrics calculated successfully');
  } catch (error) {
    next(error);
  }
};

/**
 * @route   GET /api/v1/dashboard/upcoming-events
 * @desc    Get upcoming lease events (expirations and upcoming moves)
 * @access  Private
 */
export const getUpcomingEvents = async (req, res, next) => {
  try {
    const daysAhead = req.query.days ? parseInt(req.query.days, 10) : 30;
    const events = await dashboardService.getUpcomingLeaseEvents(req.user._id, daysAhead);
    return sendSuccess(res, { events }, 200, 'Upcoming events retrieved successfully');
  } catch (error) {
    next(error);
  }
};

/**
 * @route   GET /api/v1/dashboard/expense-chart
 * @desc    Get expense time-series and category breakdown chart data
 * @access  Private
 */
export const getExpenseChart = async (req, res, next) => {
  try {
    const months = req.query.months ? parseInt(req.query.months, 10) : 6;
    const chartData = await dashboardService.getExpenseChartData(req.user._id, months);
    return sendSuccess(res, chartData, 200, 'Expense chart data retrieved successfully');
  } catch (error) {
    next(error);
  }
};

/**
 * @route   GET /api/v1/dashboard/recent-activity
 * @desc    Get recent portfolio activity feed
 * @access  Private
 */
export const getRecentActivity = async (req, res, next) => {
  try {
    const limit = req.query.limit ? parseInt(req.query.limit, 10) : 10;
    const activityData = await dashboardService.getRecentActivity(req.user._id, limit);
    return sendSuccess(res, activityData, 200, 'Recent activity retrieved successfully');
  } catch (error) {
    next(error);
  }
};
