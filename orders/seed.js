const mongoose = require('mongoose');
const Product = require('./src/models/Product');

const MONGODB_URI = 'mongodb://localhost:27018/logcollector_db';

const sampleProducts = [
  {
    name: 'Mechanical Gaming Keyboard',
    description: 'RGB backlight mechanical keyboard with tactile blue switches.',
    price: 89.99,
    stock: 50
  },
  {
    name: 'Wireless Ergonomic Mouse',
    description: '2.4GHz ultra-fast wireless optical mouse with dual thumb buttons.',
    price: 34.50,
    stock: 120
  },
  {
    name: 'Noise-Canceling Headphones',
    description: 'Over-ear Bluetooth headphones with active noise cancellation.',
    price: 149.00,
    stock: 35
  },
  {
    name: 'Ultra-Wide 4K Monitor 34"',
    description: 'Curved 144Hz IPS display panel with HDR400 support.',
    price: 499.99,
    stock: 15
  },
  {
    name: 'USB-C Multi-Port Hub',
    description: '7-in-1 aluminum dongle with 4K HDMI, SD card reader, and PD charging.',
    price: 27.99,
    stock: 200
  }
];

async function seed() {
  try {
    console.log('Connecting to MongoDB at', MONGODB_URI);
    await mongoose.connect(MONGODB_URI);
    console.log('Connected! Seeding products...');

    await Product.deleteMany({});
    const inserted = await Product.insertMany(sampleProducts);
    console.log(`Successfully seeded ${inserted.length} products into logcollector_db.products!`);

    process.exit(0);
  } catch (err) {
    console.error('Error seeding products:', err);
    process.exit(1);
  }
}

seed();
