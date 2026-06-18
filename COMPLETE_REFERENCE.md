# B2B Lead Intelligence Backend - Complete Implementation Reference

## 📋 Table of Contents
1. [Architecture Overview](#architecture-overview)
2. [API Endpoints](#api-endpoints)
3. [Database Schema](#database-schema)
4. [Queue Systems](#queue-systems)
5. [Services & Scrapers](#services--scrapers)
6. [Deployment](#deployment)
7. [Testing](#testing)

---

## Architecture Overview

### System Architecture Diagram

```
┌─────────────────────────────────────────────────────────────────┐
│                     React Frontend (Port 5173)                   │
└────────────────────────────┬────────────────────────────────────┘
                             │
                    HTTP/REST │
                             │
        ┌────────────────────▼────────────────────┐
        │   Express API Server (Port 3000)        │
        │   - JWT Authentication                  │
        │   - Request Validation                  │
        │   - Rate Limiting                       │
        │   - CORS & Security Headers             │
        └────────────┬──────────────────┬─────────┘
                     │                  │
          Routes    │                  │ Routes
          (Express)  │                  │
                     │                  │
        ┌────────────▼─────┐    ┌──────▼──────────┐
        │  Controllers     │    │ Controllers     │
        │  (Coordination)  │    │ (Domain Logic)  │
        └────────────┬─────┘    └──────┬──────────┘
                     │                  │
        ┌────────────▼──────────────────▼──────────┐
        │  Services (Domain Business Logic)        │
        │  - CompanyService                        │
        │  - JobService                            │
        │  - CompanyDiscoveryService               │
        │  - JobScrapingService                    │
        │  - LeadScoringService                    │
        └────────────┬──────────────────┬──────────┘
                     │                  │
        ┌────────────▼────────┐  ┌──────▼──────────┐
        │ Repositories        │  │ Queue Producers │
        │ (Data Access)       │  │ (Job Enqueueing)│
        └────────────┬────────┘  └──────┬──────────┘
                     │                  │
        ┌────────────▼──────────────────▼──────────┐
        │        MongoDB Database                  │
        │ - Users, Companies, Jobs, Contacts      │
        │ - Organization, SavedLists, AuditLogs   │
        └─────────────────────────────────────────┘
                     │
        ┌────────────▼──────────────────────────┐
        │      Redis Database                   │
        │  - BullMQ Queues                      │
        │  - Cache Layer                        │
        │  - Rate Limit Store                   │
        └─────────────────────────────────────┘
                     │
        ┌────────────▼──────────────────────────┐
        │      Worker Process                   │
        │  - Discovery Worker                   │
        │  - Enrichment Worker                  │
        │  - Job Scraping Worker                │
        │  - People Worker                      │
        │  - Technology Worker                  │
        │  - Scoring Worker                     │
        │                                        │
        │  Triggers Scrapers:                   │
        │  - googleSearch, bingSearch           │
        │  - websiteCrawler, careersPageParser  │
        │  - jobParser, peopleParser            │
        │  - technologyDetector                 │
        └─────────────────────────────────────┘
                     │
        ┌────────────▼──────────────────────────┐
        │    External Sources                   │
        │  - Google Search                      │
        │  - Bing Search                        │
        │  - DuckDuckGo                         │
        │  - Career Pages                       │
        │  - LinkedIn                           │
        │  - Public Websites                    │
        └─────────────────────────────────────┘
```

### Request-Response Flow

```
1. Client Request
   ↓
2. CORS & Security Middleware
   ↓
3. Authentication (JWT/API Key)
   ↓
4. Rate Limiter
   ↓
5. Request Validation
   ↓
6. Route Handler
   ↓
7. Controller (Extract & Pass Data)
   ↓
8. Service (Business Logic)
   ↓
9. Repository (Data Access)
   ↓
10. MongoDB Query
    ↓
11. Response Format (Success/Error)
    ↓
12. Client Response
```

### Async Job Flow

```
1. API Request (with async: true)
   ↓
2. Queue Producer
   ↓
3. Job Added to BullMQ (Redis)
   ↓
4. Response: {jobId, status: "queued"}
   ↓
5. Worker Picks Up Job
   ↓
6. Service Processes Job
   ↓
7. Scraper Fetches Data
   ↓
8. Normalize & Deduplicate
   ↓
9. Save to MongoDB
   ↓
10. Trigger Child Jobs (if needed)
    ↓
11. Log Completion
```

---

## API Endpoints

### Base URL
```
http://localhost:3000/api/v1
```

### Authentication Endpoints
| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/auth/register` | Register new user |
| POST | `/auth/login` | Login user |
| POST | `/auth/verify-email` | Verify email with token |
| POST | `/auth/refresh` | Refresh access token |
| POST | `/auth/logout` | Logout user |
| POST | `/auth/forgot-password` | Request password reset |
| POST | `/auth/reset-password` | Reset password |
| POST | `/auth/google` | Google OAuth login |

### User Endpoints
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/user` | Get current user |
| PUT | `/user` | Update user profile |

### Company Endpoints
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/companies` | List companies |
| POST | `/companies` | Create company |
| GET | `/companies/:id` | Get company detail |
| PUT | `/companies/:id` | Update company |
| DELETE | `/companies/:id` | Delete company |
| POST | `/companies/search` | Discover companies |
| POST | `/companies/bulk` | Bulk insert companies |
| GET | `/companies/export` | Export to CSV/JSON |

### Job Endpoints
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/jobs` | List jobs |
| POST | `/jobs` | Create job |
| GET | `/jobs/:id` | Get job detail |
| PUT | `/jobs/:id` | Update job |
| DELETE | `/jobs/:id` | Delete job |

### Contact Endpoints
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/contacts` | List contacts |
| POST | `/contacts` | Create contact |
| GET | `/contacts/:id` | Get contact |
| PUT | `/contacts/:id` | Update contact |
| DELETE | `/contacts/:id` | Delete contact |

### Organization Endpoints
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/organizations` | List organizations |
| POST | `/organizations` | Create organization |
| GET | `/organizations/:id` | Get organization |
| PUT | `/organizations/:id` | Update organization |

### Additional Endpoints
| Endpoint | Purpose |
|----------|---------|
| `/api-keys` | API key management |
| `/saved-lists` | Saved list management |
| `/audit-logs` | Audit log viewing |
| `/analytics/summary` | Analytics dashboard |
| `/sessions` | Session management |
| `/team` | Team management |

---

## Database Schema

### User Model
```javascript
{
  _id: ObjectId,
  firstName: String,
  lastName: String,
  email: String (unique),
  passwordHash: String,
  role: Enum['super_admin','org_owner','admin','manager','sales_user','read_only'],
  organizationId: ObjectId (ref: Organization),
  isVerified: Boolean,
  isActive: Boolean,
  googleId: String,
  avatar: String,
  mfaEnabled: Boolean,
  mfaSecret: String,
  lastLoginAt: Date,
  createdAt: Date,
  updatedAt: Date
}

Indexes:
- email (unique)
- organizationId
```

### Company Model
```javascript
{
  _id: ObjectId,
  companyName: String (required),
  organizationId: ObjectId (ref: Organization),
  website: String (unique, sparse),
  email: String,
  phone: String,
  linkedinCompanyUrl: String (unique, sparse),
  industry: String,
  subIndustry: String,
  description: String,
  headcount: Number,
  foundedYear: Number,
  careersUrl: String,
  address: String,
  city: String,
  state: String,
  country: String,
  technologyStack: [String],
  socialLinks: {
    linkedin: String,
    twitter: String,
    facebook: String,
    instagram: String,
    youtube: String
  },
  hiringStatus: Enum['active','inactive','unknown'],
  hiringIntensity: Number,
  leadScore: Number (0-100),
  leadGrade: Enum['A','B','C','D','unscored'],
  discoverySource: String,
  sourceUrl: String,
  isEnriched: Boolean,
  lastTechnologyScannedAt: Date,
  isDeleted: Boolean,
  deletedAt: Date,
  deletedBy: ObjectId (ref: User),
  createdAt: Date,
  updatedAt: Date
}

Indexes:
- companyName
- organizationId
- industry
- country
- leadScore
- technologyStack
- hiringStatus
```

### Job Model
```javascript
{
  _id: ObjectId,
  title: String (required),
  organizationId: ObjectId (ref: Organization),
  companyId: ObjectId (ref: Company),
  companyName: String,
  description: String,
  location: String,
  city: String,
  country: String,
  workplaceType: Enum['remote','hybrid','onsite','unknown'],
  employmentType: Enum['full_time','part_time','contract','internship','unknown'],
  jobUrl: String,
  sourcePlatform: String,
  postedDate: Date,
  expiresDate: Date,
  technologyKeywords: [String],
  requiredSkills: [String],
  industry: String,
  department: String,
  experienceMin: Number,
  experienceMax: Number,
  salaryMin: Number,
  salaryMax: Number,
  currency: String,
  isActive: Boolean,
  isDeleted: Boolean,
  deletedAt: Date,
  createdAt: Date,
  updatedAt: Date
}

Indexes:
- organizationId
- companyId
- title
- industry
- country
- workplaceType
- postedDate
- requiredSkills
```

### Contact Model
```javascript
{
  _id: ObjectId,
  firstName: String,
  lastName: String,
  email: String,
  phone: String,
  title: String,
  seniority: Enum['c_level','vp','director','manager','senior','individual_contributor'],
  department: String,
  companyId: ObjectId (ref: Company),
  organizationId: ObjectId (ref: Organization),
  linkedinUrl: String,
  linkedinId: String,
  isDecisionMaker: Boolean,
  isVerified: Boolean,
  lastContactedAt: Date,
  notes: String,
  isDeleted: Boolean,
  deletedAt: Date,
  createdAt: Date,
  updatedAt: Date
}

Indexes:
- companyId
- organizationId
- email
- linkedinId
```

### Organization Model
```javascript
{
  _id: ObjectId,
  name: String,
  domain: String,
  slug: String (unique),
  plan: Enum['free','starter','growth','enterprise'],
  usageLimits: {
    leadsPerMonth: Number,
    exportsPerMonth: Number,
    apiCallsPerMonth: Number,
    maxUsers: Number
  },
  members: [
    {
      userId: ObjectId (ref: User),
      role: Enum['owner','admin','member'],
      joinedAt: Date
    }
  ],
  isActive: Boolean,
  createdAt: Date,
  updatedAt: Date
}

Indexes:
- slug (unique)
- domain
```

### Additional Models
- **ApiKey**: API key storage and validation
- **AuditLog**: User action audit trail
- **SavedList**: User-saved search results
- **Session**: Active session management
- **RefreshToken**: JWT refresh tokens
- **PasswordReset**: Password reset tokens
- **EmailVerification**: Email verification tokens
- **LeadScore**: Company lead scoring data
- **MfaSecret**: MFA configuration

---

## Queue Systems

### Queue 1: company-discovery
**Purpose**: Discover new companies from search engines

**Input**:
```javascript
{
  query: "AI companies in San Francisco",
  industry: "Artificial Intelligence",
  country: "USA",
  city: "San Francisco",
  keywords: "funded tech",
  maxResults: 25
}
```

**Process**:
1. Query multiple search engines (Google, Bing, DuckDuckGo)
2. Extract company websites
3. Normalize and deduplicate
4. Save to MongoDB
5. Trigger company-enrichment for each company

**Output**: Array of discovered companies saved to MongoDB

---

### Queue 2: company-enrichment
**Purpose**: Enrich company data from multiple sources

**Input**:
```javascript
{
  companyId: "60d5ec49b1b2a1c8e4c2d3e1",
  website: "https://example.com"
}
```

**Process**:
1. Crawl company website
2. Extract metadata and social links
3. Detect technology stack
4. Find careers page
5. Update company record in MongoDB
6. Trigger job-discovery and people-discovery

**Output**: Updated company record with enriched data

---

### Queue 3: job-discovery
**Purpose**: Scrape job listings from company careers pages

**Input**:
```javascript
{
  companyId: "60d5ec49b1b2a1c8e4c2d3e1",
  companyName: "Tech Corp",
  website: "https://example.com",
  careersUrl: "https://example.com/careers",
  organizationId: "60d5ec49b1b2a1c8e4c2d3e2"
}
```

**Process**:
1. Load careers page
2. Detect job platform (Greenhouse, Lever, Workday, etc.)
3. Extract job listings
4. Parse each job for details
5. Normalize data
6. Deduplicate and save to MongoDB
7. Update company hiring signals
8. Trigger lead-scoring

**Output**: Array of job listings saved to MongoDB

---

### Queue 4: people-discovery
**Purpose**: Discover company leadership and key contacts

**Input**:
```javascript
{
  companyId: "60d5ec49b1b2a1c8e4c2d3e1",
  companyName: "Tech Corp",
  website: "https://example.com"
}
```

**Process**:
1. Search for leadership team
2. Extract from company website
3. Parse from LinkedIn (if accessible)
4. Extract contact information
5. Infer seniority levels
6. Save contacts to MongoDB

**Output**: Array of contact records saved to MongoDB

---

### Queue 5: technology-enrichment
**Purpose**: Detect and update technology stack

**Input**:
```javascript
{
  companyId: "60d5ec49b1b2a1c8e4c2d3e1",
  website: "https://example.com"
}
```

**Process**:
1. Analyze website
2. Check HTTP headers and meta tags
3. Scan JavaScript files
4. Detect frameworks and libraries
5. Identify infrastructure tools
6. Update company technologyStack field
7. Trigger lead-scoring

**Output**: Updated company record with technology stack

---

### Queue 6: lead-scoring
**Purpose**: Calculate lead quality scores

**Input**:
```javascript
{
  companyId: "60d5ec49b1b2a1c8e4c2d3e1"
}
```

**Process**:
1. Load company data
2. Calculate score based on:
   - Company size (headcount)
   - Funding and growth signals
   - Hiring intensity (number of open jobs)
   - Technology match with buyer
   - Industry and country match
3. Assign grade (A/B/C/D)
4. Update company leadScore and leadGrade

**Scoring Factors**:
- Hiring signals: +30 points max
- Company size: +20 points max
- Industry match: +20 points max
- Technology match: +20 points max
- Growth signals: +10 points max

**Output**: Updated company record with score and grade

---

## Services & Scrapers

### Services
1. **AuthService** - Authentication and token management
2. **CompanyService** - Company CRUD and search
3. **JobService** - Job CRUD and filtering
4. **ContactService** - Contact management
5. **CompanyDiscoveryService** - Multi-source company discovery
6. **JobScrapingService** - Job scraping and normalization
7. **OrganizationService** - Organization management
8. **SavedListService** - Saved list management
9. **ApiKeyService** - API key generation
10. **AuditService** - Audit logging
11. **AnalyticsService** - Analytics and metrics
12. **ScoringService** - Lead scoring
13. **ExportService** - Data export
14. **MfaService** - Multi-factor authentication

### Scrapers
1. **companyDiscoveryScraper** - DuckDuckGo discovery
2. **discovery/googleSearch** - Google search integration
3. **discovery/bingSearch** - Bing search integration
4. **crawlers/websiteCrawler** - Website content extraction
5. **crawlers/careersPageParser** - Job platform detection and parsing
6. **jobs/genericJobParser** - Job listing details extraction
7. **people/leadershipParser** - Leadership profile extraction
8. **people/searchPeople** - People search integration
9. **technology/techDetector** - Technology stack detection

---

## Deployment

### Docker Deployment
```bash
# Build image
docker build -t b2b-backend:latest .

# Run with Docker Compose
docker-compose up -d

# Includes:
# - Backend API (port 3000)
# - MongoDB
# - Redis
```

### Environment Variables
```env
NODE_ENV=production
API_PREFIX=/api/v1
SERVER_PORT=3000
DATABASE_MODE=mongodb
MONGODB_URI=mongodb+srv://...
REDIS_HOST=redis
JWT_SECRET=strong-secret-key
```

### Production Checklist
- [ ] Environment variables configured
- [ ] Database backups enabled
- [ ] Redis persistence enabled
- [ ] SSL/TLS certificates installed
- [ ] Rate limiting configured
- [ ] Logging and monitoring set up
- [ ] Error tracking enabled
- [ ] Database indexes verified
- [ ] API documentation deployed
- [ ] Health checks configured

---

## Testing

### Unit Tests
```bash
npm test
```

### Integration Tests
```bash
npm run test:integration
```

### API Testing
Use Postman or curl commands (see QUICK_START.md)

### Load Testing
```bash
npm run test:load
```

---

## File Structure

```
src/
├── app.js                 # Express app setup
├── server.js              # Server entry point
├── config/
│   ├── env.js            # Environment variables
│   ├── database.js       # MongoDB connection
│   ├── redis.js          # Redis connection
│   └── runtime.js        # Runtime config
├── models/
│   ├── index.js          # Model exports
│   ├── User.js
│   ├── Company.js
│   ├── Job.js
│   ├── Contact.js
│   ├── Organization.js
│   ├── ApiKey.js
│   ├── AuditLog.js
│   ├── SavedList.js
│   ├── Session.js
│   ├── RefreshToken.js
│   ├── PasswordReset.js
│   ├── EmailVerification.js
│   ├── LeadScore.js
│   ├── MfaSecret.js
│   ├── TeamInvitation.js
│   ├── Activity.js
│   ├── SearchHistory.js
│   └── Contact.js
├── repositories/
│   ├── BaseRepository.js
│   ├── CompanyRepository.js
│   ├── JobRepository.js
│   ├── ContactRepository.js
│   ├── UserRepository.js
│   └── index.js
├── services/
│   ├── AuthService.js
│   ├── CompanyService.js
│   ├── JobService.js
│   ├── ContactService.js
│   ├── CompanyDiscoveryService.js
│   ├── JobScrapingService.js
│   ├── OrganizationService.js
│   ├── SavedListService.js
│   ├── ApiKeyService.js
│   ├── AuditService.js
│   ├── AnalyticsService.js
│   ├── ScoringService.js
│   ├── ExportService.js
│   ├── MfaService.js
│   ├── SessionService.js
│   └── index.js
├── controllers/
│   ├── AuthController.js
│   ├── CompanyController.js
│   ├── JobController.js
│   ├── ContactController.js
│   ├── UserController.js
│   ├── OrganizationController.js
│   ├── ApiKeyController.js
│   ├── AuditController.js
│   ├── AnalyticsController.js
│   ├── SavedListController.js
│   ├── SessionController.js
│   ├── TeamController.js
│   └── controllerUtils.js
├── routes/
│   ├── index.js
│   ├── auth.js
│   ├── companies.js
│   ├── jobs.js
│   ├── contacts.js
│   ├── user.js
│   ├── organizations.js
│   ├── apikeys.js
│   ├── savedLists.js
│   ├── audit.js
│   ├── sessions.js
│   ├── team.js
│   ├── analytics.js
│   └── company routes.js
├── middlewares/
│   ├── authenticate.js
│   ├── authorize.js
│   ├── apiKeyAuth.js
│   ├── validate.js
│   ├── errorHandler.js
│   ├── notFound.js
│   └── rateLimiter.js
├── queues/
│   ├── connection.js
│   ├── index.js
│   ├── names.js
│   ├── producers.js
│   └── workers/
├── workers/
│   ├── index.js
│   ├── discoveryWorker.js
│   ├── enrichmentWorker.js
│   ├── jobWorker.js
│   ├── peopleWorker.js
│   ├── techWorker.js
│   ├── scoringWorker.js
│   └── workerUtils.js
├── scrapers/
│   ├── baseScraper.js
│   ├── companyDiscoveryScraper.js
│   ├── companyEnrichmentScraper.js
│   ├── jobDiscoveryScraper.js
│   ├── technologyDetectionScraper.js
│   ├── peopleDiscoveryScraper.js
│   ├── parsers.js
│   ├── discovery/
│   │   ├── googleSearch.js
│   │   ├── bingSearch.js
│   │   └── clutchScraper.js
│   ├── crawlers/
│   │   ├── websiteCrawler.js
│   │   └── careersPageParser.js
│   ├── jobs/
│   │   └── genericJobParser.js
│   ├── people/
│   │   ├── leadershipParser.js
│   │   └── searchPeople.js
│   ├── technology/
│   │   └── techDetector.js
│   └── utils/
│       ├── pageLoader.js
│       └── extractors.js
├── cron/
│   ├── index.js
│   ├── dailyCompanyRefresh.js
│   ├── dailyHiringRefresh.js
│   ├── weeklyContactRefresh.js
│   └── weeklyTechRefresh.js
├── validators/
│   ├── authValidators.js
│   ├── companyValidators.js
│   └── contactValidators.js
└── utils/
    ├── tokenUtils.js
    ├── emailUtils.js
    ├── response.js
    ├── pagination.js
    ├── queryBuilder.js
    ├── httpClient.js
    ├── asyncHandler.js
    └── logger.js
```

---

## Summary

This B2B Lead Intelligence Backend provides:

✅ **Complete REST API** with 40+ endpoints
✅ **BullMQ Queue System** with 6 specialized queues
✅ **Multi-Source Scrapers** for company and job discovery
✅ **Intelligent Lead Scoring** based on multiple signals
✅ **MongoDB Database** with optimized indexes
✅ **Redis Caching & Queue** backend
✅ **Authentication & Authorization** with RBAC
✅ **Audit Logging** for compliance
✅ **Data Export** capabilities
✅ **Error Handling & Logging**
✅ **Rate Limiting & Security**
✅ **Docker Deployment** ready

The system is production-ready and scalable.
