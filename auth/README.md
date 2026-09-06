# Auth Service

The **Auth Service** handles user registration, authentication, JWT token issuance, and user profile management for the LogCollector platform.

---

## 1. Responsibilities

- User Registration with hashed passwords (using `bcryptjs`).
- User Authentication with JWT token issuance (`jsonwebtoken`).
- Propagation of `X-Request-ID` across HTTP headers for distributed tracing.
- Asynchronous log emission to the Log Collector Gateway upon authentication events (`USER_REGISTERED`, `LOGIN_SUCCESS`, `LOGIN_FAILED`, `LOGOUT_SUCCESS`).
- Inter-service invocation to the Email Service (`POST /email/send`) to send welcome emails upon new user registration.

---

## 2. Directory Structure

```text
auth/
├── Dockerfile                  # Multi-stage Docker build configuration
├── package.json                # Dependencies and scripts
├── .env.example                # Template for environment variables
└── src/
    ├── app.js                  # Express app definition and route mounting
    ├── server.js               # HTTP server listener and DB initialization
    ├── config/
    │   └── db.js               # Mongoose MongoDB connection setup
    ├── controllers/
    │   └── authController.js   # Registration, login, logout business logic
    ├── middleware/
    │   ├── errorHandler.js     # Global error handling middleware
    │   └── requestId.js        # Request ID generator/extractor middleware
    ├── models/
    │   └── User.js             # Mongoose User schema (email, password hash, name)
    ├── routes/
    │   └── authRoutes.js       # Auth API route endpoints
    └── utils/
        └── logger.js           # Logger utility forwarding logs to Log Collector Gateway
```

---

## 3. Configuration & Environment Variables

Create a `.env` file in this directory:

```env
PORT=3001
MONGODB_URI=mongodb://localhost:27017/logcollector_db
JWT_SECRET=super_secret_jwt_key_phase1
EMAIL_SERVICE_URL=http://localhost:3002
LOG_COLLECTOR_URL=http://localhost:4000
NODE_ENV=development
SERVICE_NAME=auth-service
```

---

## 4. API Endpoints

### 1. Register User
- **Method & Path**: `POST /auth/register`
- **Headers**: `Content-Type: application/json`
- **Request Body**:
  ```json
  {
    "name": "Bhavya",
    "email": "bhavya@example.com",
    "password": "password123"
  }
  ```
- **Response** (`201 Created`):
  ```json
  {
    "success": true,
    "message": "User registered successfully",
    "data": {
      "user": {
        "_id": "66da1b2c4f5e6a7b8c9d0e1f",
        "name": "Bhavya",
        "email": "bhavya@example.com",
        "createdAt": "2026-09-06T12:00:00.000Z"
      }
    }
  }
  ```

### 2. Login User
- **Method & Path**: `POST /auth/login`
- **Headers**: `Content-Type: application/json`
- **Request Body**:
  ```json
  {
    "email": "bhavya@example.com",
    "password": "password123"
  }
  ```
- **Response** (`200 OK`):
  ```json
  {
    "success": true,
    "message": "Login successful",
    "data": {
      "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
      "user": {
        "_id": "66da1b2c4f5e6a7b8c9d0e1f",
        "name": "Bhavya",
        "email": "bhavya@example.com"
      }
    }
  }
  ```

### 3. Logout User
- **Method & Path**: `POST /auth/logout`
- **Headers**: `Content-Type: application/json`
- **Request Body**: `{ "userId": "66da1b2c4f5e6a7b8c9d0e1f" }`
- **Response** (`200 OK`):
  ```json
  {
    "success": true,
    "message": "Logout successful"
  }
  ```

### 4. Health Check
- **Method & Path**: `GET /health`
- **Response** (`200 OK`): `{ "status": "UP", "service": "auth-service" }`
