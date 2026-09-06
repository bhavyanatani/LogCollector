const axios = require('axios');
const crypto = require('crypto');

const SENSITIVE_KEYS = [
  'password',
  'passwordhash',
  'jwtsecret',
  'smtppassword',
  'dbcredentials',
  'token',
  'authorization',
  'secret'
];

function sanitizeObject(obj) {
  if (!obj || typeof obj !== 'object') return obj;
  if (Array.isArray(obj)) return obj.map(sanitizeObject);

  const sanitized = {};
  for (const [key, value] of Object.entries(obj)) {
    if (SENSITIVE_KEYS.includes(key.toLowerCase())) {
      sanitized[key] = '[REDACTED]';
    } else if (value && typeof value === 'object') {
      sanitized[key] = sanitizeObject(value);
    } else {
      sanitized[key] = value;
    }
  }
  return sanitized;
}

const SERVICE_NAME = process.env.SERVICE_NAME || 'order-service';
const ENVIRONMENT = process.env.NODE_ENV || 'development';
const LOG_COLLECTOR_URL = process.env.LOG_COLLECTOR_URL || 'http://localhost:4000';

async function logEvent({
  level = 'INFO',
  event,
  message,
  requestId = null,
  userId = null,
  orderId = null,
  http = null,
  performance = null,
  metadata = null,
  error = null
}) {
  try {
    const sanitizedMetadata = metadata ? sanitizeObject(metadata) : {};
    let sanitizedError = null;

    if (error) {
      sanitizedError = {
        code: error.code || 'UNKNOWN_ERROR',
        type: error.type || error.name || 'Error',
        message: error.message || String(error)
      };
    }

    const effectiveRequestId = requestId || `req_${crypto.randomUUID()}`;

    const logPayload = {
      timestamp: new Date().toISOString(),
      service: SERVICE_NAME,
      environment: ENVIRONMENT,
      level,
      event,
      message,
      requestId: effectiveRequestId,
      userId: userId ? String(userId) : undefined,
      orderId: orderId ? String(orderId) : undefined,
      http: http || undefined,
      performance: performance || undefined,
      metadata: sanitizedMetadata,
      error: sanitizedError
    };

    // Clean up undefined properties
    Object.keys(logPayload).forEach(
      (key) => logPayload[key] === undefined && delete logPayload[key]
    );

    // Send HTTP POST to Log Collector
    await axios.post(`${LOG_COLLECTOR_URL}/logs`, logPayload, {
      headers: {
        'Content-Type': 'application/json',
        'X-Request-ID': effectiveRequestId
      },
      timeout: 5000
    });

    return logPayload;
  } catch (err) {
    console.error(`[${SERVICE_NAME}] Failed to send log to Log Collector:`, err.message);
  }
}

module.exports = {
  logEvent,
  sanitizeObject
};
