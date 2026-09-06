const mongoose = require('mongoose');

const processedLogSchema = new mongoose.Schema(
  {
    sourceMessageId: {
      type: String,
      required: true,
      unique: true,
      index: true
    },
    timestamp: {
      type: Date,
      required: true,
      index: true
    },
    service: {
      type: String,
      required: true,
      enum: ['auth-service', 'email-service', 'order-service'],
      index: true
    },
    environment: {
      type: String,
      required: true,
      default: 'development'
    },
    level: {
      type: String,
      required: true,
      enum: ['DEBUG', 'INFO', 'WARN', 'ERROR'],
      index: true
    },
    event: {
      type: String,
      required: true,
      index: true
    },
    message: {
      type: String,
      required: true
    },
    requestId: {
      type: String,
      required: true,
      index: true
    },
    userId: {
      type: String
    },
    orderId: {
      type: String,
      index: true
    },
    http: {
      method: { type: String },
      path: { type: String },
      statusCode: { type: Number }
    },
    performance: {
      responseTimeMs: { type: Number }
    },
    metadata: {
      type: mongoose.Schema.Types.Mixed,
      default: {}
    },
    error: {
      code: { type: String },
      type: { type: String },
      message: { type: String }
    },
    analytics: {
      isSlowRequest: { type: Boolean, required: true, index: true },
      isVerySlowRequest: { type: Boolean, required: true },
      isServerError: { type: Boolean, required: true, index: true },
      isClientError: { type: Boolean, required: true },
      isBusinessFailure: { type: Boolean, required: true, index: true },
      isExternalServiceFailure: { type: Boolean, required: true },
      processingTimestamp: { type: Date, required: true },
      processingDelayMs: { type: Number, required: true }
    },
    createdAt: {
      type: Date,
      default: Date.now
    }
  },
  {
    timestamps: false,
    collection: 'processed_logs'
  }
);

processedLogSchema.index({ requestId: 1, timestamp: 1 });

module.exports = mongoose.model('ProcessedLog', processedLogSchema);
