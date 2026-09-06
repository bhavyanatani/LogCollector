const { commandOptions } = require('redis');
const { getRedisClient, isRedisConnected, ackMessage } = require('../config/redis');
const { isMongoConnected } = require('../config/db');
const ProcessedLog = require('../models/ProcessedLog');
const { validateLogPayload, enrichLog } = require('../utils/logEnricher');

const LOG_STREAM = process.env.LOG_STREAM || 'application-logs';
const REDIS_CONSUMER_GROUP = process.env.REDIS_CONSUMER_GROUP || 'log-processors';
const REDIS_CONSUMER_NAME = process.env.REDIS_CONSUMER_NAME || 'processor-1';

let isRunning = false;

async function startConsumerLoop() {
  if (isRunning) return;
  isRunning = true;

  console.log(`[Log Processor] Starting consumer loop for group '${REDIS_CONSUMER_GROUP}' consumer '${REDIS_CONSUMER_NAME}'...`);

  while (isRunning) {
    try {
      if (!isRedisConnected() || !isMongoConnected()) {
        await new Promise((resolve) => setTimeout(resolve, 2000));
        continue;
      }

      const client = getRedisClient();

      // Read un-acknowledged messages delivered to this consumer group using XREADGROUP
      const response = await client.xReadGroup(
        commandOptions({ isolated: true }),
        REDIS_CONSUMER_GROUP,
        REDIS_CONSUMER_NAME,
        [
          {
            key: LOG_STREAM,
            id: '>'
          }
        ],
        {
          COUNT: 10,
          BLOCK: 2000
        }
      );

      if (response && response.length > 0) {
        for (const streamData of response) {
          const messages = streamData.messages || [];

          for (const msg of messages) {
            if (!isRunning) break;
            await processSingleMessage(msg.id, msg.message);
          }
        }
      }
    } catch (err) {
      if (isRunning) {
        console.error('[Log Processor] Error in consumer loop:', err.message);
        await new Promise((resolve) => setTimeout(resolve, 2000));
      }
    }
  }

  console.log('[Log Processor] Consumer loop stopped.');
}

async function processSingleMessage(messageId, messageBody) {
  try {
    console.log(`[Log Processor] Processing message ${messageId}...`);

    const rawLogJson = messageBody?.log;
    if (!rawLogJson) {
      console.warn(`[Log Processor] Message ${messageId} is missing 'log' payload field. Skipping.`);
      return;
    }

    // 1. Parse JSON safely
    let parsedLog;
    try {
      parsedLog = JSON.parse(rawLogJson);
    } catch (parseErr) {
      console.warn(`[Log Processor] Message ${messageId} contains malformed JSON. Skipping:`, parseErr.message);
      return;
    }

    // 2. Validate payload structure
    const validation = validateLogPayload(parsedLog);
    if (!validation.isValid) {
      console.warn(`[Log Processor] Message ${messageId} failed validation (${validation.reason}). Skipping.`);
      return;
    }

    // 3. Normalize & Enrich log
    const enrichedLog = enrichLog(parsedLog, messageId);

    // 4. Save to MongoDB
    try {
      await ProcessedLog.create(enrichedLog);
      console.log(`[Log Processor] Stored processed log for message ${messageId} in MongoDB`);
    } catch (dbErr) {
      // Handle Duplicate sourceMessageId (code 11000)
      if (dbErr.code === 11000) {
        console.warn(`[Log Processor] Duplicate message ${messageId} detected in MongoDB. ACK-ing to remove from stream queue.`);
        await ackMessage(LOG_STREAM, REDIS_CONSUMER_GROUP, messageId);
        return;
      } else {
        console.error(`[Log Processor] Failed to store message ${messageId} in MongoDB: ${dbErr.message}`);
        // Do NOT ACK message so it can be re-processed when DB recovers
        return;
      }
    }

    // 5. ACK Redis message ONLY after successful MongoDB storage
    await ackMessage(LOG_STREAM, REDIS_CONSUMER_GROUP, messageId);
    console.log(`[Log Processor] Acknowledged message ${messageId}`);

  } catch (err) {
    console.error(`[Log Processor] Unexpected error processing message ${messageId}:`, err.message);
  }
}

function stopConsumerLoop() {
  isRunning = false;
}

module.exports = {
  startConsumerLoop,
  stopConsumerLoop,
  processSingleMessage
};
