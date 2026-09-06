const { logEvent } = require('../utils/logger');

function errorHandler(err, req, res, next) {
  const statusCode = err.statusCode || err.status || 500;
  const isMongoError = err.name === 'MongoError' || err.name === 'MongoServerError' || err.name === 'ValidationError';
  const isCartOrProductRoute = req.path && (req.path.toLowerCase().startsWith('/cart') || req.path.toLowerCase().startsWith('/products'));

  const eventName = isMongoError ? 'DATABASE_ERROR' : (err.eventName || 'INTERNAL_ERROR');
  const logLevel = statusCode >= 500 ? 'ERROR' : 'WARN';

  if (!isCartOrProductRoute) {
    logEvent({
      level: logLevel,
      event: eventName,
      message: err.message || 'An unexpected error occurred',
      requestId: req.requestId,
      userId: req.userId || undefined,
      http: {
        method: req.method,
        path: req.path,
        statusCode
      },
      error: {
        code: err.code ? String(err.code) : 'ERROR',
        type: err.name || 'Error',
        message: err.message || 'An unexpected error occurred'
      }
    });
  }

  res.status(statusCode).json({
    success: false,
    message: err.message || 'Internal Server Error'
  });
}

module.exports = errorHandler;
