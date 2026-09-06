const express = require('express');
const router = express.Router();
const analyticsController = require('../controllers/analyticsController');

router.get('/overview', analyticsController.getOverview);
router.get('/failures', analyticsController.getFailures);
router.get('/performance', analyticsController.getPerformance);
router.get('/services', analyticsController.getServices);
router.get('/errors', analyticsController.getErrors);
router.get('/endpoints', analyticsController.getEndpoints);
router.get('/endpoints/slow', analyticsController.getSlowEndpoints);

router.get('/logs', analyticsController.getLogs);
router.get('/logs/:id', analyticsController.getLogById);

router.get('/traces/:requestId', analyticsController.getTrace);

module.exports = router;
