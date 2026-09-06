const request = require('supertest');
const mongoose = require('mongoose');
const jwt = require('jsonwebtoken');
const app = require('../src/app');
const Product = require('../src/models/Product');
const Cart = require('../src/models/Cart');
const Order = require('../src/models/Order');
const Log = require('../src/models/Log');

const TEST_DB_URI = process.env.MONGODB_URI_TEST || 'mongodb://localhost:27017/logcollector_test';
const JWT_SECRET = process.env.JWT_SECRET || 'dev_secret_key_123';

describe('Order Service Integration Tests', () => {
  let sampleProduct = null;
  const testUserId = 'test_user_777';
  const testUserEmail = 'testuser@example.com';
  let authToken = null;

  beforeAll(async () => {
    try {
      await mongoose.connect(TEST_DB_URI);
      await Product.deleteMany({});
      await Cart.deleteMany({});
      await Order.deleteMany({});
      await Log.deleteMany({});

      authToken = jwt.sign(
        { userId: testUserId, email: testUserEmail },
        JWT_SECRET,
        { expiresIn: '1h' }
      );

      sampleProduct = await Product.create({
        name: 'Test Mechanical Keyboard',
        description: 'RGB Keyboard',
        price: 99.99,
        stock: 50
      });
    } catch (err) {
      console.warn('MongoDB connection failed during test setup:', err.message);
    }
  });

  afterAll(async () => {
    if (mongoose.connection.readyState !== 0) {
      await Product.deleteMany({});
      await Cart.deleteMany({});
      await Order.deleteMany({});
      await Log.deleteMany({});
      await mongoose.connection.close();
    }
  });

  describe('GET /products', () => {
    it('should return list of products without generating log events', async () => {
      const logsCountBefore = mongoose.connection.readyState === 1 ? await Log.countDocuments({}) : 0;

      const res = await request(app).get('/products');
      expect(res.statusCode).toEqual(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.length).toBeGreaterThan(0);

      if (mongoose.connection.readyState === 1) {
        const logsCountAfter = await Log.countDocuments({});
        expect(logsCountAfter).toEqual(logsCountBefore);
      }
    });
  });

  describe('Cart CRUD Operations (Zero Log & JWT Protection Verification)', () => {
    it('should reject unauthenticated cart requests with 401', async () => {
      const res = await request(app)
        .post('/cart')
        .send({
          productId: sampleProduct._id.toString(),
          quantity: 1
        });

      expect(res.statusCode).toEqual(401);
      expect(res.body.success).toBe(false);
    });

    it('should add item to cart using JWT token WITHOUT generating application log events', async () => {
      const logsCountBefore = mongoose.connection.readyState === 1 ? await Log.countDocuments({}) : 0;

      const res = await request(app)
        .post('/cart')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          productId: sampleProduct._id.toString(),
          quantity: 2
        });

      expect(res.statusCode).toEqual(200);
      expect(res.body.success).toBe(true);

      if (mongoose.connection.readyState === 1) {
        const logsCountAfter = await Log.countDocuments({});
        expect(logsCountAfter).toEqual(logsCountBefore);
      }
    });

    it('should view authenticated user cart WITHOUT generating log events', async () => {
      const logsCountBefore = mongoose.connection.readyState === 1 ? await Log.countDocuments({}) : 0;

      const res = await request(app)
        .get('/cart')
        .set('Authorization', `Bearer ${authToken}`);

      expect(res.statusCode).toEqual(200);
      expect(res.body.data.items.length).toEqual(1);

      if (mongoose.connection.readyState === 1) {
        const logsCountAfter = await Log.countDocuments({});
        expect(logsCountAfter).toEqual(logsCountBefore);
      }
    });

    it('should update cart item quantity using JWT WITHOUT generating log events', async () => {
      const logsCountBefore = mongoose.connection.readyState === 1 ? await Log.countDocuments({}) : 0;

      const res = await request(app)
        .patch(`/cart/items/${sampleProduct._id}`)
        .set('Authorization', `Bearer ${authToken}`)
        .send({ quantity: 5 });

      expect(res.statusCode).toEqual(200);
      expect(res.body.success).toBe(true);

      if (mongoose.connection.readyState === 1) {
        const logsCountAfter = await Log.countDocuments({});
        expect(logsCountAfter).toEqual(logsCountBefore);
      }
    });

    it('should remove item from cart using JWT WITHOUT generating log events', async () => {
      const logsCountBefore = mongoose.connection.readyState === 1 ? await Log.countDocuments({}) : 0;

      const res = await request(app)
        .delete(`/cart/items/${sampleProduct._id}`)
        .set('Authorization', `Bearer ${authToken}`);

      expect(res.statusCode).toEqual(200);

      if (mongoose.connection.readyState === 1) {
        const logsCountAfter = await Log.countDocuments({});
        expect(logsCountAfter).toEqual(logsCountBefore);
      }
    });
  });

  describe('Order Lifecycle (Creation, Payment, Cancellation)', () => {
    let createdOrderId = null;

    it('should create order using JWT token and generate ORDER_CREATED log', async () => {
      await request(app)
        .post('/cart')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          productId: sampleProduct._id.toString(),
          quantity: 2
        });

      const res = await request(app)
        .post('/orders')
        .set('Authorization', `Bearer ${authToken}`)
        .send({});

      expect(res.statusCode).toEqual(201);
      expect(res.body.success).toBe(true);
      expect(res.body.data.status).toEqual('PENDING_PAYMENT');
      expect(res.body.data.totalAmount).toEqual(199.98);

      createdOrderId = res.body.data._id;

      if (mongoose.connection.readyState === 1) {
        const log = await Log.findOne({ event: 'ORDER_CREATED', orderId: createdOrderId });
        expect(log).not.toBeNull();
        expect(log.service).toEqual('order-service');
      }
    });

    it('should process payment success flow using JWT and generate PAYMENT_SUCCESS log', async () => {
      const requestId = 'req_pay_success_100';

      const res = await request(app)
        .post(`/orders/${createdOrderId}/payment`)
        .set('Authorization', `Bearer ${authToken}`)
        .set('X-Request-ID', requestId)
        .send({
          result: 'success'
        });

      expect(res.statusCode).toEqual(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.status).toEqual('CONFIRMED');
      expect(res.body.data.payment.status).toEqual('SUCCESS');

      if (mongoose.connection.readyState === 1) {
        const payLog = await Log.findOne({ event: 'PAYMENT_SUCCESS', orderId: createdOrderId });
        expect(payLog).not.toBeNull();

        const confirmLog = await Log.findOne({ event: 'ORDER_CONFIRMED', orderId: createdOrderId });
        expect(confirmLog).not.toBeNull();
      }
    });

    it('should cancel a confirmed order using JWT and generate ORDER_CANCELLED log', async () => {
      const res = await request(app)
        .post(`/orders/${createdOrderId}/cancel`)
        .set('Authorization', `Bearer ${authToken}`)
        .send({});

      expect(res.statusCode).toEqual(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.status).toEqual('CANCELLED');

      if (mongoose.connection.readyState === 1) {
        const cancelLog = await Log.findOne({ event: 'ORDER_CANCELLED', orderId: createdOrderId });
        expect(cancelLog).not.toBeNull();
      }
    });

    it('should process payment failure flow using JWT and generate PAYMENT_FAILED error log', async () => {
      await request(app)
        .post('/cart')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          productId: sampleProduct._id.toString(),
          quantity: 1
        });

      const orderRes = await request(app)
        .post('/orders')
        .set('Authorization', `Bearer ${authToken}`)
        .send({});

      const failOrderId = orderRes.body.data._id;

      const payRes = await request(app)
        .post(`/orders/${failOrderId}/payment`)
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          result: 'failed'
        });

      expect(payRes.statusCode).toEqual(402);
      expect(payRes.body.success).toBe(false);
      expect(payRes.body.data.status).toEqual('PAYMENT_FAILED');

      if (mongoose.connection.readyState === 1) {
        const failLog = await Log.findOne({ event: 'PAYMENT_FAILED', orderId: failOrderId });
        expect(failLog).not.toBeNull();
        expect(failLog.level).toEqual('ERROR');
      }
    });

    describe('Request Tracing Headers', () => {
      it('should preserve incoming X-Request-ID header and return it in response', async () => {
        const customRequestId = 'req_test_custom_tracing_123';
        const res = await request(app)
          .get('/products')
          .set('X-Request-ID', customRequestId);

        expect(res.headers['x-request-id']).toEqual(customRequestId);
      });

      it('should generate a new UUID X-Request-ID header when missing in request', async () => {
        const res = await request(app).get('/products');
        expect(res.headers['x-request-id']).toBeDefined();
        expect(res.headers['x-request-id']).toMatch(/^req_/);
      });
    });
  });
});
