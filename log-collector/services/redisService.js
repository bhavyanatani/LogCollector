const { createClient } = require('redis');

const REDIS_URL = process.env.REDIS_URL || 'redis://localhost:6379';

let client = null;

async function initRedis() {
  client = createClient({
    url: REDIS_URL
  });

  client.on('connect', () => {
    console.log('[Log Collector] Connecting to Redis...');
  });

  client.on('ready', () => {
    console.log('[Log Collector] Successfully connected to Redis');
  });

  client.on('error', (err) => {
    console.error('[Log Collector] Redis error:', err.message);
  });

  client.on('end', () => {
    console.log('[Log Collector] Disconnected from Redis');
  });

  try {
    await client.connect();
  } catch (err) {
    console.error('[Log Collector] Failed to initialize Redis connection:', err.message);
  }
}

function isRedisConnected() {
  return Boolean(client && client.isOpen);
}

async function pushToStream(streamName, logData) {
  if (!isRedisConnected()) {
    throw new Error('Redis client is not connected');
  }

  const logJsonString = typeof logData === 'string' ? logData : JSON.stringify(logData);
  
  const messageId = await client.xAdd(streamName, '*', {
    log: logJsonString
  });

  return messageId;
}

async function closeRedis() {
  if (client && client.isOpen) {
    console.log('[Log Collector] Closing Redis connection...');
    await client.quit();
  }
}

module.exports = {
  initRedis,
  isRedisConnected,
  pushToStream,
  closeRedis
};
