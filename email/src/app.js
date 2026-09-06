const express = require('express');
const requestIdMiddleware = require('./middleware/requestId');
const loggerMiddleware = require('./middleware/loggerMiddleware');
const errorHandler = require('./middleware/errorHandler');
const emailRoutes = require('./routes/emailRoutes');

const app = express();

app.use(express.json());
app.use(requestIdMiddleware);
app.use(loggerMiddleware);

app.use('/email', emailRoutes);

app.use(errorHandler);

module.exports = app;
