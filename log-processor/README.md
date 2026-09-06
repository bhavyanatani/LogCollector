# Log Processor Worker

The **Log Processor Worker** is an event-driven background consumer service that processes, normalizes, enriches, and persists application logs into MongoDB.

---

## 1. Responsibilities

- Consumes log messages from the Redis Stream (`application-logs`) using Redis Consumer Groups (`XREADGROUP`).
- Validates log schema integrity and applies default fallbacks for missing fields.
- Enriches log payloads with metadata:
  - System host tags (`hostname`, `pid`)
  - Trace tags (`traceId`, `spanId`)
  - Normalized ISO 8601 timestamps
- Persists enriched log documents into MongoDB (`logcollector_db.logs`).
- Acknowledges processed stream items (`XACK`) to prevent duplicate processing.

---

## 2. Directory Structure

```text
log-processor/
├── Dockerfile                  # Multi-stage Docker build configuration
├── package.json                # Dependencies and scripts
├── .env.example                # Template for environment variables
└── src/
    ├── app.js                  # Express app for worker health check endpoint
    ├── server.js               # Worker bootstrapper & stream loop initiator
    ├── config/
    │   ├── db.js               # Mongoose MongoDB setup
    │   └── redis.js            # ioredis client setup
    ├── models/
    │   └── ProcessedLog.js     # Mongoose ProcessedLog schema (with requestId index)
    ├── services/
    │   └── logProcessor.js     # Worker polling loop (XREADGROUP + batch insert + XACK)
    └── utils/
        └── logEnricher.js      # Metadata enrichment utility (tags, geo, timestamp)
```

---

## 3. Configuration & Environment Variables

Create a `.env` file in this directory:

```env
PORT=4001
REDIS_URL=redis://localhost:6379
MONGODB_URI=mongodb://localhost:27017/logcollector_db
LOG_STREAM=application-logs
CONSUMER_GROUP=log-processor-group
CONSUMER_NAME=worker-1
NODE_ENV=development
SERVICE_NAME=log-processor
```

---

## 4. Operational Flow

1. **Initialize Consumer Group**: Ensures consumer group `log-processor-group` exists on stream `application-logs`.
2. **Stream Polling Loop**: Calls `XREADGROUP GROUP log-processor-group worker-1 COUNT 10 BLOCK 2000 STREAMS application-logs >`.
3. **Validation & Enrichment**: Formats payload, appends system/trace metadata.
4. **Batch Insertion**: Executes `ProcessedLog.insertMany(...)` into MongoDB.
5. **Stream Acknowledgment**: Calls `XACK application-logs log-processor-group <message_id>` after successful database write.
