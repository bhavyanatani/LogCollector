# Distributed Log Analytics & Observability Platform

A production-ready, event-driven microservices platform built with Node.js, Express, Redis Streams, MongoDB, Next.js, and Docker.

The platform provides end-to-end e-commerce business operations with **asynchronous log ingestion, real-time analytics aggregation, distributed request tracing, log export (CSV/JSON), and live observability dashboards.**

---

## 1. System Architecture & Overall Flow

```
┌─────────────────────────────────────────────────────────────────────────────────────────────────────────┐
│                                           USER & ADMIN CLIENTS                                          │
│                                                                                                         │
│  User E-Commerce App (Port 3000)                             Admin Observability Dashboard (Port 3005)  │
└───────────────────┬──────────────────────────────────────────────────────────▲──────────────────────────┘
                    │                                                          │
                    │ HTTP Requests (X-Request-ID propagation)                 │ REST API (Aggregations & Traces)
                    ▼                                                          │
┌────────────────────────────────────────────────────────┐                     │
│                 MICROSERVICES LAYER                    │                     │
│                                                        │                     │
│  Auth Service (3001) ──┐                               │                     │
│  Email Service (3002) ──┼──► Async HTTP Log POST       │                     │
│  Order Service (3003) ──┘    (Non-blocking Gateway call)│                     │
└───────────────────────────────┬────────────────────────┘                     │
                                │                                              │
                                ▼                                              │
┌────────────────────────────────────────────────────────┐                     │
│               LOG INGESTION PIPELINE                   │                     │
│                                                        │                     │
│  Log Collector Gateway (Port 4000)                     │                     │
│              │                                         │                     │
│              ▼ XADD (Pushes to Redis Queue Stream)     │                     │
│       Redis Stream (`application-logs`)                │                     │
│              │                                         │                     │
│              ▼ XREADGROUP (Consumer Group Pull)        │                     │
│  Log Processor Worker (Port 4001)                      │                     │
│    - Log Validation & Format Normalization             │                     │
│    - Metadata Enrichment (Geo, Host, Trace Tags)       │                     │
└───────────────────────────────┬────────────────────────┘                     │
                                │                                              │
                                ▼ MongoDB Write (`logs` collection)            │
┌────────────────────────────────────────────────────────┐                     │
│                   STORAGE & ANALYTICS                  │                     │
│                                                        │                     │
│  MongoDB Database (`logcollector_db`)                  │                     │
│  - Collection: `logs` (Indexed: requestId, timestamp) │                     │
│              │                                         │                     │
│              ▼ Queries / Aggregations                  │                     │
│  Analytics API (Port 4002) ────────────────────────────┴─────────────────────┘
│  - GET /analytics/summary, /logs, /services, /errors, /performance
│  - GET /analytics/traces/:requestId (Distributed Distributed Trace)
│  - GET /analytics/logs/export (CSV & JSON Stream Export)
└─────────────────────────────────────────────────────────────────────────────────┘
```

---

## 2. Platform Features

- **Asynchronous Non-Blocking Log Ingestion**: Microservices send fire-and-forget HTTP POST requests to the Log Collector Gateway, which queues them into Redis Streams (`XADD`), ensuring client operations never wait on log processing or database persistence.
- **Distributed Request Tracing**: Propagation of `X-Request-ID` across inter-service calls (Auth ➔ Email, Order ➔ Email). Visualized in the Admin Dashboard with microsecond breakdown timelines.
- **Structured Log Schema & Enrichment**: Standardized log format containing `requestId`, `service`, `level`, `event`, `http`, `performance`, `metadata`, `trace`, and `error`.
- **Real-Time Observability Dashboard**: Built with Next.js 14, Tailwind CSS, Recharts, and Lucide icons. Includes Log Explorer with filtering, Service Health metrics, Error Rate breakdown, Endpoint Latency tables, and Trace visualizer.
- **Data Exporting**: Export filtered logs to **CSV** or **JSON** directly from the UI.
- **Containerization**: Fully dockerized stack with multi-stage builds, health checks, network isolation, and Docker Compose orchestration.

---

## 3. Quick Start Setup Guide

You can run the entire platform either using **Docker Compose (Recommended)** or **Locally**.

---

### Option A: Running with Docker Compose (Recommended)

