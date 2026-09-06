require('dotenv').config();
const app = require('./app');
const connectDB = require('./config/db');

const PORT = process.env.PORT || 3001;

async function startServer() {
  try {
    await connectDB();
    app.listen(PORT, () => {
      console.log(`[Auth Service] Running on port ${PORT}`);
    });
  } catch (error) {
    console.error(`[Auth Service] Server startup failed: ${error.message}`);
    process.exit(1);
  }
}

if (require.main === module) {
  startServer();
}

module.exports = { startServer };
