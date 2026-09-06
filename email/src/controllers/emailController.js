const Email = require('../models/Email');
const { sendEmail } = require('../services/emailService');
const { logEvent } = require('../utils/logger');

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const SUPPORTED_TYPES = [
  'WELCOME_EMAIL',
  'ORDER_CONFIRMATION_EMAIL',
  'PAYMENT_FAILURE_EMAIL',
  'ORDER_CANCELLATION_EMAIL'
];

exports.send = async (req, res, next) => {
  let emailDoc = null;
  try {
    const { type, to, userId, orderId } = req.body;

    if (!type || !to || !SUPPORTED_TYPES.includes(type)) {
      await logEvent({
        level: 'WARN',
        event: 'INVALID_EMAIL_REQUEST',
        message: 'Email request missing required type or valid recipient',
        requestId: req.requestId,
        userId: userId || undefined,
        orderId: orderId || undefined,
        http: { method: req.method, path: req.path, statusCode: 400 },
        metadata: { type, recipient: to }
      });
      return res.status(400).json({
        success: false,
        message: 'Valid email type and recipient address are required'
      });
    }

    if (!EMAIL_REGEX.test(to)) {
      await logEvent({
        level: 'WARN',
        event: 'INVALID_EMAIL_ADDRESS',
        message: 'Invalid email address format',
        requestId: req.requestId,
        userId: userId || undefined,
        orderId: orderId || undefined,
        http: { method: req.method, path: req.path, statusCode: 400 },
        metadata: { type, recipient: to }
      });
      return res.status(400).json({
        success: false,
        message: 'Invalid recipient email format'
      });
    }

    // Step 3: Create email record with REQUESTED
    emailDoc = await Email.create({
      type,
      recipient: to,
      userId: userId || undefined,
      orderId: orderId || undefined,
      status: 'REQUESTED',
      attempts: 0
    });

    await logEvent({
      level: 'INFO',
      event: 'EMAIL_REQUESTED',
      message: `Email sending requested: ${type}`,
      requestId: req.requestId,
      userId: userId || undefined,
      orderId: orderId || undefined,
      metadata: { emailType: type, recipient: to, emailId: emailDoc._id.toString() }
    });

    try {
      await sendEmail({ type, to, userId, orderId });

      emailDoc.status = 'SENT';
      emailDoc.sentAt = new Date();
      emailDoc.attempts += 1;
      await emailDoc.save();

      await logEvent({
        level: 'INFO',
        event: 'EMAIL_SENT',
        message: `Email sent successfully: ${type}`,
        requestId: req.requestId,
        userId: userId || undefined,
        orderId: orderId || undefined,
        http: { method: req.method, path: req.path, statusCode: 200 },
        metadata: {
          emailType: type,
          attempt: emailDoc.attempts,
          emailId: emailDoc._id.toString()
        }
      });

      return res.status(200).json({
        success: true,
        message: 'Email sent successfully',
        data: {
          emailId: emailDoc._id,
          status: 'SENT',
          sentAt: emailDoc.sentAt
        }
      });
    } catch (sendErr) {
      emailDoc.status = 'FAILED';
      emailDoc.attempts += 1;
      emailDoc.error = sendErr.message;
      await emailDoc.save();

      await logEvent({
        level: 'ERROR',
        event: 'EMAIL_DELIVERY_FAILED',
        message: `Email delivery failed: ${sendErr.message}`,
        requestId: req.requestId,
        userId: userId || undefined,
        orderId: orderId || undefined,
        http: { method: req.method, path: req.path, statusCode: 500 },
        metadata: {
          emailType: type,
          attempt: emailDoc.attempts,
          emailId: emailDoc._id.toString()
        },
        error: {
          code: 'EMAIL_DELIVERY_FAILED',
          type: sendErr.name || 'Error',
          message: sendErr.message
        }
      });

      return res.status(500).json({
        success: false,
        message: `Failed to send email: ${sendErr.message}`
      });
    }
  } catch (error) {
    next(error);
  }
};

exports.getHealth = (req, res) => {
  return res.status(200).json({
    success: true,
    status: 'UP',
    service: 'email-service',
    timestamp: new Date().toISOString()
  });
};