#### Prerequisites
- [Docker Desktop](https://www.docker.com/products/docker-desktop/) installed and running.

#### Step 1: Clone & Launch All Services
```bash
git clone https://github.com/bhavyanatani/LogCollector.git
cd LogCollector

# Start all 10 containers in detached mode
docker compose up -d
```

#### Step 2: Seed Sample Products into MongoDB
To populate the database with e-commerce products for the User App:
```bash
# Run the node seed script targeting Docker MongoDB (Port 27018)
node orders/seed.js
```

#### Step 3: Access Applications & Services
- **User E-Commerce App**: [http://localhost:3000](http://localhost:3000)
- **Admin Observability Dashboard**: [http://localhost:3005](http://localhost:3005)
- **Analytics API**: [http://localhost:4002/health](http://localhost:4002/health)
- **Log Collector Gateway**: [http://localhost:4000/health](http://localhost:4000/health)
- **MongoDB**: `mongodb://localhost:27018/logcollector_db` *(Mapped to host port 27018)*
- **Redis**: `redis://localhost:6379`

#### Step 4: Stop Containers
```bash
docker compose down
```

---

### Option B: Running Locally (Native Node.js)

#### Prerequisites
- Node.js `v18.x` or higher
- MongoDB running on `localhost:27017`
- Redis server running on `localhost:6379`

#### Step 1: Install Dependencies
Run `npm install` inside each folder:
```bash
cd auth && npm install
cd ../email && npm install
cd ../orders && npm install
cd ../log-collector && npm install
cd ../log-processor && npm install
cd ../analytics-api && npm install
cd ../Frontend/user-app && npm install
cd ../Frontend/admin-dashboard && npm install
```

#### Step 2: Configure Environment Files (`.env`)
Create `.env` in each service folder based on `.env.example` templates (set `MONGODB_URI=mongodb://localhost:27017/logcollector_db` and `REDIS_URL=redis://localhost:6379`).

#### Step 3: Seed Products
```bash
cd orders
npm run seed
```

#### Step 4: Start Services
Start each service in a separate terminal:
```bash
# Terminal 1: Auth Service
cd auth && npm start

# Terminal 2: Email Service
cd email && npm start

# Terminal 3: Order Service
cd orders && npm start

# Terminal 4: Log Collector Gateway
cd log-collector && npm start

# Terminal 5: Log Processor Worker
cd log-processor && npm start

# Terminal 6: Analytics API
cd analytics-api && npm start

# Terminal 7: User E-Commerce App
cd Frontend/user-app && npm run dev

# Terminal 8: Admin Observability Dashboard
cd Frontend/admin-dashboard && npm run dev
```

---

## 4. How to Enter Products into MongoDB

### Method 1: Using the Automated Seed Script (Fastest)
```bash
# For Docker mode (port 27018):
node orders/seed.js

# For Local mode (port 27017):
cd orders && npm run seed
```

### Method 2: Manual Entry via MongoDB Compass
1. Open **MongoDB Compass**.
2. Connect to URI:
   - Docker Mode: `mongodb://localhost:27018`
   - Local Mode: `mongodb://localhost:27017`
3. Select database `logcollector_db`.
4. Click on collection `products` (create collection if it doesn't exist).
5. Click **ADD DATA** ➔ **Insert Document** and paste sample documents:
```json
[
  {
    "name": "Mechanical Gaming Keyboard",
    "description": "RGB backlight mechanical keyboard with tactile blue switches.",
    "price": 89.99,
    "stock": 50
  },
  {
    "name": "Wireless Ergonomic Mouse",
    "description": "2.4GHz ultra-fast wireless optical mouse with dual thumb buttons.",
    "price": 34.50,
    "stock": 120
  }
]
```

---

## 5. Microservice Repository Directory Map

Each microservice directory includes its own detailed documentation:

- 🔐 [Auth Service (`/auth`)](file:///c:/Users/bhavy/Downloads/VSCode/Projects/LogCollector/auth/README.md) - User registration, authentication, and JWT token issuance.
- 📧 [Email Service (`/email`)](file:///c:/Users/bhavy/Downloads/VSCode/Projects/LogCollector/email/README.md) - Notification service handling welcome emails and order confirmations.
- 🛒 [Order Service (`/orders`)](file:///c:/Users/bhavy/Downloads/VSCode/Projects/LogCollector/orders/README.md) - Catalog management, shopping cart, order placement, and payment processing.
- 📥 [Log Collector Gateway (`/log-collector`)](file:///c:/Users/bhavy/Downloads/VSCode/Projects/LogCollector/log-collector/README.md) - Ingestion API receiving logs and pushing to Redis Stream (`application-logs`).
- ⚙️ [Log Processor Worker (`/log-processor`)](file:///c:/Users/bhavy/Downloads/VSCode/Projects/LogCollector/log-processor/README.md) - Background consumer processing, validating, enriching, and saving logs to MongoDB.
- 📊 [Analytics API (`/analytics-api`)](file:///c:/Users/bhavy/Downloads/VSCode/Projects/LogCollector/analytics-api/README.md) - Aggregations, log searching, tracing endpoints, and CSV/JSON exporter.
- 🛍️ [User E-Commerce App (`/Frontend/user-app`)](file:///c:/Users/bhavy/Downloads/VSCode/Projects/LogCollector/Frontend/user-app/README.md) - Next.js storefront for browsing products, managing cart, and placing orders.
- 🖥️ [Admin Dashboard (`/Frontend/admin-dashboard`)](file:///c:/Users/bhavy/Downloads/VSCode/Projects/LogCollector/Frontend/admin-dashboard/README.md) - Observability dashboard for real-time log analysis and request tracing.
