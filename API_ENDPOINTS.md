# REST API Endpoints - B2B Lead Intelligence Platform

## Base URL
`/api/v1`

## Authentication Endpoints

### POST /auth/register
Register a new user and create an organization
**Request:**
```json
{
  "firstName": "John",
  "lastName": "Doe",
  "email": "john@example.com",
  "password": "securePassword123",
  "companyName": "Acme Corp"
}
```

### POST /auth/login
Login user
**Request:**
```json
{
  "email": "john@example.com",
  "password": "securePassword123"
}
```

### POST /auth/verify-email
Verify email with token
**Request:**
```json
{
  "token": "verification-token"
}
```

### POST /auth/refresh
Refresh access token
**Request:**
```json
{
  "refreshToken": "refresh-token"
}
```

### POST /auth/logout
Logout user
**Request:**
```json
{
  "refreshToken": "refresh-token",
  "sessionId": "session-id"
}
```

### POST /auth/google
Google OAuth login
**Request:**
```json
{
  "googleId": "google-id",
  "email": "user@gmail.com",
  "firstName": "John",
  "lastName": "Doe",
  "avatar": "https://example.com/avatar.jpg"
}
```

### POST /auth/forgot-password
Request password reset
**Request:**
```json
{
  "email": "john@example.com"
}
```

### POST /auth/reset-password
Reset password with token
**Request:**
```json
{
  "token": "reset-token",
  "newPassword": "newPassword123"
}
```

---

## User Endpoints

### GET /user
Get current user profile
**Headers:** Authorization: Bearer {token}

### PUT /user
Update current user profile
**Headers:** Authorization: Bearer {token}
**Request:**
```json
{
  "firstName": "Jane",
  "lastName": "Doe",
  "avatar": "https://example.com/avatar.jpg"
}
```

### GET /user/organizations
Get user's organizations
**Headers:** Authorization: Bearer {token}

---

## Company Endpoints

### GET /companies
List all companies with filters
**Headers:** Authorization: Bearer {token}
**Query Parameters:**
- `page`: Page number (default: 1)
- `limit`: Results per page (default: 25, max: 100)
- `industry`: Filter by industry
- `country`: Filter by country
- `city`: Filter by city
- `hiringStatus`: Filter by hiring status (active, inactive, unknown)
- `keywords`: Search by company name

### POST /companies
Create a new company
**Headers:** Authorization: Bearer {token}
**Request:**
```json
{
  "companyName": "Tech Startup Inc",
  "website": "https://techstartup.com",
  "industry": "Technology",
  "country": "USA",
  "city": "San Francisco",
  "headcount": 50,
  "description": "AI-powered SaaS platform"
}
```

### GET /companies/:id
Get company details with contacts and jobs
**Headers:** Authorization: Bearer {token}

### PUT /companies/:id
Update company
**Headers:** Authorization: Bearer {token}
**Request:**
```json
{
  "industry": "SaaS",
  "hiringStatus": "active",
  "technologyStack": ["React", "Node.js", "MongoDB"]
}
```

### DELETE /companies/:id
Delete (soft delete) company
**Headers:** Authorization: Bearer {token}

### POST /companies/search
Discover and save companies
**Headers:** Authorization: Bearer {token}
**Request:**
```json
{
  "query": "AI companies in San Francisco",
  "industry": "Artificial Intelligence",
  "country": "USA",
  "city": "San Francisco",
  "maxResults": 25,
  "async": false
}
```

### POST /companies/bulk
Bulk insert companies
**Headers:** Authorization: Bearer {token}
**Request:**
```json
[
  {
    "companyName": "Company 1",
    "website": "https://company1.com"
  },
  {
    "companyName": "Company 2",
    "website": "https://company2.com"
  }
]
```

### GET /companies/export
Export companies to CSV or JSON
**Headers:** Authorization: Bearer {token}
**Query Parameters:**
- `format`: csv or json (default: csv)
- `industry`: Filter by industry
- `country`: Filter by country

