const fs = require('fs');
const path = require('path');

console.log('👥 Generating users SQL from user IDs...\n');

// Read user IDs
const userIdsPath = path.join(__dirname, '..', 'user_ids.txt');

if (!fs.existsSync(userIdsPath)) {
  console.error('❌ Error: user_ids.txt not found!');
  console.error('   Run extract-user-ids.js first.');
  process.exit(1);
}

const userIds = fs
  .readFileSync(userIdsPath, 'utf8')
  .split('\n')
  .filter((id) => id.trim().length > 0);

console.log(`📋 Processing ${userIds.length} user IDs...\n`);

// Generate SQL INSERT statements
const batchSize = 1000; // Insert 1000 users per statement
const sqlStatements = [];

// Header
sqlStatements.push('-- Generated Users from prediction.sql');
sqlStatements.push('-- Total users: ' + userIds.length);
sqlStatements.push('-- Generated at: ' + new Date().toISOString());
sqlStatements.push('');

// Process in batches
for (let i = 0; i < userIds.length; i += batchSize) {
  const batch = userIds.slice(i, i + batchSize);

  sqlStatements.push(
    `-- Batch ${Math.floor(i / batchSize) + 1} (${batch.length} users)`,
  );
  sqlStatements.push(
    'INSERT INTO users (id, phone, is_active, created_at, updated_at) VALUES',
  );

  const values = batch.map((userId, index) => {
    // Generate sequential phone number
    // Format: 09120000001, 09120000002, etc.
    const phoneNumber = '0912' + String(i + index + 1).padStart(7, '0');

    return `  ('${userId}', '${phoneNumber}', true, NOW(), NOW())`;
  });

  sqlStatements.push(values.join(',\n'));
  sqlStatements.push('ON CONFLICT (id) DO NOTHING;');
  sqlStatements.push('');
}

// Add summary
sqlStatements.push('-- Summary');
sqlStatements.push(`-- Total users inserted: ${userIds.length}`);
sqlStatements.push(
  `-- Phone range: 09120000001 to 0912${String(userIds.length).padStart(7, '0')}`,
);

// Save to file
const outputPath = path.join(__dirname, '..', 'users.sql');
fs.writeFileSync(outputPath, sqlStatements.join('\n'));

console.log('✅ Generated users.sql successfully!\n');
console.log('📊 Summary:');
console.log(`   Total users: ${userIds.length}`);
console.log(`   Batch size: ${batchSize} users per INSERT`);
console.log(`   Total batches: ${Math.ceil(userIds.length / batchSize)}`);
console.log(
  `   Phone numbers: 09120000001 - 0912${String(userIds.length).padStart(7, '0')}`,
);
console.log('\n💾 Saved to: users.sql');
console.log('\n📝 Sample SQL:');

// Show first few lines
const sampleLines = sqlStatements.slice(4, 14).join('\n');
console.log(sampleLines);

console.log('\n✅ Ready to import!');
