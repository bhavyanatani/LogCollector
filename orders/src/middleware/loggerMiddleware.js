const { logEvent } = require('../utils/logger');

function loggerMiddleware(req, res, next) {
  // Do not log GET read operations (fetching orders, cart, or products)
  if (req.method === 'GET' || req.path.toLowerCase().startsWith('/cart') || req.path.toLowerCase().startsWith('/products')) {
    return next();
  }

  if (req.method === 'OPTIONS') {
    return next();
  }

  const startTime = Date.now();

  logEvent({
    level: 'INFO',
    event: 'REQUEST_RECEIVED',
    message: `Incoming HTTP ${req.method} request to ${req.path}`,
    requestId: req.requestId,
    http: {
      method: req.method,
      path: req.path
    }
  });

  res.on('finish', () => {
    const responseTimeMs = Date.now() - startTime;

    logEvent({
      level: 'INFO',
      event: 'REQUEST_COMPLETED',
      message: `Completed HTTP ${req.method} ${req.path} with status ${res.statusCode}`,
      requestId: req.requestId,
      http: {
        method: req.method,
        path: req.path,
        statusCode: res.statusCode
      },
      performance: {
        responseTimeMs
      }
    });
  });

  next();
}

module.exports = loggerMiddleware;
