# Order Service

The **Order Service** manages the e-commerce product catalog, shopping carts, order creation, and payment processing.

---

## 1. Responsibilities

- Product catalog retrieval (`GET /products`).
- Shopping cart management (add item, view cart, update quantity, remove item).
- Order creation from shopping cart contents (`POST /orders`).
- Simulated payment processing (`POST /orders/:id/payment`) with success/failure triggers.
- Order cancellation (`POST /orders/:id/cancel`).
- JWT authentication check for user-protected routes.
- Tracing context propagation (`X-Request-ID`) to the Email Service for order confirmation emails.
- Structured log forwarding to Log Collector Gateway.

---

## 2. Directory Structure

```text
orders/
├── Dockerfile                  # Multi-stage Docker build configuration
├── package.json                # Dependencies and scripts
├── seed.js                     # Seed script populating sample products
├── .env.example                # Template for environment variables
└── src/
    ├── app.js                  # Express application setup
    ├── server.js               # HTTP listener and DB connection setup
    ├── config/
    │   └── db.js               # Mongoose connection setup
    ├── controllers/
    │   ├── cartController.js   # Cart management logic
    │   ├── orderController.js  # Order placement, payment, and cancellation logic
    │   └── productController.js# Product catalog retrieval logic
    ├── middleware/
    │   ├── authenticate.js     # JWT verification middleware
    │   ├── errorHandler.js     # Global error handling middleware
    │   └── requestId.js        # Request ID propagation middleware
    ├── models/
    │   ├── Cart.js             # Mongoose Cart schema
    │   ├── Order.js            # Mongoose Order schema
    │   └── Product.js          # Mongoose Product schema
    ├── routes/
    │   ├── cartRoutes.js       # Cart API endpoints
    │   ├── orderRoutes.js      # Order API endpoints
    │   └── productRoutes.js    # Product API endpoints
    └── utils/
        └── logger.js           # Forwarder utility to Log Collector Gateway
```

---

## 3. Configuration & Environment Variables

Create a `.env` file in this directory:

```env
PORT=3003
MONGODB_URI=mongodb://localhost:27017/logcollector_db
JWT_SECRET=super_secret_jwt_key_phase1
EMAIL_SERVICE_URL=http://localhost:3002
LOG_COLLECTOR_URL=http://localhost:4000
NODE_ENV=development
SERVICE_NAME=order-service
```

---

## 4. Seeding Products

To populate sample products into MongoDB:

```bash
# Docker environment (mongo:27018)
node seed.js

# Local environment (mongo:27017)
npm run seed
```

---

## 5. API Endpoints

### 1. Product Catalog
- `GET /products` - Get all available products.

### 2. Cart Operations (JWT Protected)
- `POST /cart` - Add item to cart. Body: `{ "productId": "...", "quantity": 1 }`
- `GET /cart` - View user's current shopping cart.
- `PATCH /cart/items/:productId` - Update item quantity in cart.
- `DELETE /cart/items/:productId` - Remove item from cart.

### 3. Order Management (JWT Protected)
- `POST /orders` - Convert shopping cart into a new Order (`PENDING` status).
- `POST /orders/:id/payment` - Process payment for order. Body: `{ "result": "success" | "failed" }`
- `POST /orders/:id/cancel` - Cancel order and restore product stock.

### 4. Health Check
- `GET /health` - Health check status (`200 OK`).
