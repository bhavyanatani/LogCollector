const mongoose = require('mongoose');

const emailSchema = new mongoose.Schema(
  {
    type: {
      type: String,
      required: true,
      enum: [
        'WELCOME_EMAIL',
        'ORDER_CONFIRMATION_EMAIL',
        'PAYMENT_FAILURE_EMAIL',
        'ORDER_CANCELLATION_EMAIL'
      ]
    },
    recipient: {
      type: String,
      required: true,
      lowercase: true,
      trim: true
    },
    userId: {
      type: String
    },
    orderId: {
      type: String
    },
    status: {
      type: String,
      required: true,
      enum: ['REQUESTED', 'SENT', 'FAILED'],
      default: 'REQUESTED'
    },
    attempts: {
      type: Number,
      default: 0
    },
    error: {
      type: String,
      default: null
    },
    sentAt: {
      type: Date,
      default: null
    }
  },
  {
    timestamps: true,
    collection: 'emails'
  }
);

module.exports = mongoose.model('Email', emailSchema);
