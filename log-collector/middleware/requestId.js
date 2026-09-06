const crypto = require('crypto');

function requestIdMiddleware(req, res, next) {
  const incomingRequestId = req.headers['x-request-id'];

  if (incomingRequestId && typeof incomingRequestId === 'string' && incomingRequestId.trim() !== '') {
    req.requestId = incomingRequestId.trim();
  } else {
    req.requestId = `req_${crypto.randomUUID()}`;
  }

  res.setHeader('X-Request-ID', req.requestId);
  next();
}

module.exports = requestIdMiddleware;
