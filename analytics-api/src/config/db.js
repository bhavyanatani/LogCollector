const mongoose = require('mongoose');

const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/logcollector';

async function connectDB() {
  try {
    mongoose.connection.on('connected', () => {
      console.log('[Analytics API] Connected to MongoDB');
    });

    mongoose.connection.on('error', (err) => {
      console.error('[Analytics API] MongoDB connection error:', err.message);
    });

    mongoose.connection.on('disconnected', () => {
      console.log('[Analytics API] Disconnected from MongoDB');
    });

    await mongoose.connect(MONGODB_URI);
  } catch (error) {
    console.error('[Analytics API] Failed to connect to MongoDB:', error.message);
  }
}

function isMongoConnected() {
  return mongoose.connection.readyState === 1;
}

async function closeMongo() {
  if (mongoose.connection.readyState !== 0) {
    console.log('[Analytics API] Closing MongoDB connection...');
    await mongoose.connection.close();
  }
}

module.exports = {
  connectDB,
  isMongoConnected,
  closeMongo
};
