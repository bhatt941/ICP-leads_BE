# B2B Lead Intelligence Backend

Node.js, Express, MongoDB, Redis, BullMQ, JWT, and scraper backend for B2B lead discovery, enrichment, hiring intelligence, scoring, exports, and enterprise access control.

## Run

Memory mode, no MongoDB or Redis required:

```bash
cp .env.example .env
# set DATABASE_MODE=memory
npm install
npm run dev
```

Docker mode with MongoDB, Redis, API, worker, and cron:

```bash
cp .env.example .env
# set DATABASE_MODE=auto and MONGODB_URI=mongodb://mongo:27017/lead_intelligence
docker compose up --build
```

Health:

```text
GET /health
GET /api/v1/health
```

Returns:

```json
{
  "status": "ok",
  "database": "connected",
  "redis": "connected",
  "uptime": 123,
  "timestamp": "2026-06-10T00:00:00.000Z"
}
```

## Environment

```env
NODE_ENV=development
PORT=5000
API_PREFIX=/api/v1
DATABASE_MODE=memory
MONGODB_URI=mongodb://localhost:27017/lead_intelligence
REDIS_HOST=localhost
REDIS_PORT=6379
REDIS_PASSWORD=
ACCESS_TOKEN_SECRET=replace-with-secret-1
ACCESS_TOKEN_EXPIRES=15m
REFRESH_TOKEN_SECRET=replace-with-secret-2
REFRESH_TOKEN_EXPIRES=30d
GOOGLE_CLIENT_ID=
GOOGLE_CLIENT_SECRET=
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=
SMTP_PASS=
FRONTEND_URL=http://localhost:3000
OPENAI_API_KEY=
SCRAPER_TIMEOUT_MS=25000
SCRAPER_USER_AGENT=Mozilla/5.0
SCRAPER_HEADLESS=true
SCRAPER_CONCURRENCY=3
DAILY_COMPANY_REFRESH_CRON=0 2 * * *
DAILY_HIRING_REFRESH_CRON=0 3 * * *
WEEKLY_CONTACT_REFRESH_CRON=0 4 * * 1
WEEKLY_TECH_REFRESH_CRON=0 5 * * 1
```

## Endpoints

Auth:

- `POST /api/v1/auth/register`
- `POST /api/v1/auth/verify-email`
- `GET /api/v1/auth/verify-email?token=...`
- `POST /api/v1/auth/login`
- `POST /api/v1/auth/google`
- `POST /api/v1/auth/refresh-token`
- `POST /api/v1/auth/logout`
- `POST /api/v1/auth/logout-all`
- `POST /api/v1/auth/forgot-password`
- `POST /api/v1/auth/reset-password`

User:

- `GET /api/v1/user/profile`
- `PATCH /api/v1/user/profile`
- `DELETE /api/v1/user/account`

Companies:

- `GET /api/v1/companies`
- `GET /api/v1/companies/:id`
- `POST /api/v1/companies`
- `PUT /api/v1/companies/:id`
- `DELETE /api/v1/companies/:id`
- `POST /api/v1/companies/search`
- `POST /api/v1/companies/bulk`
- `GET /api/v1/companies/export?format=csv`

Contacts:

- `GET /api/v1/contacts`
- `GET /api/v1/contacts/:id`
- `POST /api/v1/contacts`
- `PUT /api/v1/contacts/:id`
- `DELETE /api/v1/contacts/:id`

Jobs:

- `GET /api/v1/jobs`
- `GET /api/v1/jobs/:id`
- `POST /api/v1/jobs`
- `PUT /api/v1/jobs/:id`
- `DELETE /api/v1/jobs/:id`

Analytics:

- `GET /api/v1/analytics/overview`
- `GET /api/v1/analytics/hiring`
- `GET /api/v1/analytics/industries`
- `GET /api/v1/analytics/lead-scores`

Enterprise:

- `POST /api/v1/organizations`
- `GET /api/v1/organizations/:id`
- `PUT /api/v1/organizations/:id`
- `DELETE /api/v1/organizations/:id/members/:userId`
- `PATCH /api/v1/organizations/:id/members/:userId/role`
- `GET /api/v1/team`
- `POST /api/v1/team/invite`
- `POST /api/v1/team/accept`
- `PATCH /api/v1/team/:userId/role`
- `DELETE /api/v1/team/:userId`
- `POST /api/v1/api-keys`
- `GET /api/v1/api-keys`
- `DELETE /api/v1/api-keys/:id`
- `POST /api/v1/saved-lists`
- `GET /api/v1/saved-lists`
- `GET /api/v1/saved-lists/:id`
- `PUT /api/v1/saved-lists/:id`
- `DELETE /api/v1/saved-lists/:id`
- `POST /api/v1/saved-lists/:id/companies`
- `DELETE /api/v1/saved-lists/:id/companies/:companyId`
- `GET /api/v1/audit-logs`
- `GET /api/v1/sessions`
- `DELETE /api/v1/sessions/:id`

List endpoints support `page`, `limit`, `sort`, and `order`.

## Queue Pipeline

1. `company-discovery`: Google/Bing discovery for company URLs.
2. `company-enrichment`: website crawl, emails, phones, socials, careers URL.
3. `people-discovery`: decision-maker search and leadership parsing.
4. `job-discovery`: careers parsing and individual job parsing.
5. `technology-enrichment`: stack and vendor detection.
6. `lead-scoring`: scores signals and updates company grade.

In `DATABASE_MODE=memory`, queues log jobs and return fake IDs instead of connecting to Redis.

## Scrapers

Scrapers are pure functions and do not touch the database. They use Axios/Cheerio first and Playwright Chromium as a fallback.
