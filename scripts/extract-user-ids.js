const fs = require('fs');
const path = require('path');

console.log('📊 Extracting user IDs from prediction.sql...\n');

// Read the prediction.sql file
const sqlFilePath = path.join(__dirname, '..', 'prediction.sql');

if (!fs.existsSync(sqlFilePath)) {
  console.error('❌ Error: prediction.sql not found!');
  console.error(
    '   Please place prediction.sql in the project root directory.',
  );
  process.exit(1);
}

const sqlContent = fs.readFileSync(sqlFilePath, 'utf8');

// Regular expression to extract user_id (second UUID in each row)
// Format: ('prediction_id', 'user_id', '...')
const userIdRegex =
  /,\s*'([a-f0-9]{8}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{12})'/gi;

const userIds = new Set();
let match;

while ((match = userIdRegex.exec(sqlContent)) !== null) {
  userIds.add(match[1]);
}

console.log(`✅ Found ${userIds.size} unique users\n`);

// Convert to array and save
const userIdArray = Array.from(userIds);

// Save to file
const outputPath = path.join(__dirname, '..', 'user_ids.txt');
fs.writeFileSync(outputPath, userIdArray.join('\n'));

console.log(`💾 Saved user IDs to: user_ids.txt`);
console.log(`\nFirst 5 user IDs:`);
userIdArray.slice(0, 5).forEach((id, index) => {
  console.log(`   ${index + 1}. ${id}`);
});

console.log(`\n✅ Extraction complete!`);
