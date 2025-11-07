# World Cup Prediction System - Backend

A comprehensive backend API for World Cup group stage predictions with OTP-based authentication, scoring algorithms, and leaderboard management.

## Table of Contents

1. [Project Overview](#project-overview)
2. [Architecture & Tech Stack](#architecture--tech-stack)
3. [Prerequisites](#prerequisites)
4. [Installation & Setup](#installation--setup)
5. [Configuration](#configuration)
6. [Database Setup](#database-setup)
7. [Running the Application](#running-the-application)
8. [API Documentation](#api-documentation)
9. [Scripts & Utilities](#scripts--utilities)
10. [Testing](#testing)
11. [Deployment](#deployment)
12. [Troubleshooting](#troubleshooting)

---

## Project Overview

This is a backend API system for managing World Cup group stage predictions. Users can submit predictions for 12 groups (A-L) with 4 teams each (48 teams total). The system features:

- **OTP-based Authentication**: SMS-based authentication via SMS.ir
- **Session Management**: Multi-device session support with logout capabilities
- **Prediction System**: Submit, update, and finalize predictions
- **Scoring Algorithm**: 6-state scoring system with detailed rules
- **Leaderboard**: Real-time ranking of predictions
- **Team Management**: Cached team data with search capabilities
- **Admin Operations**: Trigger prediction processing and view status
- **Rate Limiting**: Per-phone-number rate limiting for security
- **Redis Caching**: Performance optimization for frequently accessed data

### Features

- ✅ Redis-based OTP storage with 120s TTL
- ✅ Rate limiting: 1 OTP per 2 minutes per phone
- ✅ Verification limit: Max 5 attempts per minute
- ✅ Secure OTP generation (cryptographically secure)
- ✅ Constant-time comparison for security
- ✅ Multi-device session management
- ✅ Comprehensive error handling
- ✅ Unit and E2E tests
- ✅ Swagger API documentation

---

## Architecture & Tech Stack

### Technology Stack

- **Framework**: NestJS 11.x (TypeScript)
- **Database**: PostgreSQL 16 (TypeORM)
- **Cache**: Redis (OTP storage, rate limiting, team caching)
- **Message Queue**: RabbitMQ (prediction processing)
- **API Documentation**: Swagger/OpenAPI
- **Security**: Helmet, JWT tokens, bcrypt
- **Testing**: Jest
- **SMS Integration**: SMS.ir API

### Project Structure

```
src/
├── common/              # Shared utilities
│   ├── decorators/      # Custom decorators (@Public, @CurrentUser, etc.)
│   ├── filters/         # Exception filters
│   ├── guards/          # Auth & rate limit guards
│   └── middleware/      # Request logging
├── config/              # Configuration modules
├── database/
│   ├── entities/        # TypeORM entities
│   ├── migrations/      # Database migrations
│   └── seeds/           # Database seeders
├── modules/
│   ├── auth/            # Authentication module
│   ├── team/            # Team management
│   ├── prediction/      # Prediction submission
│   ├── scoring/         # Scoring algorithm
│   ├── admin/           # Admin operations
│   ├── health/          # Health checks
│   ├── redis/           # Redis service
│   └── queue/           # RabbitMQ queue (optional)
└── commands/            # CLI commands (seeding)
```

---

## Prerequisites

- **Node.js** 18+ 
- **Docker** & **Docker Compose**
- **npm** or **yarn**
- **Git**
- **PostgreSQL** (via Docker or local installation)
- **Redis** (via Docker or local installation)
- **RabbitMQ** (via Docker or local installation) - Optional

---

## Installation & Setup

### Step 1: Clone Repository

```bash
git clone <repository-url>
cd worldcup-prediction
```

### Step 2: Install Dependencies

```bash
npm install
```

### Step 3: Start Infrastructure Services

```bash
# Start PostgreSQL, Redis, and RabbitMQ
npm run docker:up
# OR
docker-compose up -d
```

Services will be available at:
- **PostgreSQL**: `localhost:5432`
- **Redis**: `localhost:6379`
- **RabbitMQ Management**: `http://localhost:15672` (admin/admin)

### Step 4: Environment Configuration

Create a `.env` file in the root directory:

```env
# Application
PORT=3000
NODE_ENV=development
API_PREFIX=api
ALLOWED_ORIGINS=http://localhost:3000,http://localhost:3001

# Database
DB_HOST=localhost
DB_PORT=5432
DB_USER=postgres
DB_PASSWORD=postgres
DB_NAME=worldcup

# Redis
REDIS_HOST=localhost
REDIS_PORT=6379
REDIS_PASSWORD=

# RabbitMQ
RABBITMQ_URL=amqp://admin:admin@localhost:5672

# SMS Integration (SMS.ir)
SMS_API_KEY=your_sms_api_key
SMS_API_URL=https://api.sms.ir/v1/send/verify
SMS_TEMPLATE_ID=123456
SMS_SANDBOX=true

# JWT Token
JWT_SECRET=your-secret-key-change-in-production
JWT_EXPIRES_IN=30d
```

### Step 5: Run Database Migrations

Migrations run automatically on startup. To run manually:

```bash
npm run migration:run
```

### Step 6: Seed Database

```bash
# Seed teams (48 World Cup teams)
npm run seed
```

### Step 7: Start Application

```bash
# Development mode (with hot reload)
npm run start:dev

# Production mode
npm run build
npm run start:prod
```

The application will be available at:
- **API**: `http://localhost:3000`
- **Swagger Docs**: `http://localhost:3000/api/docs`
- **Health Check**: `http://localhost:3000/health`

---

## Configuration

### Application Configuration (`src/config/app.config.ts`)

- **Port**: Default 3000
- **Environment**: development/production
- **API Prefix**: `/api`
- **SMS Settings**: API key, template ID, sandbox mode

### Database Configuration (`src/config/database.config.ts`)

- **Type**: PostgreSQL
- **Connection pooling**: Automatic
- **Auto-synchronize**: Enabled in development
- **Migration settings**: Auto-run on startup

### Redis Configuration (`src/config/redis.config.ts`)

- **Host and Port**: Default localhost:6379
- **Password**: Optional
- **Default TTL**: 120 seconds

### RabbitMQ Configuration (`src/config/rabbitmq.config.ts`)

- **Connection URL**: Default amqp://localhost:5672
- **Queue Names**: `prediction.process`, `prediction.process.dlq`

---

## Database Setup

### Entities

1. **User**: Phone-based authentication
2. **Session**: Multi-device session management
3. **Team**: 48 World Cup teams
4. **Prediction**: User predictions (12 groups × 4 teams)
5. **PredictionResult**: Scoring results

### Migrations

```bash
# Generate migration
npm run migration:generate -- -n MigrationName

# Run migrations
npm run migration:run

# Revert last migration
npm run migration:revert
```

### Seeding

```bash
# Seed teams
npm run seed
```

---

## Running the Application

### Development

```bash
npm run start:dev
```

### Production Build

```bash
npm run build
npm run start:prod
```

### Debug Mode

```bash
npm run start:debug
```

### Docker Commands

```bash
# Start services
npm run docker:up

# Stop services
npm run docker:down

# View logs
npm run docker:logs
```

---

## API Documentation

### Base URL

```
http://localhost:3000/api
```

### Authentication Endpoints

#### 1. Send OTP
```http
POST /auth/send-otp
Content-Type: application/json

{
  "phone": "09123456789"
}
```
- **Rate limit**: 1 request per 2 minutes per phone
- **Returns**: OTP code (in dev mode)

#### 2. Verify OTP
```http
POST /auth/verify-otp
Content-Type: application/json

{
  "phone": "09123456789",
  "code": "123456",
  "deviceInfo": {
    "platform": "iOS",
    "browser": "Safari"
  }
}
```
- **Rate limit**: 5 attempts per minute
- **Returns**: JWT token and user info

#### 3. Get Sessions
```http
GET /auth/sessions
Authorization: Bearer <token>
```

#### 4. Logout
```http
POST /auth/logout
Authorization: Bearer <token>
```

#### 5. Logout All
```http
POST /auth/logout-all
Authorization: Bearer <token>
```

### Team Endpoints (Public)

#### 1. Get All Teams
```http
GET /teams
```
- Returns all 48 teams (cached 24h)

#### 2. Get Teams by Groups
```http
GET /teams/groups
```

#### 3. Get Teams in Group
```http
GET /teams/group/:group
```

#### 4. Search Teams
```http
GET /teams/search?q=Iran
```

### Prediction Endpoints (Authenticated)

#### 1. Submit Prediction
```http
POST /predictions
Authorization: Bearer <token>
Content-Type: application/json

{
  "groups": {
    "A": [["team-uuid-1"], ["team-uuid-2"], ["team-uuid-3"], ["team-uuid-4"]],
    "B": [["team-uuid-5"], ["team-uuid-6"], ["team-uuid-7"], ["team-uuid-8"]],
    ...
    "L": [["team-uuid-45"], ["team-uuid-46"], ["team-uuid-47"], ["team-uuid-48"]]
  }
}
```

#### 2. Finalize Prediction
```http
POST /predictions/finalize
Authorization: Bearer <token>
```

#### 3. Get Leaderboard
```http
GET /predictions/leaderboard?limit=100
```

### Admin Endpoints

#### 1. Trigger Prediction Processing
```http
POST /admin/trigger-prediction-process
Authorization: Bearer <token>
Content-Type: application/json

{
  "reprocess": false,
  "limit": 100
}
```

---

## Scripts & Utilities

### NPM Scripts (`package.json`)

#### Development
- `npm run start:dev` - Start in development mode with watch
- `npm run start:debug` - Start in debug mode
- `npm run build` - Build for production
- `npm run start:prod` - Start production server

#### Testing
- `npm run test` - Run unit tests
- `npm run test:watch` - Run tests in watch mode
- `npm run test:cov` - Run tests with coverage
- `npm run test:e2e` - Run end-to-end tests

#### Database
- `npm run migration:generate` - Generate new migration
- `npm run migration:run` - Run pending migrations
- `npm run migration:revert` - Revert last migration
- `npm run seed` - Seed database with teams

#### Docker
- `npm run docker:up` - Start Docker services
- `npm run docker:down` - Stop Docker services
- `npm run docker:logs` - View Docker logs

#### Code Quality
- `npm run lint` - Run ESLint
- `npm run format` - Format code with Prettier

---

### Utility Scripts

#### JavaScript Scripts (`scripts/`)

##### 1. `extract-user-ids.js`

**Purpose**: Extracts unique user IDs from a `prediction.sql` file.

**Why use it**: When you have a SQL file with prediction data that includes user IDs, this script extracts all unique user IDs to prepare for user creation.

**Usage**:
```bash
node scripts/extract-user-ids.js
```

**What it does**:
- Reads `prediction.sql` from project root
- Extracts all unique user IDs using regex
- Saves them to `user_ids.txt` (one ID per line)
- Displays count and sample IDs

**Output**: `user_ids.txt`

**Example**:
```bash
$ node scripts/extract-user-ids.js
📊 Extracting user IDs from prediction.sql...

✅ Found 50000 unique users

💾 Saved user IDs to: user_ids.txt

First 5 user IDs:
   1. abc123-def456-ghi789-jkl012-mno345
   2. pqr678-stu901-vwx234-yza567-bcd890
   ...
```

---

##### 2. `generate-users-sql.js`

**Purpose**: Generates SQL INSERT statements for users from extracted user IDs.

**Why use it**: After extracting user IDs, you need to create user records in the database. This script generates optimized batch INSERT statements.

**Usage**:
```bash
node scripts/generate-users-sql.js
```

**Prerequisites**: Requires `user_ids.txt` (created by `extract-user-ids.js`)

**What it does**:
- Reads `user_ids.txt`
- Generates sequential phone numbers (09120000001, 09120000002, ...)
- Creates batch INSERT statements (1000 users per batch)
- Includes `ON CONFLICT DO NOTHING` for safety
- Saves to `users.sql`

**Output**: `users.sql`

**Example**:
```bash
$ node scripts/generate-users-sql.js
👥 Generating users SQL from user IDs...

📋 Processing 50000 user IDs...

✅ Generated users.sql successfully!

📊 Summary:
   Total users: 50000
   Batch size: 1000 users per INSERT
   Total batches: 50
   Phone numbers: 09120000001 - 09125000000
```

---

##### 3. `generate-test-prediction.js`

**Purpose**: Generates a random valid prediction JSON for testing.

**Why use it**: When testing the prediction API, you need valid prediction data. This script creates a properly formatted prediction with all 48 teams distributed across 12 groups.

**Usage**:
```bash
node scripts/generate-test-prediction.js
```

**What it does**:
- Shuffles all 48 team UUIDs
- Distributes them into 12 groups (A-L) with 4 teams each
- Outputs JSON to console and saves to `test-prediction.json`

**Output**: `test-prediction.json`

**Example**:
```bash
$ node scripts/generate-test-prediction.js
{
  "groups": {
    "A": [["uuid1"], ["uuid2"], ["uuid3"], ["uuid4"]],
    "B": [["uuid5"], ["uuid6"], ["uuid7"], ["uuid8"]],
    ...
  }
}

✅ Test prediction saved to test-prediction.json
📊 12 groups with 4 teams each = 48 total teams
```

---

##### 4. `test-scoring.js`

**Purpose**: Tests all 6 scoring algorithm states to verify correctness.

**Why use it**: Validates that the scoring algorithm works correctly for all scenarios:
- State 1: Perfect prediction (100 points)
- State 2: 2 teams wrong (80 points)
- State 3: 3 teams wrong (60 points)
- State 4: Iran correct (50 points)
- State 5: One complete group (40 points)
- State 6: 3 teams in group (20 points)

**Usage**:
```bash
node scripts/test-scoring.js
```

**Prerequisites**: 
- Application must be running on `http://localhost:3000`
- Database must be seeded with teams

**What it does**:
- Creates test users for each scenario
- Submits predictions matching each state
- Finalizes predictions
- Triggers processing
- Verifies scores match expected values

**Example Output**:
```bash
$ node scripts/test-scoring.js
🚀 Starting Scoring Algorithm Tests
==================================================

🧪 Testing: State 1: Perfect prediction (100 points)
  ✓ Prediction submitted
  ✓ Prediction finalized
  ✓ Processing triggered
  📊 Score: 100 (Expected: 100)
  📋 Rule: state_1 (Expected: state_1)
  ✅ PASS

🧪 Testing: State 2: 2 teams wrong (80 points)
  ...
```

---

##### 5. `test-sms-integration.js`

**Purpose**: Tests SMS.ir integration for sending OTP codes.

**Why use it**: Verifies that SMS.ir API is configured correctly and can send OTP codes to real phone numbers.

**Usage**:
```bash
node scripts/test-sms-integration.js
```

**Prerequisites**:
- Application must be running
- Valid SMS.ir API key in `.env`
- Test phone number configured in script

**What it does**:
- Sends OTP to test phone number
- Verifies OTP code is received
- Tests OTP verification
- Tests invalid phone number handling

**Example Output**:
```bash
$ node scripts/test-sms-integration.js
🧪 Testing SMS.ir Integration
==================================================

📱 Test 1: Send OTP to valid phone
✅ Response: { success: true, data: { code: '123456', messageId: '...' } }
📨 SMS.ir Message ID: 12345
🔑 OTP Code: 123456

🔐 Test 2: Verify OTP
✅ Verification successful
🎟️  Token: abc123def456ghi789...
```

---

#### Bash Scripts

##### 1. `scripts/import-prediction-data.sh`

**Purpose**: Complete workflow to import prediction data from SQL files into the database.

**Why use it**: When you have existing prediction data in SQL format, this script automates the entire import process including user creation, data validation, and finalization.

**Usage**:
```bash
bash scripts/import-prediction-data.sh
```

**Prerequisites**:
- `prediction.sql` file in project root
- Docker containers running (PostgreSQL)
- Node.js available

**What it does**:
1. Extracts user IDs from `prediction.sql`
2. Generates `users.sql` with user records
3. Creates database backup (timestamped)
4. Imports users into database
5. Verifies user count
6. Imports predictions
7. Finalizes all predictions
8. Verifies prediction count
9. Shows final statistics

**Safety Features**:
- Creates backup before import
- Uses `ON CONFLICT DO NOTHING` for safety
- Error checking at each step
- Verification after each import

**Example Output**:
```bash
$ bash scripts/import-prediction-data.sh
🚀 Starting prediction data import process...

📊 Step 1: Extracting user IDs...
✅ Found 50000 unique users

👥 Step 2: Generating users SQL...
✅ Generated users.sql successfully!

💾 Step 3: Creating database backup...
✅ Backup created

📥 Step 4: Importing users...
✅ Users imported

🔍 Step 5: Verifying users...
   Users in database: 50000

📥 Step 6: Importing predictions...
✅ Predictions imported

✅ Step 7: Finalizing predictions...
✅ Predictions finalized

🎉 Import process completed successfully!

📋 Next steps:
   1. Test in Swagger: http://localhost:3000/api/docs
   2. Trigger processing: POST /admin/trigger-prediction-process
   3. Check leaderboard: GET /predictions/leaderboard
```

---

##### 2. `create-sample-predictions.sh`

**Purpose**: Creates sample predictions for testing and development.

**Why use it**: Quickly populate the database with test predictions to test the scoring system, leaderboard, and other features without manual API calls.

**Usage**:
```bash
bash create-sample-predictions.sh
```

**Prerequisites**:
- Application running on `http://localhost:3000`
- `jq` installed (for JSON parsing)
- `test-prediction-helper.js` available

**What it does**:
- Creates 5 test users with different phone numbers
- Sends OTP for each user
- Verifies OTP and gets tokens
- Generates random predictions
- Submits and finalizes predictions
- Shows final statistics

**Example Output**:
```bash
$ bash create-sample-predictions.sh
Creating sample predictions for testing...

Creating prediction for 09111111111...
  OTP Code: 123456
  Token: abc123def456ghi789...
  ✓ Prediction submitted
  ✓ Prediction finalized

...

✅ Sample predictions created!

Statistics:
{
  "total": 5,
  "finalized": 5,
  "pending": 0
}
```

---

##### 3. `test-performance.sh`

**Purpose**: Tests authentication API performance and response times.

**Why use it**: Verify that authentication endpoints meet performance requirements (should be under 300ms).

**Usage**:
```bash
bash test-performance.sh
```

**Prerequisites**:
- Application running
- `jq` installed

**What it does**:
- Measures OTP send time
- Measures OTP verification time
- Measures session retrieval time
- Reports all durations in milliseconds

**Example Output**:
```bash
$ bash test-performance.sh
Testing Authentication Performance...

1. Sending OTP...
   Duration: 145ms
2. Verifying OTP...
   Duration: 89ms
3. Getting sessions...
   Duration: 12ms

✅ All operations should be under 300ms
```

---

##### 4. `test-team-performance.sh`

**Purpose**: Tests team API performance, including cache hit/miss scenarios.

**Why use it**: Verify that Redis caching is working correctly and improving response times.

**Usage**:
```bash
bash test-team-performance.sh
```

**Prerequisites**:
- Application running
- Redis running

**What it does**:
- Tests first request (cache miss) - should be slower
- Tests second request (cache hit) - should be much faster
- Tests various team endpoints
- Reports response times

**Example Output**:
```bash
$ bash test-team-performance.sh
Testing Team API Performance...

1. GET /teams (cache miss)
   Duration: 45ms
2. GET /teams (cache hit)
   Duration: 2ms (should be much faster)
3. GET /teams/groups
   Duration: 12ms
4. GET /teams/group/E
   Duration: 8ms
5. GET /teams/search?q=Iran
   Duration: 15ms

✅ All operations completed
```

---

## Testing

### Unit Tests

```bash
npm run test
```

### E2E Tests

```bash
npm run test:e2e
```

### Coverage

```bash
npm run test:cov
```

Coverage report: `coverage/lcov-report/index.html`

### Manual Testing

#### Test OTP Flow
```bash
# 1. Send OTP
curl -X POST http://localhost:3000/api/auth/send-otp \
  -H "Content-Type: application/json" \
  -d '{"phone":"09123456789"}'

# 2. Verify OTP (use code from response)
curl -X POST http://localhost:3000/api/auth/verify-otp \
  -H "Content-Type: application/json" \
  -d '{"phone":"09123456789","code":"123456"}'
```

---

## Deployment

### Docker Deployment

#### Build Docker Image
```bash
docker build -t worldcup-prediction .
```

#### Run with Docker Compose
```bash
docker-compose up -d
```

### Production Checklist

- [ ] Set `NODE_ENV=production`
- [ ] Update database credentials
- [ ] Configure Redis password
- [ ] Set strong JWT secret
- [ ] Configure SMS.ir API key
- [ ] Set `SMS_SANDBOX=false`
- [ ] Configure CORS origins
- [ ] Enable SSL/TLS
- [ ] Set up monitoring
- [ ] Configure backup strategy

---

## Scoring Algorithm

The system uses a 6-state scoring algorithm:

1. **State 1 (100 points)**: Perfect prediction - all 48 teams in correct groups
2. **State 2 (80 points)**: 2 teams misplaced
3. **State 3 (60 points)**: 3 teams misplaced
4. **State 4 (50 points)**: Iran team in correct group, but >3 teams misplaced
5. **State 5 (40 points)**: At least one complete group correct
6. **State 6 (20 points)**: 3 teams correct in at least one group

### Testing Scoring

```bash
node scripts/test-scoring.js
```

---

## Security Features

1. **Helmet.js** for HTTP security headers
2. **Rate limiting** (per phone number)
3. **JWT authentication**
4. **Input validation** (class-validator)
5. **SQL injection protection** (TypeORM)
6. **CORS configuration**
7. **Secure OTP generation** (crypto.randomInt)
8. **Constant-time OTP comparison**

---

## Troubleshooting

### Common Issues

#### Database Connection Error
```
Error: connect ECONNREFUSED 127.0.0.1:5432
```
**Solution**: Ensure PostgreSQL is running: `docker-compose ps`

#### Redis Connection Error
```
Error: connect ECONNREFUSED 127.0.0.1:6379
```
**Solution**: Start Redis: `docker-compose up -d redis`

#### OTP Not Sending
- Check SMS.ir API key
- Verify `SMS_SANDBOX` setting
- Check SMS template ID

#### Rate Limit Issues
- Rate limits are per phone number
- Wait for TTL to expire (120s for send, 60s for verify)

---

## Support & Documentation

- **Swagger UI**: `http://localhost:3000/api/docs`
- **Health Check**: `http://localhost:3000/health`
- **RabbitMQ Management**: `http://localhost:15672`