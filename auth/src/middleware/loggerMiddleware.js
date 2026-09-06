const { logEvent } = require('../utils/logger');

function loggerMiddleware(req, res, next) {
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
