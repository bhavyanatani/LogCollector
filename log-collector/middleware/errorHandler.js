function errorHandler(err, req, res, next) {
  console.error(`[Log Collector Error] ${req.method} ${req.path}:`, err.message);

  if (err instanceof SyntaxError && err.status === 400 && 'body' in err) {
    return res.status(400).json({
      success: false,
      message: 'Invalid JSON payload'
    });
  }

  const statusCode = err.statusCode || err.status || 500;
  const responseMessage = err.isPublic ? err.message : (statusCode === 500 ? 'Internal server error' : err.message);

  return res.status(statusCode).json({
    success: false,
    message: responseMessage
  });
}

module.exports = errorHandler;
