require('dotenv').config();
const app = require('./app');
const { initRedis, closeRedis } = require('./services/redisService');

const PORT = process.env.PORT || 4000;

let server = null;

async function startServer() {
  try {
    await initRedis();

    server = app.listen(PORT, () => {
      console.log(`[Log Collector] Running on port ${PORT} in ${process.env.NODE_ENV || 'development'} mode`);
    });
  } catch (error) {
    console.error(`[Log Collector] Server startup failed: ${error.message}`);
    process.exit(1);
  }
}

async function shutdown(signal) {
  console.log(`\n[Log Collector] Received ${signal}. Starting graceful shutdown...`);

  if (server) {
    server.close(async () => {
      console.log('[Log Collector] HTTP server closed.');
      await closeRedis();
      console.log('[Log Collector] Graceful shutdown complete.');
      process.exit(0);
    });
  } else {
    await closeRedis();
    process.exit(0);
  }
}

process.on('SIGINT', () => shutdown('SIGINT'));
process.on('SIGTERM', () => shutdown('SIGTERM'));

if (require.main === module) {
  startServer();
}

module.exports = { startServer };
