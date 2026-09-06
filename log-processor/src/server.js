require('dotenv').config();
const express = require('express');
const { connectDB, isMongoConnected, closeMongo } = require('./config/db');
const { initRedis, initConsumerGroup, isRedisConnected, closeRedis } = require('./config/redis');
const { startConsumerLoop, stopConsumerLoop } = require('./services/logProcessor');

const PORT = process.env.PORT || 4001;
const SERVICE_NAME = process.env.SERVICE_NAME || 'log-processor';

const app = express();
app.use(express.json());

app.get('/health', (req, res) => {
  const redisUp = isRedisConnected();
  const mongoUp = isMongoConnected();
  const timestamp = new Date().toISOString();

  const isHealthy = redisUp && mongoUp;
  const statusCode = isHealthy ? 200 : 503;

  return res.status(statusCode).json({
    status: isHealthy ? 'UP' : 'DOWN',
    service: SERVICE_NAME,
    redis: redisUp ? 'UP' : 'DOWN',
    mongodb: mongoUp ? 'UP' : 'DOWN',
    timestamp
  });
});

let server = null;

async function startServer() {
  try {
    await connectDB();

    await initRedis();

    await initConsumerGroup();

    server = app.listen(PORT, () => {
      console.log(`[Log Processor] HTTP Server running on port ${PORT} in ${process.env.NODE_ENV || 'development'} mode`);
    });
    startConsumerLoop();
  } catch (error) {
    console.error(`[Log Processor] Server startup failed: ${error.message}`);
    process.exit(1);
  }
}

async function shutdown(signal) {
  console.log(`\n[Log Processor] Received ${signal}. Starting graceful shutdown...`);

  stopConsumerLoop();

  if (server) {
    server.close(async () => {
      console.log('[Log Processor] HTTP server closed.');
      await closeRedis();
      await closeMongo();
      console.log('[Log Processor] Graceful shutdown complete.');
      process.exit(0);
    });
  } else {
    await closeRedis();
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
