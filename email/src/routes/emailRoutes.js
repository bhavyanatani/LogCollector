const express = require('express');
const router = express.Router();
const emailController = require('../controllers/emailController');

router.post('/send', emailController.send);

router.get('/health', emailController.getHealth);

module.exports = router;
