# Email Service

The **Email Service** handles asynchronous email notifications (Welcome Emails, Order Confirmation Emails) for the platform using Nodemailer.

---

## 1. Responsibilities

- Processes email notification requests dispatched by Auth Service and Order Service.
- Operates in dev transport mode (JSON output) if SMTP credentials are missing, preventing external connection crashes during testing.
- Propagates incoming `X-Request-ID` headers to associate email delivery logs with upstream HTTP transactions.
- Emits structured event logs (`EMAIL_REQUESTED`, `EMAIL_SENT`, `EMAIL_DELIVERY_FAILED`) to the Log Collector Gateway.
- Stores historical email records in MongoDB (`emails` collection).

---

## 2. Directory Structure

```text
email/
├── Dockerfile                  # Multi-stage Docker build configuration
├── package.json                # Dependencies and scripts
├── .env.example                # Template for environment variables
└── src/
    ├── app.js                  # Express application setup
    ├── server.js               # HTTP server listener and DB initialization
    ├── config/
    │   ├── db.js               # Mongoose connection config
    │   └── email.js            # Nodemailer transport configuration
    ├── controllers/
    │   └── emailController.js  # Dispatch email & record status in MongoDB
    ├── middleware/
    │   ├── errorHandler.js     # Error handling middleware
    │   └── requestId.js        # Request ID extractor middleware
    ├── models/
    │   └── Email.js            # Mongoose Email schema (recipient, type, status)
    ├── routes/
    │   └── emailRoutes.js      # Email API route endpoints
    └── utils/
        └── logger.js           # Forwarder utility to Log Collector Gateway
```

---

## 3. Configuration & Environment Variables

Create a `.env` file in this directory:

```env
PORT=3002
MONGODB_URI=mongodb://localhost:27017/logcollector_db
LOG_COLLECTOR_URL=http://localhost:4000
SMTP_HOST=
SMTP_PORT=587
SMTP_USER=
SMTP_PASSWORD=
SMTP_FROM=noreply@logcollector.local
NODE_ENV=development
SERVICE_NAME=email-service
```

---

## 4. API Endpoints

### 1. Send Email Notification
- **Method & Path**: `POST /email/send`
- **Headers**:
  - `Content-Type: application/json`
  - `X-Request-ID: req_9999` *(Optional: propagated from upstream service)*
- **Request Body**:
  ```json
  {
    "type": "WELCOME_EMAIL",
    "to": "bhavya@example.com",
    "userId": "66da1b2c4f5e6a7b8c9d0e1f",
    "requestId": "req_9999"
  }
  ```
- **Response** (`200 OK`):
  ```json
  {
    "success": true,
    "message": "Email request processed",
    "data": {
      "emailId": "66da2a1b3c4d5e6f7a8b9c0d",
      "status": "SENT"
    }
  }
  ```

### 2. Health Check
- **Method & Path**: `GET /health`
- **Response** (`200 OK`): `{ "status": "UP", "service": "email-service" }`
