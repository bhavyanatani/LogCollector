# Analytics API

The **Analytics API** serves as the backend query and aggregation engine powering the Admin Observability Dashboard.

---

## 1. Responsibilities

- Aggregates system metrics (Total Logs, Error Rates, Avg Response Times, Active Services).
- Provides filtered log exploration with pagination, service/level filters, and date ranges.
- Executes Distributed Request Tracing (`GET /analytics/traces/:requestId`) to reconstruct end-to-end request flows across microservices.
- Exports filtered logs to **CSV** and **JSON** stream formats.
- Generates service performance breakdowns and top slow endpoints.

---

## 2. Directory Structure

```text
analytics-api/
├── Dockerfile                  # Multi-stage Docker build configuration
├── package.json                # Dependencies and scripts
├── .env.example                # Template for environment variables
└── src/
    ├── app.js                  # Express setup and route mounting
    ├── server.js               # HTTP listener and DB connection initialization
    ├── config/
    │   └── db.js               # Mongoose database setup
    ├── controllers/
    │   └── analyticsController.js # Aggregations, trace lookup, & export logic
    ├── middleware/
    │   └── errorHandler.js     # Global error handling middleware
    ├── models/
    │   └── ProcessedLog.js     # Shared ProcessedLog Mongoose model
    └── routes/
        └── analyticsRoutes.js  # Analytics REST endpoints
```

---

## 3. Configuration & Environment Variables

Create a `.env` file in this directory:

```env
PORT=4002
MONGODB_URI=mongodb://localhost:27017/logcollector_db
NODE_ENV=development
SERVICE_NAME=analytics-api
```

---

## 4. API Endpoints

### 1. Dashboard Overview & Aggregations
- `GET /analytics/overview` - Returns total log counts, level breakdown (INFO, WARN, ERROR), error rate %, and average system latency.
- `GET /analytics/failures` - Detailed failure metrics, critical event breakdowns, and recent error log records.
- `GET /analytics/services` - Health and error rate breakdown per individual microservice (`auth-service`, `email-service`, `order-service`).
- `GET /analytics/errors` - Error log aggregations grouped by event type and service.

### 2. Latency & Endpoint Performance
- `GET /analytics/performance` - System-wide latency percentiles (p50, p95, p99) and response time distributions.
- `GET /analytics/endpoints` - Endpoint performance metrics grouped by HTTP method and path.
- `GET /analytics/endpoints/slow` - Ranked list of top slow endpoints (`responseTimeMs >= 500ms`).

### 3. Log Explorer & Search
- `GET /analytics/logs?page=1&limit=20&service=order-service&level=ERROR` - Filtered & paginated log search.
- `GET /analytics/logs/:id` - Retrieve individual log document details by MongoDB `_id`.

### 4. Distributed Request Tracing
- `GET /analytics/traces/:requestId` - Reconstructs execution timeline, total duration, service hop sequence, and status (`SUCCESS`/`FAILED`) for a correlation `requestId`.
