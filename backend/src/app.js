import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import dotenv from 'dotenv';

import authRoutes from './routes/authRoutes.js';
import propertyRoutes from './routes/propertyRoutes.js';
import leaseRoutes from './routes/leaseRoutes.js';
import expenseRoutes from './routes/expenseRoutes.js';
import dashboardRoutes from './routes/dashboardRoutes.js';
import healthRoutes from './routes/healthRoutes.js';
import { notFoundHandler, errorHandler } from './middleware/errorMiddleware.js';

import predictRoutes from './routes/predictRoutes.js';
// Load environment variables
dotenv.config();

const app = express();

// Security HTTP headers
app.use(helmet());

// Cross-Origin Resource Sharing
const clientOrigin = process.env.CLIENT_URL || 'http://localhost:5173';
app.use(
  cors({
    origin: (origin, callback) => {
      // Allow requests with no origin (e.g. mobile apps, curl, postman) or matching frontend
      if (!origin || origin === clientOrigin || origin === 'http://localhost:3000') {
        callback(null, true);
      } else {
        callback(null, true); // Permissive during academic dev; lock down in prod
      }
    },
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization']
  })
);

// Body parsers
app.use(express.json({ limit: '1mb' }));
app.use(express.urlencoded({ extended: true, limit: '1mb' }));

// HTTP request logging (disabled during automated test runs)
if (process.env.NODE_ENV !== 'test') {
  app.use(morgan('dev'));
}

// System Health Endpoints
app.use('/api/health', healthRoutes);
app.use('/api/v1/health', healthRoutes);

// Core API Routes
app.use('/api/v1/auth', authRoutes);
app.use('/api/v1/properties', propertyRoutes);
app.use('/api/v1/leases', leaseRoutes);
app.use('/api/v1/expenses', expenseRoutes);
app.use('/api/v1/dashboard', dashboardRoutes);

app.use('/api/v1/predict', predictRoutes);
// Root route
app.get('/', (req, res) => {
  res.json({
    message: 'Welcome to LeaseLens REST API Service',
    docs: '/docs',
    health: '/api/health',
    version: '1.0.0'
  });
});

// 404 handler for undefined routes
app.use(notFoundHandler);

// Centralized global error handler
app.use(errorHandler);

export default app;
