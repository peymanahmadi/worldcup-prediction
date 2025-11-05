#!/bin/bash

echo "Testing Authentication Performance..."

# Send OTP
echo "1. Sending OTP..."
START=$(date +%s%N)
RESPONSE=$(curl -s -X POST http://localhost:3000/auth/send-otp \
  -H "Content-Type: application/json" \
  -d '{"phone":"09999999999"}')
END=$(date +%s%N)
DURATION=$(( (END - START) / 1000000 ))
echo "   Duration: ${DURATION}ms"
CODE=$(echo $RESPONSE | jq -r '.data.code')

# Verify OTP
echo "2. Verifying OTP..."
START=$(date +%s%N)
RESPONSE=$(curl -s -X POST http://localhost:3000/auth/verify-otp \
  -H "Content-Type: application/json" \
  -d "{\"phone\":\"09999999999\",\"code\":\"$CODE\"}")
END=$(date +%s%N)
DURATION=$(( (END - START) / 1000000 ))
echo "   Duration: ${DURATION}ms"
TOKEN=$(echo $RESPONSE | jq -r '.data.token')

# Get sessions
echo "3. Getting sessions..."
START=$(date +%s%N)
curl -s -X GET http://localhost:3000/auth/sessions \
  -H "Authorization: Bearer $TOKEN" > /dev/null
END=$(date +%s%N)
DURATION=$(( (END - START) / 1000000 ))
echo "   Duration: ${DURATION}ms"

echo ""
echo "✅ All operations should be under 300ms"