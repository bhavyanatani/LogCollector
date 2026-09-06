require('dotenv').config();
const app = require('./app');
const connectDB = require('./config/db');

const PORT = process.env.PORT || 3002;

async function startServer() {
  try {
    await connectDB();
    app.listen(PORT, () => {
      console.log(`[Email Service] Running on port ${PORT}`);
    });
  } catch (error) {
    console.error(`[Email Service] Server startup failed: ${error.message}`);
    process.exit(1);
  }
}

if (require.main === module) {
  startServer();
}

module.exports = { startServer };