---

## Job Endpoints

### GET /jobs
List all jobs with filters
**Headers:** Authorization: Bearer {token}
**Query Parameters:**
- `page`: Page number (default: 1)
- `limit`: Results per page (default: 25, max: 100)
- `companyId`: Filter by company
- `title`: Filter by job title
- `industry`: Filter by industry
- `country`: Filter by country
- `workplaceType`: Filter by workplace type (remote, hybrid, onsite)
- `requiredSkills`: Filter by skills (comma-separated)

### POST /jobs
Create a new job
**Headers:** Authorization: Bearer {token}
**Request:**
```json
{
  "title": "Senior Software Engineer",
  "companyId": "company-id",
  "companyName": "Tech Corp",
  "description": "We are looking for...",
  "location": "San Francisco, CA",
  "workplaceType": "hybrid",
  "employmentType": "full_time",
  "requiredSkills": ["JavaScript", "React", "Node.js"],
  "industry": "Technology"
}
```

### GET /jobs/:id
Get job details
**Headers:** Authorization: Bearer {token}

### PUT /jobs/:id
Update job
**Headers:** Authorization: Bearer {token}

### DELETE /jobs/:id
Delete (soft delete) job
**Headers:** Authorization: Bearer {token}

---

## Contact Endpoints

### GET /contacts
List all contacts
**Headers:** Authorization: Bearer {token}
**Query Parameters:**
- `page`: Page number
- `limit`: Results per page
- `companyId`: Filter by company
- `firstName`: Filter by first name
- `lastName`: Filter by last name
- `title`: Filter by job title

### POST /contacts
Create a new contact
**Headers:** Authorization: Bearer {token}
**Request:**
```json
{
  "firstName": "John",
  "lastName": "Smith",
  "email": "john@example.com",
  "phone": "+1-555-0123",
  "title": "Engineering Manager",
  "companyId": "company-id",
  "linkedinUrl": "https://linkedin.com/in/johnsmith"
}
```

### GET /contacts/:id
Get contact details
**Headers:** Authorization: Bearer {token}

### PUT /contacts/:id
Update contact
**Headers:** Authorization: Bearer {token}

### DELETE /contacts/:id
Delete (soft delete) contact
**Headers:** Authorization: Bearer {token}

---

## Organization Endpoints

### GET /organizations
Get user's organizations
**Headers:** Authorization: Bearer {token}

### POST /organizations
Create a new organization
**Headers:** Authorization: Bearer {token}
**Request:**
```json
{
  "name": "Acme Corporation",
  "domain": "acme.com",
  "plan": "growth"
}
```

### GET /organizations/:id
Get organization details
**Headers:** Authorization: Bearer {token}

### PUT /organizations/:id
Update organization
**Headers:** Authorization: Bearer {token}

### POST /organizations/:id/invite
Invite user to organization
**Headers:** Authorization: Bearer {token}
**Request:**
```json
{
  "email": "newuser@example.com",
  "role": "admin"
}
```

---

## API Keys Endpoints

### GET /api-keys
List API keys
**Headers:** Authorization: Bearer {token}

### POST /api-keys
Create new API key
**Headers:** Authorization: Bearer {token}
**Request:**
```json
{
  "name": "Production API Key",
  "permissions": ["read:companies", "read:jobs"]
}
```

### DELETE /api-keys/:id
Delete API key
**Headers:** Authorization: Bearer {token}

---

## Saved Lists Endpoints

### GET /saved-lists
List saved lists
**Headers:** Authorization: Bearer {token}

### POST /saved-lists
Create saved list
**Headers:** Authorization: Bearer {token}
**Request:**
```json
{
  "name": "Top AI Companies",
  "description": "AI companies in US with >$10M funding",
  "type": "companies",
  "filters": {
    "industry": "AI",
    "country": "USA"
  }
}
```

### GET /saved-lists/:id
Get saved list with items
**Headers:** Authorization: Bearer {token}

