import express from 'express';
import * as dashboardController from '../controllers/dashboardController.js';
import { protect } from '../middleware/authMiddleware.js';

const router = express.Router();

// Protect all dashboard routes
router.use(protect);

router.get('/metrics', dashboardController.getMetrics);
router.get('/upcoming-events', dashboardController.getUpcomingEvents);
router.get('/expense-chart', dashboardController.getExpenseChart);
router.get('/recent-activity', dashboardController.getRecentActivity);

export default router;
