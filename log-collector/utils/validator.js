const ALLOWED_SERVICES = ['auth-service', 'email-service', 'order-service'];
const ALLOWED_LEVELS = ['DEBUG', 'INFO', 'WARN', 'ERROR'];

function validateLog(payload) {
  if (!payload || typeof payload !== 'object' || Array.isArray(payload)) {
    return {
      isValid: false,
      message: 'Invalid log payload: Body must be a JSON object'
    };
  }

  const requiredFields = ['timestamp', 'service', 'environment', 'level', 'event', 'message', 'requestId'];

  for (const field of requiredFields) {
    if (payload[field] === undefined || payload[field] === null) {
      return {
        isValid: false,
        message: `Missing required field: '${field}'`
      };
    }

    if (typeof payload[field] !== 'string' || payload[field].trim() === '') {
      return {
        isValid: false,
        message: `Invalid field format: '${field}' must be a non-empty string`
      };
    }
  }

  if (isNaN(Date.parse(payload.timestamp))) {
    return {
      isValid: false,
      message: "Invalid field format: 'timestamp' must be a valid ISO 8601 date string"
    };
  }

  if (!ALLOWED_SERVICES.includes(payload.service)) {
    return {
      isValid: false,
      message: `Invalid service '${payload.service}'. Must be one of: ${ALLOWED_SERVICES.join(', ')}`
    };
  }

  if (!ALLOWED_LEVELS.includes(payload.level)) {
    return {
      isValid: false,
      message: `Invalid log level '${payload.level}'. Must be one of: ${ALLOWED_LEVELS.join(', ')}`
    };
  }

  if (payload.userId !== undefined && payload.userId !== null && typeof payload.userId !== 'string') {
    return {
      isValid: false,
      message: "Invalid field format: 'userId' must be a string if provided"
    };
  }

  if (payload.orderId !== undefined && payload.orderId !== null && typeof payload.orderId !== 'string') {
    return {
      isValid: false,
      message: "Invalid field format: 'orderId' must be a string if provided"
    };
  }

  if (payload.http !== undefined && payload.http !== null && typeof payload.http !== 'object') {
    return {
      isValid: false,
      message: "Invalid field format: 'http' must be an object if provided"
    };
  }

  if (payload.performance !== undefined && payload.performance !== null && typeof payload.performance !== 'object') {
    return {
      isValid: false,
      message: "Invalid field format: 'performance' must be an object if provided"
    };
  }

  if (payload.metadata !== undefined && payload.metadata !== null && typeof payload.metadata !== 'object') {
    return {
      isValid: false,
      message: "Invalid field format: 'metadata' must be an object if provided"
    };
  }

  if (payload.error !== undefined && payload.error !== null && typeof payload.error !== 'object') {
    return {
      isValid: false,
      message: "Invalid field format: 'error' must be an object or null if provided"
    };
  }

  return { isValid: true };
}

module.exports = {
  validateLog,
  ALLOWED_SERVICES,
  ALLOWED_LEVELS
};
