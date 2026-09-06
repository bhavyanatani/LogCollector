const Product = require('../models/Product');

exports.getProducts = async (req, res, next) => {
  try {
    const products = await Product.find().sort({ createdAt: -1 });
    return res.status(200).json({
      success: true,
      data: products
    });
  } catch (error) {
    next(error);
  }
};
