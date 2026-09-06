const mongoose = require('mongoose');

const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/logcollector';

async function connectDB() {
  try {
    mongoose.connection.on('connected', () => {
      console.log('[Log Processor] Connected to MongoDB');
    });

    mongoose.connection.on('error', (err) => {
      console.error('[Log Processor] MongoDB error:', err.message);
    });

    mongoose.connection.on('disconnected', () => {
      console.log('[Log Processor] Disconnected from MongoDB');
    });

    await mongoose.connect(MONGODB_URI);
  } catch (error) {
    console.error('[Log Processor] Failed to connect to MongoDB:', error.message);
  }
}

function isMongoConnected() {
  return mongoose.connection.readyState === 1;
}

async function closeMongo() {
  if (mongoose.connection.readyState !== 0) {
    console.log('[Log Processor] Closing MongoDB connection...');
    await mongoose.connection.close();
  }
}

module.exports = {
  connectDB,
  isMongoConnected,
  closeMongo
};
