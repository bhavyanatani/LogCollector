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

### 1. Dashboard Overview Metrics
- `GET /analytics/summary` - Returns overall statistics (log counts, level breakdown, error rate %, response times).

### 2. Log Explorer & Search
- `GET /analytics/logs?page=1&limit=20&service=order-service&level=ERROR` - Filtered & paginated log search.

### 3. Log Details
- `GET /analytics/logs/:id` - Retrieve individual log document details by MongoDB `_id`.

### 4. Distributed Request Tracing
- `GET /analytics/traces/:requestId` - Assembles execution timeline, total duration, service sequence, and status for a given `requestId`.

### 5. Microservice Analytics
- `GET /analytics/services` - Health and error rate breakdown per microservice.

### 6. Failure Analysis
- `GET /analytics/errors` - Error log aggregation grouped by event and service.

### 7. Latency & Performance Breakdown
- `GET /analytics/performance` - Percentiles (p50, p95, p99) and top slow endpoints.

### 8. Log Exporting
- `GET /analytics/logs/export?format=csv` - Streams logs in CSV format.
- `GET /analytics/logs/export?format=json` - Streams logs in JSON format.
