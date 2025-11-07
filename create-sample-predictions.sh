#!/bin/bash

echo "Creating sample predictions for testing..."

# Array of test phone numbers
phones=("09111111111" "09222222222" "09333333333" "09444444444" "09555555555")

for phone in "${phones[@]}"
do
  echo ""
  echo "Creating prediction for $phone..."
  
  # Send OTP
  RESPONSE=$(curl -s -X POST http://localhost:3000/api/auth/send-otp \
    -H "Content-Type: application/json" \
    -d "{\"phone\":\"$phone\"}")
  
  CODE=$(echo $RESPONSE | jq -r '.data.code')
  echo "  OTP Code: $CODE"
  
  # Wait a bit
  sleep 1
  
  # Verify OTP
  TOKEN=$(curl -s -X POST http://localhost:3000/api/auth/verify-otp \
    -H "Content-Type: application/json" \
    -d "{\"phone\":\"$phone\",\"code\":\"$CODE\"}" \
    | jq -r '.data.token')
  
  echo "  Token: ${TOKEN:0:20}..."
  
  # Generate prediction
  PREDICTION=$(node test-prediction-helper.js)
  
  # Submit prediction
  curl -s -X POST http://localhost:3000/api/predictions \
    -H "Authorization: Bearer $TOKEN" \
    -H "Content-Type: application/json" \
    -d "$PREDICTION" > /dev/null
  
  echo "  ✓ Prediction submitted"
  
  # Finalize prediction
  curl -s -X POST http://localhost:3000/api/predictions/finalize \
    -H "Authorization: Bearer $TOKEN" > /dev/null
  
  echo "  ✓ Prediction finalized"
  
  # Wait before next
  sleep 2
done

echo ""
echo "✅ Sample predictions created!"
echo ""
echo "Statistics:"
curl -s http://localhost:3000/api/predictions/statistics | jq