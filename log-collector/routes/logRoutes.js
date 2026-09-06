const express = require('express');
const router = express.Router();
const logController = require('../controllers/logController');

router.post('/logs', logController.ingestLog);
router.get('/health', logController.getHealth);

module.exports = router;
