const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const axios = require('axios');
const User = require('../models/User');
const { logEvent } = require('../utils/logger');

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const EMAIL_SERVICE_URL = process.env.EMAIL_SERVICE_URL || 'http://localhost:3002';
const JWT_SECRET = process.env.JWT_SECRET || 'dev_secret_key_123';

exports.register = async (req, res, next) => {
  try {
    const { name, email, password } = req.body;

    if (!name || !email || !password) {
      await logEvent({
        level: 'WARN',
        event: 'INVALID_REGISTRATION_REQUEST',
        message: 'Registration request missing required fields',
        requestId: req.requestId,
        http: { method: req.method, path: req.path, statusCode: 400 }
      });
      return res.status(400).json({
        success: false,
        message: 'Name, email, and password are required'
      });
    }

    if (!EMAIL_REGEX.test(email)) {
      await logEvent({
        level: 'WARN',
        event: 'INVALID_EMAIL',
        message: 'Registration request contained invalid email format',
        requestId: req.requestId,
        http: { method: req.method, path: req.path, statusCode: 400 }
      });
      return res.status(400).json({
        success: false,
        message: 'Invalid email format'
      });
    }

    if (password.length < 6) {
      await logEvent({
        level: 'WARN',
        event: 'INVALID_REGISTRATION_REQUEST',
        message: 'Password does not meet minimum length requirement',
        requestId: req.requestId,
        http: { method: req.method, path: req.path, statusCode: 400 }
      });
      return res.status(400).json({
        success: false,
        message: 'Password must be at least 6 characters long'
      });
    }

    const existingUser = await User.findOne({ email: email.toLowerCase() });
    if (existingUser) {
      await logEvent({
        level: 'WARN',
        event: 'USER_ALREADY_EXISTS',
        message: 'User registration failed - user already exists',
        requestId: req.requestId,
        http: { method: req.method, path: req.path, statusCode: 409 }
      });
      return res.status(409).json({
        success: false,
        message: 'User already exists with this email'
      });
    }

    const passwordHash = await bcrypt.hash(password, 10);

    const user = await User.create({
      name,
      email: email.toLowerCase(),
      passwordHash
    });

    await logEvent({
      level: 'INFO',
      event: 'USER_REGISTERED',
      message: 'User registered successfully',
      requestId: req.requestId,
      userId: user._id.toString(),
      http: { method: req.method, path: req.path, statusCode: 201 }
    });

    // Trigger welcome email through Email Service
    try {
      await axios.post(
        `${EMAIL_SERVICE_URL}/email/send`,
        {
          type: 'WELCOME_EMAIL',
          to: user.email,
          userId: user._id.toString(),
          requestId: req.requestId
        },
        {
          headers: {
            'X-Request-ID': req.requestId
          },
          timeout: 10000
        }
      );
    } catch (emailErr) {
      console.error(`[Auth Service] Could not trigger welcome email: ${emailErr.message}`);
    }

    return res.status(201).json({
      success: true,
      message: 'User registered successfully',
      data: {
        user: user.toJSON()
      }
    });
  } catch (error) {
    next(error);
  }
};

exports.login = async (req, res, next) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      await logEvent({
        level: 'WARN',
        event: 'INVALID_LOGIN_REQUEST',
        message: 'Login request missing email or password',
        requestId: req.requestId,
        http: { method: req.method, path: req.path, statusCode: 400 }
      });
      return res.status(400).json({
        success: false,
        message: 'Email and password are required'
      });
    }

    const user = await User.findOne({ email: email.toLowerCase() });
    if (!user) {
      await logEvent({
        level: 'WARN',
        event: 'USER_NOT_FOUND',
        message: 'Login failed - user not found',
        requestId: req.requestId,
        http: { method: req.method, path: req.path, statusCode: 401 }
      });
      return res.status(401).json({
        success: false,
        message: 'Invalid email or password'
      });
    }

    const isMatch = await bcrypt.compare(password, user.passwordHash);
    if (!isMatch) {
      await logEvent({
        level: 'WARN',
        event: 'LOGIN_FAILED',
        message: 'Login failed due to invalid password',
        requestId: req.requestId,
        userId: user._id.toString(),
        http: { method: req.method, path: req.path, statusCode: 401 },
        metadata: { failureReason: 'INVALID_PASSWORD' }
      });
      return res.status(401).json({
        success: false,
        message: 'Invalid email or password'
      });
    }

    const token = jwt.sign(
      { userId: user._id.toString(), email: user.email },
      JWT_SECRET,
      { expiresIn: '24h' }
    );

    await logEvent({
      level: 'INFO',
      event: 'LOGIN_SUCCESS',
      message: 'User login successful',
      requestId: req.requestId,
      userId: user._id.toString(),
      http: { method: req.method, path: req.path, statusCode: 200 }
    });

    return res.status(200).json({
      success: true,
      message: 'Login successful',
      data: {
        token,
        user: user.toJSON()
      }
    });
  } catch (error) {
    next(error);
  }
};

exports.logout = async (req, res, next) => {
  try {
    const userId = req.body?.userId || req.user?.userId;

    await logEvent({
      level: 'INFO',
      event: 'LOGOUT_SUCCESS',
      message: 'User logout successful',
      requestId: req.requestId,
      userId: userId ? String(userId) : undefined,
      http: { method: req.method, path: req.path, statusCode: 200 }
    });

    return res.status(200).json({
      success: true,
      message: 'Logged out successfully'
    });
  } catch (error) {
    next(error);
  }
};

exports.getHealth = (req, res) => {
  return res.status(200).json({
    success: true,
    status: 'UP',
    service: 'auth-service',
    timestamp: new Date().toISOString()
  });
};
