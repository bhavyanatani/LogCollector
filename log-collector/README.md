# Log Collector Gateway

The **Log Collector Gateway** is the central high-throughput ingestion endpoint for the platform's distributed log pipeline.

---

## 1. Responsibilities

- Exposes a dedicated HTTP ingestion endpoint (`POST /logs`).
- Receives structured log payloads from upstream microservices (`auth`, `email`, `orders`).
- Pushes incoming log events into a **Redis Stream** (`application-logs`) via `XADD`.
- Operates asynchronously and non-blockingly, guaranteeing microservices receive instant responses without waiting for database writes.

---

## 2. Directory Structure

```text
log-collector/
├── Dockerfile                  # Multi-stage Docker build configuration
├── package.json                # Dependencies and scripts
├── .env.example                # Template for environment variables
└── src/
    ├── app.js                  # Express app setup and route mounting
    ├── server.js               # HTTP listener and Redis client initialization
    ├── config/
    │   └── redis.js            # ioredis connection client configuration
    ├── controllers/
    │   └── logCollectorController.js # Validate log payload & push to Redis Stream (XADD)
    ├── middleware/
    │   ├── errorHandler.js     # Global error handler
    │   └── requestId.js        # Request ID middleware
    └── routes/
        └── logCollectorRoutes.js # Ingestion route endpoints
```

---

## 3. Configuration & Environment Variables

Create a `.env` file in this directory:

```env
PORT=4000
REDIS_URL=redis://localhost:6379
LOG_STREAM=application-logs
NODE_ENV=development
SERVICE_NAME=log-collector
```

---

## 4. API Endpoints

### 1. Ingest Log Batch / Single Log
- **Method & Path**: `POST /logs`
- **Headers**: `Content-Type: application/json`
- **Request Body**:
  ```json
  {
    "service": "order-service",
    "level": "INFO",
    "event": "PAYMENT_SUCCESS",
    "message": "Payment completed successfully",
    "requestId": "req_8f72a91c",
    "userId": "66da1b2c4f5e6a7b8c9d0e1f",
    "http": {
      "method": "POST",
      "path": "/orders/123/payment",
      "statusCode": 200
    },
    "performance": {
      "responseTimeMs": 145
    }
  }
  ```
- **Response** (`202 Accepted`):
  ```json
  {
    "success": true,
    "message": "Log queued successfully",
    "data": {
      "streamId": "1725638400000-0"
    }
  }
  ```

### 2. Health Check
- **Method & Path**: `GET /health`
- **Response** (`200 OK`): `{ "status": "UP", "service": "log-collector", "redis": "connected" }`
