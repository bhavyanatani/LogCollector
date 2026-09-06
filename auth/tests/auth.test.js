const request = require('supertest');
const mongoose = require('mongoose');
const app = require('../src/app');
const User = require('../src/models/User');
const Log = require('../src/models/Log');

const TEST_DB_URI = process.env.MONGODB_URI_TEST || 'mongodb://localhost:27017/logcollector_test';

describe('Auth Service Integration Tests', () => {
  beforeAll(async () => {
    try {
      await mongoose.connect(TEST_DB_URI);
      await User.deleteMany({});
      await Log.deleteMany({});
    } catch (err) {
      console.warn('MongoDB connection failed during test setup:', err.message);
    }
  });

  afterAll(async () => {
    if (mongoose.connection.readyState !== 0) {
      await User.deleteMany({});
      await Log.deleteMany({});
      await mongoose.connection.close();
    }
  });

  describe('GET /health', () => {
    it('should return health status UP', async () => {
      const res = await request(app).get('/health');
      expect(res.statusCode).toEqual(200);
      expect(res.body.success).toBe(true);
      expect(res.body.status).toEqual('UP');
      expect(res.body.service).toEqual('auth-service');
    });
  });

  describe('POST /auth/register', () => {
    it('should register a new user successfully', async () => {
      const res = await request(app)
        .post('/auth/register')
        .send({
          name: 'Bhavya Test',
          email: 'bhavya.test@example.com',
          password: 'password123'
        });

      expect(res.statusCode).toEqual(201);
      expect(res.body.success).toBe(true);
      expect(res.body.data.user.name).toEqual('Bhavya Test');
      expect(res.body.data.user.email).toEqual('bhavya.test@example.com');
      expect(res.body.data.user.passwordHash).toBeUndefined();

      // Check log persisted in MongoDB
      if (mongoose.connection.readyState === 1) {
        const log = await Log.findOne({ event: 'USER_REGISTERED', userId: res.body.data.user._id });
        expect(log).not.toBeNull();
        expect(log.service).toEqual('auth-service');
      }
    });

    it('should fail with 409 when registering duplicate email', async () => {
      const res = await request(app)
        .post('/auth/register')
        .send({
          name: 'Bhavya Test 2',
          email: 'bhavya.test@example.com',
          password: 'password123'
        });

      expect(res.statusCode).toEqual(409);
      expect(res.body.success).toBe(false);
      expect(res.body.message).toContain('already exists');
    });

    it('should fail with 400 for invalid email format', async () => {
      const res = await request(app)
        .post('/auth/register')
        .send({
          name: 'Invalid Email User',
          email: 'not-an-email',
          password: 'password123'
        });

      expect(res.statusCode).toEqual(400);
      expect(res.body.success).toBe(false);
    });
  });

  describe('POST /auth/login', () => {
    it('should login successfully with correct credentials', async () => {
      const res = await request(app)
        .post('/auth/login')
        .send({
          email: 'bhavya.test@example.com',
          password: 'password123'
        });

      expect(res.statusCode).toEqual(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.token).toBeDefined();
      expect(res.body.data.user.email).toEqual('bhavya.test@example.com');
    });

    it('should fail login with incorrect password', async () => {
      const res = await request(app)
        .post('/auth/login')
        .send({
          email: 'bhavya.test@example.com',
          password: 'wrongpassword'
        });

      expect(res.statusCode).toEqual(401);
      expect(res.body.success).toBe(false);

      if (mongoose.connection.readyState === 1) {
        const log = await Log.findOne({ event: 'LOGIN_FAILED' });
        expect(log).not.toBeNull();
        expect(log.level).toEqual('WARN');
      }
    });

    it('should fail login for nonexistent user', async () => {
      const res = await request(app)
        .post('/auth/login')
        .send({
          email: 'nonexistent@example.com',
          password: 'password123'
        });

      expect(res.statusCode).toEqual(401);
      expect(res.body.success).toBe(false);

      if (mongoose.connection.readyState === 1) {
        const log = await Log.findOne({ event: 'USER_NOT_FOUND' });
        expect(log).not.toBeNull();
        expect(log.level).toEqual('WARN');
      }
    });
  });

  describe('POST /auth/logout', () => {
    it('should logout user successfully', async () => {
      const res = await request(app)
        .post('/auth/logout')
        .send({});

      expect(res.statusCode).toEqual(200);
      expect(res.body.success).toBe(true);
    });
  });
});
