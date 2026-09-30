import express from 'express';
import mongoose from 'mongoose';
import { sendSuccess } from '../utils/response.js';

const router = express.Router();

const readyStateMap = {
  0: 'disconnected',
  1: 'connected',
  2: 'connecting',
  3: 'disconnecting'
};

/**
 * @route   GET /api/health and GET /api/v1/health
 * @desc    System health and database connectivity check
 * @access  Public
 */
router.get('/', (req, res) => {
  const dbStateCode = mongoose.connection.readyState;
  const dbState = readyStateMap[dbStateCode] || 'unknown';
  const isHealthy = dbStateCode === 1;

  const healthData = {
    service: 'LeaseLens Backend API',
    status: isHealthy ? 'healthy' : 'degraded',
    timestamp: new Date().toISOString(),
    uptimeSeconds: Math.floor(process.uptime()),
    database: {
      status: dbState,
      host: mongoose.connection.host || null,
      name: mongoose.connection.name || null
    },
    environment: process.env.NODE_ENV || 'development'
  };

  return sendSuccess(
    res,
    healthData,
    isHealthy ? 200 : 503,
    isHealthy ? 'System is healthy' : 'Database connection is degraded or disconnected'
  );
});

export default router;
