const { v4: uuidv4 } = require('uuid');

function requestIdMiddleware(req, res, next) {
  const incomingRequestId = req.headers['x-request-id'];
  const requestId = incomingRequestId || `req_${uuidv4().replace(/-/g, '').substring(0, 12)}`;

  req.requestId = requestId;
  res.setHeader('X-Request-ID', requestId);

  next();
}

module.exports = requestIdMiddleware;
