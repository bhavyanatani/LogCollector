const { validateLog } = require('../utils/validator');
const { pushToStream, isRedisConnected } = require('../services/redisService');

const LOG_STREAM = process.env.LOG_STREAM || 'application-logs';
const SERVICE_NAME = process.env.SERVICE_NAME || 'log-collector';

exports.ingestLog = async (req, res, next) => {
  try {
    if (!isRedisConnected()) {
      return res.status(503).json({
        success: false,
        message: 'Log collector temporarily unavailable'
      });
    }

    const validation = validateLog(req.body);
    if (!validation.isValid) {
      return res.status(400).json({
        success: false,
        message: validation.message
      });
    }

    const messageId = await pushToStream(LOG_STREAM, req.body);

    return res.status(202).json({
      success: true,
      message: 'Log accepted',
      data: {
        stream: LOG_STREAM,
        messageId
      }
    });
  } catch (error) {
    next(error);
  }
};

exports.getHealth = (req, res) => {
  const redisConnected = isRedisConnected();
  const timestamp = new Date().toISOString();

  if (redisConnected) {
    return res.status(200).json({
      success: true,
      status: 'UP',
      service: SERVICE_NAME,
      redis: 'UP',
      timestamp
    });
  } else {
    return res.status(503).json({
      success: false,
      status: 'DOWN',
      service: SERVICE_NAME,
      redis: 'DOWN',
      timestamp
    });
  }
};
