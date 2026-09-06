const axios = require('axios');
const Order = require('../models/Order');
const Cart = require('../models/Cart');
const Product = require('../models/Product');
const { logEvent } = require('../utils/logger');

const EMAIL_SERVICE_URL = process.env.EMAIL_SERVICE_URL || 'http://localhost:3002';

async function sendEmailNotification(payload, requestId) {
  try {
    await axios.post(`${EMAIL_SERVICE_URL}/email/send`, payload, {
      headers: {
        'X-Request-ID': requestId
      },
      timeout: 10000
    });
  } catch (err) {
    console.error(`[Order Service] Failed to send ${payload.type} to Email Service: ${err.message}`);
    await logEvent({
      level: 'ERROR',
      event: 'EMAIL_SERVICE_ERROR',
      message: `Service-to-service HTTP call to Email Service failed: ${err.message}`,
      requestId,
      userId: payload.userId,
      orderId: payload.orderId,
      error: {
        code: 'EMAIL_SERVICE_HTTP_ERROR',
        type: 'HTTPError',
        message: err.message
      }
    });
  }
}

exports.createOrder = async (req, res, next) => {
  try {
    const userId = req.userId || req.body.userId;
    const userEmail = req.userEmail || req.body.userEmail;

    if (!userId) {
      return res.status(400).json({
        success: false,
        message: 'Authentication required'
      });
    }

    const cart = await Cart.findOne({ userId }).populate('items.productId');
    if (!cart || !cart.items || cart.items.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'Cart is empty. Cannot create order.'
      });
    }

    let totalAmount = 0;
    const orderItems = [];

    for (const item of cart.items) {
      if (!item.productId) continue;
      const product = item.productId;
      const itemTotal = product.price * item.quantity;
      totalAmount += itemTotal;

      orderItems.push({
        productId: product._id.toString(),
        name: product.name,
        quantity: item.quantity,
        price: product.price
      });
    }

    if (orderItems.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'Cart items are invalid'
      });
    }

    const order = await Order.create({
      userId,
      userEmail: userEmail || `${userId}@example.com`,
      items: orderItems,
      totalAmount: Math.round(totalAmount * 100) / 100,
      status: 'PENDING_PAYMENT',
      payment: {
        status: 'PENDING',
        method: 'SIMULATED'
      }
    });

    await logEvent({
      level: 'INFO',
      event: 'ORDER_CREATED',
      message: 'Order created successfully',
      requestId: req.requestId,
      userId: order.userId,
      orderId: order._id.toString(),
      http: { method: req.method, path: req.path, statusCode: 201 },
      metadata: {
        totalAmount: order.totalAmount,
        itemCount: order.items.length
      }
    });

    return res.status(201).json({
      success: true,
      message: 'Order created successfully',
      data: order
    });
  } catch (error) {
    next(error);
  }
};

exports.getOrderById = async (req, res, next) => {
  try {
    const { id } = req.params;
    const order = await Order.findById(id);

    if (!order) {
      return res.status(404).json({
        success: false,
        message: 'Order not found'
      });
    }

    return res.status(200).json({
      success: true,
      data: order
    });
  } catch (error) {
    next(error);
  }
};

exports.processPayment = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { result, userEmail } = req.body;

    const order = await Order.findById(id);
    if (!order) {
      return res.status(404).json({
        success: false,
        message: 'Order not found'
      });
    }

    if (order.payment.status !== 'PENDING') {
      return res.status(400).json({
        success: false,
        message: `Payment has already been processed for order #${id} (status: ${order.payment.status})`
      });
    }

    const recipient = userEmail || order.userEmail || `${order.userId}@example.com`;

    await logEvent({
      level: 'INFO',
      event: 'PAYMENT_INITIATED',
      message: 'Payment process initiated',
      requestId: req.requestId,
      userId: order.userId,
      orderId: order._id.toString(),
      metadata: { paymentMethod: 'SIMULATED' }
    });

    if (result === 'success') {
      order.payment.status = 'SUCCESS';
      order.payment.transactionId = `txn_${Date.now()}`;
      order.status = 'CONFIRMED';
      await order.save();
      await Cart.deleteOne({ userId: order.userId });

      await logEvent({
        level: 'INFO',
        event: 'PAYMENT_SUCCESS',
        message: 'Payment completed successfully',
        requestId: req.requestId,
        userId: order.userId,
        orderId: order._id.toString(),
        http: { method: req.method, path: req.path, statusCode: 200 },
        metadata: { paymentMethod: 'SIMULATED' }
      });

      await logEvent({
        level: 'INFO',
        event: 'ORDER_CONFIRMED',
        message: 'Order confirmed successfully',
        requestId: req.requestId,
        userId: order.userId,
        orderId: order._id.toString(),
        metadata: { totalAmount: order.totalAmount }
      });

      await sendEmailNotification(
        {
          type: 'ORDER_CONFIRMATION_EMAIL',
          to: recipient,
          userId: order.userId,
          orderId: order._id.toString(),
          requestId: req.requestId
        },
        req.requestId
      );

      return res.status(200).json({
        success: true,
        message: 'Payment successful and order confirmed',
        data: order
      });
    } else {
      order.payment.status = 'FAILED';
      order.status = 'PAYMENT_FAILED';
      await order.save();

      await logEvent({
        level: 'ERROR',
        event: 'PAYMENT_FAILED',
        message: 'Payment failed',
        requestId: req.requestId,
        userId: order.userId,
        orderId: order._id.toString(),
        http: { method: req.method, path: req.path, statusCode: 402 },
        metadata: {
          paymentMethod: 'SIMULATED',
          failureReason: 'PAYMENT_DECLINED'
        },
        error: {
          code: 'PAYMENT_DECLINED',
          type: 'PaymentError',
          message: 'Payment was declined by simulated gateway'
        }
      });

      await sendEmailNotification(
        {
          type: 'PAYMENT_FAILURE_EMAIL',
          to: recipient,
          userId: order.userId,
          orderId: order._id.toString(),
          requestId: req.requestId
        },
        req.requestId
      );

      return res.status(402).json({
        success: false,
        message: 'Payment failed',
        data: order
      });
    }
  } catch (error) {
    next(error);
  }
};

exports.cancelOrder = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { userEmail } = req.body;

    const order = await Order.findById(id);
    if (!order) {
      return res.status(404).json({
        success: false,
        message: 'Order not found'
      });
    }

    if (order.status !== 'CONFIRMED' && order.status !== 'PENDING_PAYMENT') {
      return res.status(400).json({
        success: false,
        message: `Order cannot be cancelled in state: ${order.status}`
      });
    }

    order.status = 'CANCELLED';
    await order.save();

    await logEvent({
      level: 'INFO',
      event: 'ORDER_CANCELLED',
      message: 'Order cancelled successfully',
      requestId: req.requestId,
      userId: order.userId,
      orderId: order._id.toString(),
      http: { method: req.method, path: req.path, statusCode: 200 }
    });

    const recipient = userEmail || order.userEmail || `${order.userId}@example.com`;

    await sendEmailNotification(
      {
        type: 'ORDER_CANCELLATION_EMAIL',
        to: recipient,
        userId: order.userId,
        orderId: order._id.toString(),
        requestId: req.requestId
      },
      req.requestId
    );

    return res.status(200).json({
      success: true,
      message: 'Order cancelled successfully',
      data: order
    });
  } catch (error) {
    next(error);
  }
};

exports.getHealth = (req, res) => {
  return res.status(200).json({
    success: true,
    status: 'UP',
    service: 'order-service',
    timestamp: new Date().toISOString()
  });
};
