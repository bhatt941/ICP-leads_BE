# B2B Lead Intelligence Backend - Quick Start Guide

## Prerequisites
- Node.js >= 20
- MongoDB >= 5.0 (or MongoDB Atlas cloud instance)
- Redis >= 6.0 (for BullMQ queues)
- Puppeteer/Playwright dependencies

## Installation

### 1. Clone and Setup
```bash
cd project BE
npm install
```

### 2. Environment Configuration
Create `.env` file in the root directory:

```env
# Server
NODE_ENV=development
API_PREFIX=/api/v1
SERVER_PORT=3000
FRONTEND_URL=http://localhost:5173

# Database
DATABASE_MODE=mongodb
MONGODB_URI=mongodb://localhost:27017/b2b-lead-intelligence
# OR for MongoDB Atlas:
# MONGODB_URI=mongodb+srv://username:password@cluster.mongodb.net/b2b-lead-intelligence

# Redis (for BullMQ and caching)
REDIS_HOST=localhost
REDIS_PORT=6379
REDIS_PASSWORD=

# JWT
JWT_SECRET=your-super-secret-jwt-key-change-in-production
JWT_EXPIRY=15m
REFRESH_TOKEN_SECRET=your-super-secret-refresh-key
REFRESH_TOKEN_EXPIRY=7d

# Email (for production)
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=your-email@gmail.com
SMTP_PASSWORD=your-app-password
EMAIL_FROM=noreply@b2bleads.com

# Scraper Configuration
SCRAPER_HEADLESS=true
SCRAPER_TIMEOUT=30000
SCRAPER_USER_AGENT=Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36

# Bcrypt
BCRYPT_SALT_ROUNDS=10

# API Rate Limiting
RATE_LIMIT_WINDOW_MS=900000
RATE_LIMIT_MAX_REQUESTS=100
```

### 3. Database Setup (MongoDB)

**Option A: Local MongoDB**
```bash
# macOS with Homebrew
brew install mongodb-community
brew services start mongodb-community

# Windows
# Download from https://docs.mongodb.com/manual/tutorial/install-mongodb-on-windows/
```

**Option B: MongoDB Atlas (Cloud)**
1. Go to https://www.mongodb.com/cloud/atlas
2. Create a free account
3. Create a cluster
4. Get connection string
5. Update `MONGODB_URI` in `.env`

### 4. Redis Setup

**Option A: Local Redis**
```bash
# macOS with Homebrew
brew install redis
brew services start redis

# Windows
# Use Windows Subsystem for Linux (WSL) or Docker
```

**Option B: Docker Compose (Easiest)
```bash
docker-compose up
# Includes MongoDB, Redis, and the backend
```

### 5. Start Development Server

```bash
# Terminal 1: API Server
npm run dev
# Runs on http://localhost:3000

# Terminal 2: Worker Process (in another terminal)
npm run worker
# Processes async jobs from BullMQ queues

# Terminal 3: Cron Jobs (in another terminal)
npm run cron
# Runs scheduled tasks
```

## API Usage Examples

### 1. Register New User
```bash
curl -X POST http://localhost:3000/api/v1/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "firstName": "John",
    "lastName": "Doe",
    "email": "john@example.com",
    "password": "SecurePassword123!",
    "companyName": "Acme Corporation"
  }'
```

Response:
```json
{
  "success": true,
  "message": "Registration successful. Please verify your email.",
  "data": {
    "user": {
      "_id": "...",
      "firstName": "John",
      "lastName": "Doe",
      "email": "john@example.com",
      "role": "org_owner",
      "organizationId": "..."
    },
    "organization": {
      "_id": "...",
      "name": "Acme Corporation",
      "slug": "acme-corporation"
    }
  }
}
```

### 2. Login
```bash
curl -X POST http://localhost:3000/api/v1/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "john@example.com",
    "password": "SecurePassword123!"
  }'
```

Response:
```json
{
  "success": true,
  "message": "Login successful",
  "data": {
    "accessToken": "eyJhbGciOiJIUzI1NiIs...",
    "refreshToken": "...",
    "user": {
      "_id": "...",
      "email": "john@example.com",
      "firstName": "John"
    }
  }
}
```

### 3. Discover Companies (Async)
```bash
curl -X POST http://localhost:3000/api/v1/companies/search \
  -H "Authorization: Bearer YOUR_ACCESS_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "query": "SaaS companies in California",
    "async": true
  }'
```

This queues a job that will be processed by the worker process.

### 4. Discover Companies (Sync)
```bash
curl -X POST http://localhost:3000/api/v1/companies/search \
  -H "Authorization: Bearer YOUR_ACCESS_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "industry": "Artificial Intelligence",
    "country": "USA",
    "city": "San Francisco",
    "maxResults": 10,
    "async": false
  }'
```

### 5. List Companies
```bash
curl "http://localhost:3000/api/v1/companies?page=1&limit=25&industry=Technology&country=USA" \
  -H "Authorization: Bearer YOUR_ACCESS_TOKEN"
```

### 6. Get Company Details (with jobs and contacts)
```bash
curl "http://localhost:3000/api/v1/companies/COMPANY_ID" \
  -H "Authorization: Bearer YOUR_ACCESS_TOKEN"
```

