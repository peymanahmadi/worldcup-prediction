#!/bin/bash

echo "Testing Team API Performance..."
echo ""

# Test 1: Get all teams (first request - cache miss)
echo "1. GET /teams (cache miss)"
START=$(date +%s%N)
curl -s http://localhost:3000/api/teams > /dev/null
END=$(date +%s%N)
DURATION=$(( (END - START) / 1000000 ))
echo "   Duration: ${DURATION}ms"

# Test 2: Get all teams (second request - cache hit)
echo "2. GET /teams (cache hit)"
START=$(date +%s%N)
curl -s http://localhost:3000/api/teams > /dev/null
END=$(date +%s%N)
DURATION=$(( (END - START) / 1000000 ))
echo "   Duration: ${DURATION}ms (should be much faster)"

# Test 3: Get teams by groups
echo "3. GET /teams/groups"
START=$(date +%s%N)
curl -s http://localhost:3000/api/teams/groups > /dev/null
END=$(date +%s%N)
DURATION=$(( (END - START) / 1000000 ))
echo "   Duration: ${DURATION}ms"

# Test 4: Get specific group
echo "4. GET /teams/group/E"
START=$(date +%s%N)
curl -s http://localhost:3000/api/teams/group/E > /dev/null
END=$(date +%s%N)
DURATION=$(( (END - START) / 1000000 ))
echo "   Duration: ${DURATION}ms"

# Test 5: Search
echo "5. GET /teams/search?q=Iran"
START=$(date +%s%N)
curl -s "http://localhost:3000/api/teams/search?q=Iran" > /dev/null
END=$(date +%s%N)
DURATION=$(( (END - START) / 1000000 ))
echo "   Duration: ${DURATION}ms"

echo ""
echo "✅ All operations completed"