const BUSINESS_FAILURE_EVENTS = [
  'PAYMENT_FAILED',
  'ORDER_CANCELLED',
  'LOGIN_FAILED',
  'USER_NOT_FOUND',
  'USER_ALREADY_EXISTS',
  'INVALID_LOGIN_REQUEST',
  'INVALID_REGISTRATION_REQUEST'
];

const EXTERNAL_SERVICE_FAILURE_EVENTS = [
  'EMAIL_DELIVERY_FAILED',
  'EMAIL_PROVIDER_DOWN',
  'EMAIL_SERVICE_ERROR'
];

const ALLOWED_LEVELS = ['DEBUG', 'INFO', 'WARN', 'ERROR'];
const ALLOWED_SERVICES = ['auth-service', 'email-service', 'order-service'];

function validateLogPayload(rawLog) {
  if (!rawLog || typeof rawLog !== 'object' || Array.isArray(rawLog)) {
    return { isValid: false, reason: 'Payload must be a non-null object' };
  }

  const requiredFields = ['timestamp', 'service', 'environment', 'level', 'event', 'message', 'requestId'];
  for (const field of requiredFields) {
    if (rawLog[field] === undefined || rawLog[field] === null || String(rawLog[field]).trim() === '') {
      return { isValid: false, reason: `Missing or empty required field: '${field}'` };
    }
  }

  const parsedDate = Date.parse(rawLog.timestamp);
  if (isNaN(parsedDate)) {
    return { isValid: false, reason: "Field 'timestamp' is not a valid ISO date" };
  }

  const uppercaseLevel = String(rawLog.level).toUpperCase();
  if (!ALLOWED_LEVELS.includes(uppercaseLevel)) {
    return { isValid: false, reason: `Invalid log level '${rawLog.level}'` };
  }

  if (!ALLOWED_SERVICES.includes(rawLog.service)) {
    return { isValid: false, reason: `Invalid service '${rawLog.service}'` };
  }

  return { isValid: true };
}

function enrichLog(rawLog, sourceMessageId) {
  const originalDate = new Date(rawLog.timestamp);
  const processingTimestamp = new Date();
  const processingDelayMs = Math.max(0, processingTimestamp.getTime() - originalDate.getTime());

  // 1. Response Time & Slow Request Classification
  const responseTimeMs = Number(rawLog.performance?.responseTimeMs || 0);
  const isSlowRequest = responseTimeMs >= 500;
  const isVerySlowRequest = responseTimeMs > 1000;

  // 2. HTTP Status Code Classification
  const statusCode = rawLog.http?.statusCode !== undefined ? Number(rawLog.http.statusCode) : null;
  const isServerError = statusCode !== null && statusCode >= 500;
  const isClientError = statusCode !== null && statusCode >= 400 && statusCode < 500;

  // 3. Domain Event Failures
  const eventName = String(rawLog.event).trim();
  const isBusinessFailure = BUSINESS_FAILURE_EVENTS.includes(eventName);
  const isExternalServiceFailure = EXTERNAL_SERVICE_FAILURE_EVENTS.includes(eventName);

  // 4. Normalization
  const normalizedLog = {
    sourceMessageId,
    timestamp: originalDate,
    service: String(rawLog.service).trim(),
    environment: String(rawLog.environment).trim(),
    level: String(rawLog.level).trim().toUpperCase(),
    event: eventName,
    message: String(rawLog.message).trim(),
    requestId: String(rawLog.requestId).trim(),
    userId: rawLog.userId ? String(rawLog.userId).trim() : undefined,
    orderId: rawLog.orderId ? String(rawLog.orderId).trim() : undefined,
    http: rawLog.http && typeof rawLog.http === 'object' ? {
      method: rawLog.http.method ? String(rawLog.http.method).toUpperCase() : undefined,
      path: rawLog.http.path ? String(rawLog.http.path) : undefined,
      statusCode: statusCode !== null ? statusCode : undefined
    } : undefined,
    performance: rawLog.performance && typeof rawLog.performance === 'object' ? {
      responseTimeMs: !isNaN(responseTimeMs) ? responseTimeMs : undefined
    } : undefined,
    metadata: rawLog.metadata && typeof rawLog.metadata === 'object' && !Array.isArray(rawLog.metadata)
      ? rawLog.metadata
      : {},
    error: rawLog.error && typeof rawLog.error === 'object' ? {
      code: rawLog.error.code ? String(rawLog.error.code) : undefined,
      type: rawLog.error.type ? String(rawLog.error.type) : undefined,
      message: rawLog.error.message ? String(rawLog.error.message) : undefined
    } : null,
    analytics: {
      isSlowRequest,
      isVerySlowRequest,
      isServerError,
      isClientError,
      isBusinessFailure,
      isExternalServiceFailure,
      processingTimestamp,
      processingDelayMs
    }
  };

  return normalizedLog;
}

module.exports = {
  validateLogPayload,
  enrichLog,
  BUSINESS_FAILURE_EVENTS,
  EXTERNAL_SERVICE_FAILURE_EVENTS
};
