# World Cup Prediction System - Backend

## Features Implemented ✅

### Phase 1: OTP Authentication System
- ✅ Redis-based OTP storage with 120s TTL
- ✅ Rate limiting: 1 OTP per 2 minutes per phone
- ✅ Verification limit: Max 5 attempts per minute
- ✅ Secure OTP generation (cryptographically secure)
- ✅ Constant-time comparison for security
- ✅ Comprehensive error handling
- ✅ Unit and E2E tests

## Tech Stack
- NestJS + TypeScript
- PostgreSQL (TypeORM)
- Redis (OTP storage + rate limiting)
- RabbitMQ (ready for queue processing)
- Swagger (API documentation)

## Getting Started

### Prerequisites
- Node.js 18+
- Docker & Docker Compose

### Installation
```bash
# 1. Clone repository
git clone <your-repo>
cd backend

# 2. Install dependencies
npm install

# 3. Start infrastructure
docker-compose up -d

# 4. Configure environment
cp .env.example .env
# Edit .env with your settings

# 5. Start application
npm run start:dev
```

### Testing
```bash
# Unit tests
npm run test

# E2E tests
npm run test:e2e

# Test coverage
npm run test:cov
```

### API Documentation

Access Swagger UI: http://localhost:3000/api/docs

## Project Structure
```
src/
├── common/
│   ├── decorators/     # Custom decorators
│   ├── filters/        # Exception filters
│   ├── guards/         # Auth guards
│   └── middleware/     # Middleware
├── config/             # Configuration files
├── database/
│   └── entities/       # TypeORM entities
└── modules/
    ├── auth/           # Authentication module
    │   ├── services/   # OTP service
    │   ├── dto/        # Data transfer objects
    │   └── exceptions/ # Custom exceptions
    └── redis/          # Redis service wrapper
```

## OTP Flow

1. **Send OTP**: `POST /api/auth/send-otp`
   - Validates phone number
   - Checks rate limit (1 per 2min per phone)
   - Generates 6-digit code
   - Stores in Redis with 120s TTL
   - Returns OTP (in dev mode)

2. **Verify OTP**: `POST /api/auth/verify-otp`
   - Validates input
   - Checks attempt limit (max 5 per minute)
   - Verifies code (constant-time comparison)
   - Creates/finds user
   - Returns authentication token

## Redis Keys
```
otp:phone:{phoneNumber}         → OTP data (TTL: 120s)
otp:send:limit:{phoneNumber}    → Send limit flag (TTL: 120s)
otp:verify:attempts:{phoneNumber} → Attempt counter (TTL: 60s)
send_otp:{phone}:{ip}           → Rate limit per phone+IP
verify_otp:{phone}:{ip}         → Verify rate limit
```

## Next Steps
- [ ] Implement SMS integration (sms.ir)
- [ ] Add session/token management
- [ ] Create Team module and seeding
- [ ] Implement Prediction module
- [ ] Build scoring algorithm
- [ ] Set up RabbitMQ queue processing

## Rate Limiting Rules

### Send OTP
- **Limit**: 1 request per 2 minutes
- **Scope**: Per phone number only
- **Redis Key**: `send_otp:{phoneNumber}`
- **TTL**: 120 seconds
- **Error**: HTTP 429 with retry time

### Verify OTP  
- **Limit**: 5 attempts per minute
- **Scope**: Per phone number only
- **Redis Key**: `verify_otp:{phoneNumber}`
- **TTL**: 60 seconds
- **Error**: HTTP 429 after 5 failed attempts

**Important**: Rate limits are applied per phone number only. Multiple users can request OTPs for different phone numbers simultaneously without affecting each other.

## Redis Keys Structure

All rate limiting is based on phone number only:
```
# OTP Storage
otp:phone:{phoneNumber}              → { code, expiresAt, attempts }  [TTL: 120s]

# Send Rate Limit
otp:send:limit:{phoneNumber}         → "1"  [TTL: 120s]
send_otp:{phoneNumber}               → counter  [TTL: 120s]

# Verify Rate Limit  
otp:verify:attempts:{phoneNumber}    → counter  [TTL: 60s]
verify_otp:{phoneNumber}             → counter  [TTL: 60s]
```

## Testing Rate Limits
```bash
# Test 1: Send OTP rate limit
curl -X POST http://localhost:3000/api/auth/send-otp \
  -H "Content-Type: application/json" \
  -d '{"phone":"09123456789"}'

# Immediately try again - should get 429
curl -X POST http://localhost:3000/api/auth/send-otp \
  -H "Content-Type: application/json" \
  -d '{"phone":"09123456789"}'

# Test 2: Different phone works immediately
curl -X POST http://localhost:3000/api/auth/send-otp \
  -H "Content-Type: application/json" \
  -d '{"phone":"09987654321"}'

# Test 3: Verify limit (try 5 times with wrong code)
for i in {1..5}; do
  curl -X POST http://localhost:3000/api/auth/verify-otp \
    -H "Content-Type: application/json" \
    -d '{"phone":"09123456789","code":"000000"}'
done
```