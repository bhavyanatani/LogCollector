const mongoose = require('mongoose');

const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/logcollector';

async function connectDB() {
  try {
    await mongoose.connect(MONGODB_URI);
    console.log('[Auth Service] Connected to MongoDB');
  } catch (error) {
    console.error(`[Auth Service] MongoDB connection error: ${error.message}`);
    process.exit(1);
  }
}

module.exports = connectDB;
