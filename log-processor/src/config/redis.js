const { createClient, commandOptions } = require('redis');

const REDIS_URL = process.env.REDIS_URL || 'redis://localhost:6379';
const LOG_STREAM = process.env.LOG_STREAM || 'application-logs';
const REDIS_CONSUMER_GROUP = process.env.REDIS_CONSUMER_GROUP || 'log-processors';

let client = null;

async function initRedis() {
  client = createClient({
    url: REDIS_URL
  });

  client.on('connect', () => {
    console.log('[Log Processor] Connecting to Redis...');
  });

  client.on('ready', () => {
    console.log('[Log Processor] Successfully connected to Redis');
  });

  client.on('error', (err) => {
    console.error('[Log Processor] Redis error:', err.message);
  });

  client.on('end', () => {
    console.log('[Log Processor] Disconnected from Redis');
  });

  try {
    await client.connect();
  } catch (err) {
    console.error('[Log Processor] Failed to initialize Redis connection:', err.message);
  }
}

async function initConsumerGroup() {
  if (!isRedisConnected()) {
    console.error('[Log Processor] Cannot initialize consumer group: Redis not connected');
    return;
  }

  try {
    await client.xGroupCreate(LOG_STREAM, REDIS_CONSUMER_GROUP, '0', {
      MKSTREAM: true
    });
    console.log(`[Log Processor] Consumer group '${REDIS_CONSUMER_GROUP}' created for stream '${LOG_STREAM}'`);
  } catch (err) {
    if (err.message.includes('BUSYGROUP') || err.message.includes('already exists')) {
      console.log(`[Log Processor] Consumer group '${REDIS_CONSUMER_GROUP}' already exists`);
    } else {
      console.error(`[Log Processor] Error creating consumer group '${REDIS_CONSUMER_GROUP}':`, err.message);
    }
  }
}

function isRedisConnected() {
  return Boolean(client && client.isOpen);
}

function getRedisClient() {
  return client;
}

async function ackMessage(streamName, groupName, messageId) {
  if (!isRedisConnected()) return;
  return await client.xAck(streamName, groupName, messageId);
}

async function closeRedis() {
  if (client && client.isOpen) {
    console.log('[Log Processor] Closing Redis connection...');
    await client.quit();
  }
}

module.exports = {
  initRedis,
  initConsumerGroup,
  isRedisConnected,
  getRedisClient,
  ackMessage,
  closeRedis,
  commandOptions
};
