const request = require('supertest');
const mongoose = require('mongoose');
const app = require('../src/app');
const Email = require('../src/models/Email');
const Log = require('../src/models/Log');

const TEST_DB_URI = process.env.MONGODB_URI_TEST || 'mongodb://localhost:27017/logcollector_test';

describe('Email Service Integration Tests', () => {
  beforeAll(async () => {
    try {
      await mongoose.connect(TEST_DB_URI);
      await Email.deleteMany({});
      await Log.deleteMany({});
    } catch (err) {
      console.warn('MongoDB connection failed during test setup:', err.message);
    }
  });

  afterAll(async () => {
    if (mongoose.connection.readyState !== 0) {
      await Email.deleteMany({});
      await Log.deleteMany({});
      await mongoose.connection.close();
    }
  });

  describe('GET /health', () => {
    it('should return status UP', async () => {
      const res = await request(app).get('/health');
      expect(res.statusCode).toEqual(200);
      expect(res.body.success).toBe(true);
      expect(res.body.service).toEqual('email-service');
    });
  });

  describe('POST /email/send', () => {
    it('should receive email request, persist RECORD as SENT, and log event', async () => {
      const requestId = 'req_test_12345';
      const res = await request(app)
        .post('/email/send')
        .set('X-Request-ID', requestId)
        .send({
          type: 'WELCOME_EMAIL',
          to: 'testuser@example.com',
          userId: 'user_999'
        });

      expect(res.statusCode).toEqual(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.status).toEqual('SENT');

      if (mongoose.connection.readyState === 1) {
        const emailDoc = await Email.findById(res.body.data.emailId);
        expect(emailDoc).not.toBeNull();
        expect(emailDoc.status).toEqual('SENT');
        expect(emailDoc.recipient).toEqual('testuser@example.com');

        const log = await Log.findOne({ event: 'EMAIL_SENT', requestId });
        expect(log).not.toBeNull();
        expect(log.service).toEqual('email-service');
      }
    });

    it('should reject invalid email format with 400', async () => {
      const res = await request(app)
        .post('/email/send')
        .send({
          type: 'WELCOME_EMAIL',
          to: 'invalid-email-format'
        });

      expect(res.statusCode).toEqual(400);
      expect(res.body.success).toBe(false);
    });

    it('should reject unsupported email type with 400', async () => {
      const res = await request(app)
        .post('/email/send')
        .send({
          type: 'INVALID_TYPE',
          to: 'user@example.com'
        });

      expect(res.statusCode).toEqual(400);
      expect(res.body.success).toBe(false);
    });
  });
});