### 7. Export Companies to CSV
```bash
curl "http://localhost:3000/api/v1/companies/export?format=csv" \
  -H "Authorization: Bearer YOUR_ACCESS_TOKEN" \
  -o companies.csv
```

### 8. Verify Email
```bash
# Token sent to email
curl -X POST http://localhost:3000/api/v1/auth/verify-email \
  -H "Content-Type: application/json" \
  -d '{"token": "VERIFICATION_TOKEN_FROM_EMAIL"}'
```

## Queue Management

### Monitor Queue Status
```bash
# Use Redis CLI
redis-cli

# View queue keys
KEYS bullmq:*

# View company-discovery queue
LRANGE bullmq:company-discovery:jobs 0 -1
```

### Test Queue Processing
The worker process automatically handles jobs when running:

```bash
npm run worker
```

Watch the console for job processing logs.

## Development Workflow

### 1. Make API Request
```bash
curl -X POST http://localhost:3000/api/v1/companies/search \
  -H "Authorization: Bearer TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"query": "AI companies", "async": true}'
```

### 2. Worker Processes Job
- Check Terminal 2 (worker) for processing logs
- Job saved to MongoDB
- Triggered child jobs (enrichment, scoring, etc.)

### 3. Query Results
```bash
curl http://localhost:3000/api/v1/companies \
  -H "Authorization: Bearer TOKEN"
```

## Testing the Full Flow

### 1. Health Check
```bash
curl http://localhost:3000/health
```

### 2. Register and Login
```bash
# Register
TOKEN=$(curl -s -X POST http://localhost:3000/api/v1/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "firstName": "Test",
    "lastName": "User",
    "email": "test@example.com",
    "password": "Test123!",
    "companyName": "Test Corp"
  }' | jq -r '.data.accessToken')

# Use token for subsequent requests
```

### 3. Create Company Manually
```bash
curl -X POST http://localhost:3000/api/v1/companies \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "companyName": "Tech Startup Inc",
    "website": "https://techstartup.example.com",
    "industry": "SaaS",
    "country": "USA",
    "city": "San Francisco"
  }'
```

### 4. Scrape Jobs for Company
```bash
curl -X POST http://localhost:3000/api/v1/companies/search \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "companyId": "COMPANY_ID",
    "async": true
  }'
```

### 5. View Results
```bash
# Check companies
curl http://localhost:3000/api/v1/companies \
  -H "Authorization: Bearer $TOKEN"

# Check jobs
curl http://localhost:3000/api/v1/jobs \
  -H "Authorization: Bearer $TOKEN"
```

## Troubleshooting

### 1. MongoDB Connection Failed
```bash
# Check if MongoDB is running
brew services list
# or
mongo --version

# Restart MongoDB
brew services restart mongodb-community
```

### 2. Redis Connection Failed
```bash
# Check if Redis is running
redis-cli ping
# Should return: PONG

# Restart Redis
brew services restart redis
```

### 3. Port Already in Use
```bash
# Change port in .env
SERVER_PORT=3001

# Or kill process on port 3000
lsof -ti:3000 | xargs kill -9
```

### 4. Worker Not Processing Jobs
```bash
# Check if worker process is running
npm run worker

# Check Redis keys
redis-cli KEYS "bullmq:*"

# Check logs for errors
tail -f logs/app.log
```

### 5. Email Not Sending
- Verify SMTP settings in .env
- For Gmail, use App Password (not regular password)
- Check email logs in console

## Production Deployment

### Using Docker
```bash
# Build image
docker build -t b2b-backend:latest .

# Run container
docker run -d \
  --name b2b-backend \
  -p 3000:3000 \
  --env-file .env.production \
  b2b-backend:latest
```

### Using Docker Compose
```bash
# Copy .env to .env.production with production values
cp .env .env.production

# Update production settings in .env.production

# Start services
docker-compose -f docker-compose.yml -f docker-compose.prod.yml up -d
```

### Environment Variables Checklist
- [ ] NODE_ENV=production
- [ ] JWT_SECRET (strong random key)
- [ ] REFRESH_TOKEN_SECRET (strong random key)
- [ ] MONGODB_URI (Atlas or production MongoDB)
- [ ] REDIS_HOST (production Redis)
- [ ] SMTP settings configured
- [ ] FRONTEND_URL set to production domain
- [ ] Rate limiting configured appropriately

## Performance Optimization

### 1. Database Indexes
All models have optimized indexes. They're created automatically on startup.

### 2. Caching
- Company data cached in Redis (5 minutes TTL)
- Clear cache when data updates

### 3. Pagination
All list endpoints support pagination:
```bash
?page=1&limit=25&sort=createdAt&order=desc
```

### 4. Query Filtering
Most list endpoints support filtering:
```bash
?industry=Technology&country=USA&city=San Francisco
```

## API Documentation

For complete API documentation, see `API_ENDPOINTS.md`

For implementation details, see `IMPLEMENTATION_STATUS.md`

## Support

For issues or questions:
1. Check logs in console
2. Review error responses from API
3. Check MongoDB/Redis connections
4. Verify environment variables
5. Review API_ENDPOINTS.md for request/response formats

## Next Steps

1. Integrate with frontend application
2. Set up monitoring and alerting
3. Configure backup strategy
4. Set up CI/CD pipeline
5. Perform load testing
6. Security audit
