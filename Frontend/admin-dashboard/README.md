# Admin Observability Dashboard

The **Admin Observability Dashboard** is a Next.js 14 Web Application providing real-time log monitoring, metrics charts, endpoint health tracking, and request tracing visualizers.

---

## 1. Features & Responsibilities

- **Live Overview Dashboard**: Displays total log ingestion counters, active services, error rate %, and latency charts (Recharts).
- **Log Explorer**: Table view with level badges (INFO, WARN, ERROR), JSON metadata viewer, service filtering, and search.
- **Log Data Export**: Single-click export of filtered logs to **CSV** or **JSON** files.
- **Distributed Request Tracing**: Dedicated trace viewer (`/traces/[requestId]`) detailing microservice jump execution steps, timing spans, and correlation IDs.
- **Service Performance & Failures**: Visual breakdown of top slow endpoints and error distributions.

---

## 2. Directory Structure

```text
Frontend/admin-dashboard/
├── Dockerfile                  # Multi-stage Docker build configuration with Suspense support
├── package.json                # Next.js dependencies and scripts
├── next.config.mjs             # Next.js configuration
├── tailwind.config.js          # Dark theme Tailwind styling system
├── public/                     # Public static assets
└── app/
    ├── layout.js               # Root Admin Layout wrapper
    ├── page.js                 # Redirect to /dashboard
    ├── dashboard/              # Main observability dashboard overview
    ├── logs/                   # Log Explorer page (with Suspense boundary)
    │   └── [id]/               # Log entry detailed breakdown page
    ├── traces/
    │   └── [requestId]/        # Distributed request trace visualization page
    ├── services/               # Microservices health & metrics page
    ├── failures/               # Failure analysis & error breakdown page
    └── performance/            # Endpoint latency & percentile breakdown page
```

---

## 3. Configuration & Environment Variables

Create `.env.local` in this directory:

```env
NEXT_PUBLIC_ANALYTICS_API_URL=http://localhost:4002
```

---

## 4. Running the Dashboard

```bash
# Docker Mode (automatic via docker compose up -d)
# Access at http://localhost:3005

# Local Mode
cd Frontend/admin-dashboard
npm install
npm run dev
```
