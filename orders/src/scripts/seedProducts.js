require('dotenv').config();
const mongoose = require('mongoose');
const Product = require('../models/Product');

const sampleProducts = [
  {
    name: 'Laptop',
    description: 'High-performance laptop for software engineering and development work.',
    price: 1299.99,
    stock: 50
  },
  {
    name: 'Keyboard',
    description: 'Mechanical RGB keyboard with tactile switches.',
    price: 89.99,
    stock: 150
  },
  {
    name: 'Mouse',
    description: 'Ergonomic wireless optical gaming mouse.',
    price: 49.99,
    stock: 200
  },
  {
    name: 'Headphones',
    description: 'Noise-canceling over-ear studio headphones.',
    price: 199.99,
    stock: 75
  },
  {
    name: 'Monitor',
    description: '27-inch 4K UHD IPS display monitor.',
    price: 349.99,
    stock: 60
  }
];

async function seedProducts() {
  const mongoURI = process.env.MONGODB_URI || 'mongodb://localhost:27017/logcollector';
  try {
    await mongoose.connect(mongoURI);
    console.log(`Connected to MongoDB at ${mongoURI}`);

    await Product.deleteMany({});
    const inserted = await Product.insertMany(sampleProducts);

    console.log(`Successfully seeded ${inserted.length} sample products:`);
    inserted.forEach((prod) => console.log(` - ID: ${prod._id} | Name: ${prod.name} | Price: $${prod.price}`));

    await mongoose.disconnect();
    process.exit(0);
  } catch (error) {
    console.error('Error seeding products:', error.message);
    process.exit(1);
  }
}

if (require.main === module) {
  seedProducts();
}

module.exports = seedProducts;
