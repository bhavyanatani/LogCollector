const Cart = require('../models/Cart');
const Product = require('../models/Product');

exports.addToCart = async (req, res, next) => {
  try {
    const userId = req.userId || req.body.userId;
    const { productId, quantity = 1 } = req.body;

    if (!userId || !productId) {
      return res.status(400).json({
        success: false,
        message: 'productId is required'
      });
    }

    const product = await Product.findById(productId);
    if (!product) {
      return res.status(404).json({
        success: false,
        message: 'Product not found'
      });
    }

    let cart = await Cart.findOne({ userId });
    if (!cart) {
      cart = new Cart({ userId, items: [] });
    }

    const itemIndex = cart.items.findIndex(
      (item) => item.productId.toString() === productId.toString()
    );

    if (itemIndex > -1) {
      cart.items[itemIndex].quantity += Number(quantity);
    } else {
      cart.items.push({ productId, quantity: Number(quantity) });
    }

    await cart.save();
    await cart.populate('items.productId');

    return res.status(200).json({
      success: true,
      message: 'Item added to cart',
      data: cart
    });
  } catch (error) {
    next(error);
  }
};

exports.getCart = async (req, res, next) => {
  try {
    const userId = req.userId || req.params.userId;

    if (!userId) {
      return res.status(400).json({
        success: false,
        message: 'User authentication required'
      });
    }

    let cart = await Cart.findOne({ userId }).populate('items.productId');
    if (!cart) {
      cart = { userId, items: [] };
    }

    return res.status(200).json({
      success: true,
      data: cart
    });
  } catch (error) {
    next(error);
  }
};

exports.updateCartItem = async (req, res, next) => {
  try {
    const userId = req.userId || req.params.userId;
    const { productId } = req.params;
    const { quantity } = req.body;

    if (quantity === undefined || Number(quantity) < 1) {
      return res.status(400).json({
        success: false,
        message: 'Quantity must be at least 1'
      });
    }

    const cart = await Cart.findOne({ userId });
    if (!cart) {
      return res.status(404).json({
        success: false,
        message: 'Cart not found'
      });
    }

    const itemIndex = cart.items.findIndex(
      (item) => item.productId.toString() === productId.toString()
    );

    if (itemIndex === -1) {
      return res.status(404).json({
        success: false,
        message: 'Item not found in cart'
      });
    }

    cart.items[itemIndex].quantity = Number(quantity);
    await cart.save();
    await cart.populate('items.productId');

    return res.status(200).json({
      success: true,
      message: 'Cart item updated',
      data: cart
    });
  } catch (error) {
    next(error);
  }
};

exports.removeCartItem = async (req, res, next) => {
  try {
    const userId = req.userId || req.params.userId;
    const { productId } = req.params;

    const cart = await Cart.findOne({ userId });
    if (!cart) {
      return res.status(404).json({
        success: false,
        message: 'Cart not found'
      });
    }

    cart.items = cart.items.filter(
      (item) => item.productId.toString() !== productId.toString()
    );

    await cart.save();
    await cart.populate('items.productId');

    return res.status(200).json({
      success: true,
      message: 'Item removed from cart',
      data: cart
    });
  } catch (error) {
    next(error);
  }
};
