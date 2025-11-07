#!/bin/bash

echo "🚀 Starting prediction data import process..."
echo ""

# Step 1: Extract user IDs
echo "📊 Step 1: Extracting user IDs..."
node scripts/extract-user-ids.js
if [ $? -ne 0 ]; then
    echo "❌ Failed to extract user IDs"
    exit 1
fi
echo ""

# Step 2: Generate users SQL
echo "👥 Step 2: Generating users SQL..."
node scripts/generate-users-sql.js
if [ $? -ne 0 ]; then
    echo "❌ Failed to generate users SQL"
    exit 1
fi
echo ""

# Step 3: Backup database
echo "💾 Step 3: Creating database backup..."
docker exec worldcup_postgres pg_dump -U postgres worldcup > backup_before_import_$(date +%Y%m%d_%H%M%S).sql
echo "✅ Backup created"
echo ""

# Step 4: Import users
echo "📥 Step 4: Importing users..."
docker exec -i worldcup_postgres psql -U postgres -d worldcup < users.sql
if [ $? -ne 0 ]; then
    echo "❌ Failed to import users"
    exit 1
fi
echo "✅ Users imported"
echo ""

# Step 5: Verify users
echo "🔍 Step 5: Verifying users..."
USER_COUNT=$(docker exec worldcup_postgres psql -U postgres -d worldcup -t -c "SELECT COUNT(*) FROM users;")
echo "   Users in database: $USER_COUNT"
echo ""

# Step 6: Import predictions
echo "📥 Step 6: Importing predictions..."
docker exec -i worldcup_postgres psql -U postgres -d worldcup < prediction.sql
if [ $? -ne 0 ]; then
    echo "❌ Failed to import predictions"
    exit 1
fi
echo "✅ Predictions imported"
echo ""

# Step 7: Finalize predictions
echo "✅ Step 7: Finalizing predictions..."
docker exec worldcup_postgres psql -U postgres -d worldcup -c "
UPDATE predictions 
SET is_finalized = true, submitted_at = created_at 
WHERE is_finalized = false;
"
echo "✅ Predictions finalized"
echo ""

# Step 8: Verify predictions
echo "🔍 Step 8: Verifying predictions..."
PREDICTION_COUNT=$(docker exec worldcup_postgres psql -U postgres -d worldcup -t -c "SELECT COUNT(*) FROM predictions;")
echo "   Predictions in database: $PREDICTION_COUNT"
echo ""

# Step 9: Final verification
echo "🔍 Step 9: Final verification..."
docker exec worldcup_postgres psql -U postgres -d worldcup -c "
SELECT 
    'Users' as entity,
    COUNT(*) as count
FROM users
UNION ALL
SELECT 
    'Predictions' as entity,
    COUNT(*) as count
FROM predictions;
"
echo ""

echo "🎉 Import process completed successfully!"
echo ""
echo "📋 Next steps:"
echo "   1. Test in Swagger: http://localhost:3000/api/docs"
echo "   2. Trigger processing: POST /admin/trigger-prediction-process"
echo "   3. Check leaderboard: GET /predictions/leaderboard"
echo ""