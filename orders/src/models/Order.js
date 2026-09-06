const mongoose = require('mongoose');

const orderItemSchema = new mongoose.Schema(
  {
    productId: {
      type: String,
      required: true
    },
    name: {
      type: String,
      required: true
    },
    quantity: {
      type: Number,
      required: true,
      min: 1
    },
    price: {
      type: Number,
      required: true,
      min: 0
    }
  },
  { _id: false }
);

const orderSchema = new mongoose.Schema(
  {
    userId: {
      type: String,
      required: true
    },
    userEmail: {
      type: String
    },
    items: [orderItemSchema],
    totalAmount: {
      type: Number,
      required: true,
      min: 0
    },
    status: {
      type: String,
      required: true,
      enum: ['PENDING_PAYMENT', 'CONFIRMED', 'PAYMENT_FAILED', 'CANCELLED'],
      default: 'PENDING_PAYMENT'
    },
    payment: {
      status: {
        type: String,
        required: true,
        enum: ['PENDING', 'SUCCESS', 'FAILED'],
        default: 'PENDING'
      },
      method: {
        type: String,
        default: 'SIMULATED'
      },
      transactionId: {
        type: String,
        default: null
      }
    }
  },
  {
    timestamps: true,
    collection: 'orders'
  }
);

module.exports = mongoose.model('Order', orderSchema);
