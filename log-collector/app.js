const express = require('express');
const requestIdMiddleware = require('./middleware/requestId');
const errorHandler = require('./middleware/errorHandler');
const logRoutes = require('./routes/logRoutes');

const app = express();

app.use(express.json());
app.use(requestIdMiddleware);

app.use('/', logRoutes);

app.use(errorHandler);

module.exports = app;