### PUT /saved-lists/:id
Update saved list
**Headers:** Authorization: Bearer {token}

### DELETE /saved-lists/:id
Delete saved list
**Headers:** Authorization: Bearer {token}

### POST /saved-lists/:id/items
Add items to saved list
**Headers:** Authorization: Bearer {token}
**Request:**
```json
{
  "itemIds": ["company-id-1", "company-id-2"]
}
```

---

## Audit Log Endpoints

### GET /audit-logs
List audit logs
**Headers:** Authorization: Bearer {token}
**Query Parameters:**
- `page`: Page number
- `limit`: Results per page
- `action`: Filter by action
- `resource`: Filter by resource type
- `userId`: Filter by user

---

## Analytics Endpoints

### GET /analytics/summary
Get analytics summary
**Headers:** Authorization: Bearer {token}

### GET /analytics/companies
Get company statistics
**Headers:** Authorization: Bearer {token}

### GET /analytics/jobs
Get job statistics
**Headers:** Authorization: Bearer {token}

### POST /analytics/export
Export analytics report
**Headers:** Authorization: Bearer {token}
**Request:**
```json
{
  "format": "pdf",
  "startDate": "2024-01-01",
  "endDate": "2024-06-30"
}
```

---

## Health Endpoint

### GET /health
Health check endpoint (no authentication required)
**Response:**
```json
{
  "status": "ok",
  "database": "connected",
  "uptime": 3600,
  "timestamp": "2024-06-15T10:00:00Z"
}
```

---

## Response Format

All endpoints return responses in the following format:

**Success Response (2xx):**
```json
{
  "success": true,
  "message": "Operation successful",
  "data": {},
  "pagination": {
    "page": 1,
    "limit": 25,
    "totalRecords": 100,
    "totalPages": 4,
    "hasNextPage": true,
    "hasPreviousPage": false
  }
}
```

**Error Response (4xx, 5xx):**
```json
{
  "success": false,
  "message": "Error message",
  "errors": [
    {
      "field": "email",
      "message": "Email is required"
    }
  ]
}
```

---

## BullMQ Queue Operations

### Queue: company-discovery
Triggered by `POST /companies/search` with `async: true`
- Discovers companies from search engines
- Saves results to MongoDB
- Triggers company enrichment for each discovered company

### Queue: company-enrichment
Enriches company data from multiple sources
- Website crawling
- Technology detection
- Social media profile detection

### Queue: job-discovery
Discovers and scrapes job listings
- Triggered after company discovery
- Parses career pages
- Saves job listings to MongoDB
- Triggers lead scoring

### Queue: people-discovery
Discovers company leadership and key contacts
- LinkedIn scraping
- Leadership extraction
- Contact data enrichment

### Queue: technology-enrichment
Detects technology stack
- Website analysis
- Technology detection
- Updates company records

### Queue: lead-scoring
Calculates lead scores for companies
- Uses discovery data
- Hiring intensity signals
- Technology match
- Updates company lead score and grade

---

## Cron Jobs

### Daily Company Refresh
Refreshes company data daily at 2 AM UTC
- Updates hiring signals
- Checks for company updates

### Weekly Contact Refresh
Updates contact information weekly
- LinkedIn profile verification
- Email validation

### Weekly Technology Refresh
Scans companies for technology updates
- Tech stack changes
- Tool adoption

---

## Error Codes

| Code | Message | Cause |
|------|---------|-------|
| 400 | Bad Request | Invalid request body or parameters |
| 401 | Unauthorized | Missing or invalid authentication token |
| 403 | Forbidden | Insufficient permissions |
| 404 | Not Found | Resource not found |
| 409 | Conflict | Resource already exists |
| 422 | Unprocessable Entity | Validation errors |
| 429 | Too Many Requests | Rate limit exceeded |
| 500 | Internal Server Error | Server error |
| 503 | Service Unavailable | Service temporarily unavailable |
