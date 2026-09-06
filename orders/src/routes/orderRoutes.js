const express = require('express');
const router = express.Router();
const productController = require('../controllers/productController');
const cartController = require('../controllers/cartController');
const orderController = require('../controllers/orderController');
const authenticate = require('../middleware/authenticate');

router.get('/products', productController.getProducts);
router.get('/health', orderController.getHealth);

router.post('/cart', authenticate, cartController.addToCart);
router.get('/cart', authenticate, cartController.getCart);
router.patch('/cart/items/:productId', authenticate, cartController.updateCartItem);
router.delete('/cart/items/:productId', authenticate, cartController.removeCartItem);

router.post('/orders', authenticate, orderController.createOrder);
router.get('/orders/:id', authenticate, orderController.getOrderById);
router.post('/orders/:id/payment', authenticate, orderController.processPayment);
router.post('/orders/:id/cancel', authenticate, orderController.cancelOrder);

module.exports = router;
