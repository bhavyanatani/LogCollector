require('dotenv').config();
const express = require('express');
const { connectDB, isMongoConnected, closeMongo } = require('./config/db');
const analyticsRoutes = require('./routes/analyticsRoutes');

const PORT = process.env.PORT || 4002;
const SERVICE_NAME = process.env.SERVICE_NAME || 'analytics-api';

const app = express();

// CORS Headers Middleware
app.use((req, res, next) => {
  res.header('Access-Control-Allow-Origin', '*');
  res.header('Access-Control-Allow-Methods', 'GET, POST, PUT, PATCH, DELETE, OPTIONS');
  res.header('Access-Control-Allow-Headers', 'Content-Type, Authorization, X-Request-ID');
  if (req.method === 'OPTIONS') {
    return res.sendStatus(200);
  }
  next();
});

app.use(express.json());

// Health Check Endpoint
app.get('/health', (req, res) => {
  const mongoUp = isMongoConnected();
  const timestamp = new Date().toISOString();

  if (mongoUp) {
    return res.status(200).json({
      success: true,
      data: {
        status: 'UP',
        service: SERVICE_NAME,
        mongodb: 'UP',
        timestamp
      }
    });
  } else {
    return res.status(503).json({
      success: false,
      data: {
        status: 'DOWN',
        service: SERVICE_NAME,
        mongodb: 'DOWN',
        timestamp
      }
    });
  }
});

// Analytics Routes
app.use('/analytics', analyticsRoutes);

// Global Error Handler
app.use((err, req, res, next) => {
  console.error(`[Analytics API Error] ${req.method} ${req.path}:`, err.message);
  const statusCode = err.statusCode || 500;
  const message = err.message || 'Unable to retrieve analytics';

  return res.status(statusCode).json({
    success: false,
    message,
    error: {
      message
    }
  });
});

let server = null;

async function startServer() {
  try {
    await connectDB();
    server = app.listen(PORT, () => {
      console.log(`[Analytics API] Running on port ${PORT} in ${process.env.NODE_ENV || 'development'} mode`);
    });
  } catch (error) {
    console.error(`[Analytics API] Server startup failed: ${error.message}`);
    process.exit(1);
  }
}

async function shutdown(signal) {
  console.log(`\n[Analytics API] Received ${signal}. Starting graceful shutdown...`);
  if (server) {
    server.close(async () => {
      console.log('[Analytics API] HTTP server closed.');
      await closeMongo();
      console.log('[Analytics API] Graceful shutdown complete.');
      process.exit(0);
    });
  } else {
    await closeMongo();
    process.exit(0);
  }
}

process.on('SIGINT', () => shutdown('SIGINT'));
process.on('SIGTERM', () => shutdown('SIGTERM'));

if (require.main === module) {
  startServer();
}

module.exports = { app, startServer };
