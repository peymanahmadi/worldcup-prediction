const fs = require('fs');

// Get all 48 team UUIDs from teams.seed.ts
const teamIds = [
  'ab2fc597-2155-4b63-b61f-2a1164d596d0',
  '4aa49644-8e88-4606-95c7-283074ebd555',
  '6febc182-cc6d-4ee7-88c9-349643f17ab2',
  '91fb96c3-1b47-4d6a-bd56-9dedebf29307',
  'c7adb883-2fee-4160-9a9c-8b8d25f80681',
  'bb0e3411-c9cb-4d7b-989a-85e66da231ce',
  '5e4b6cb2-d345-4dc8-b248-cc2f1b4314c8',
  'e09bbfe5-1838-499b-8179-c8145d9aa211',
  '9aaf0485-4d98-4565-b61b-ff5827d50af4',
  '1f02004d-a219-4742-9b32-7a610f0be53f',
  'ebf44aab-c0c8-4f3c-9d4b-2a1da10bc426',
  '295c02f8-1d5b-458b-9fca-53cc96804bb0',
  'a7cbdde6-f6be-4da6-a41f-342d6e2aaac1',
  '455dde8b-3e0e-4190-84cc-8de44f0f04eb',
  '9369a23e-7905-4d34-a477-3b092846ffd3',
  '57ef44a7-8c6f-4276-a34d-e2a275a450e0',
  'a24dd484-f24d-45ce-9186-f2c6b746b75e',
  'f9c2ddd2-b1db-4452-919e-873fdab685b1',
  '72bd98c9-c7c5-43ef-8495-1d4a08632dc8',
  '2a0504f4-0633-456d-86a5-19aab0f05b09',
  'e6a15144-fa72-41c7-8b25-a96c85f10be1',
  '86bcb8c4-68fe-4323-a478-02461ce2c2d1',
  '9ba65926-3b5d-4a2e-85ee-9ae2cf20f86c',
  'ae863984-2ec7-40cd-97bb-b771d17a8bd7',
  '4c747601-010c-4139-bfcd-e5351495c66d',
  'a47bf240-fd3b-49fe-bde3-80ff6738286a',
  'ee97c1d4-c027-465d-bed8-a1e511598c93',
  'c9d1fd0f-3a03-4790-9be4-f28a70f2cf76',
  '59d50cb6-077f-4754-bcb5-a603f50d76cd',
  'd94a6cf6-6303-48b0-a850-23da1594499d',
  'ffcf0c31-3be9-48c9-a477-3472a5f49d31',
  '77cc97d5-ff3f-48ff-84e1-70b2128b017f',
  '7bffa03e-8eb3-4b21-b03c-407c8f841c99',
  '29a3ca1a-cfc3-43fa-995d-eb94b27ee0ec',
  '46dbd242-5fd3-437f-b3ee-9e6083456760',
  'b1e78534-de48-4eb5-b144-662f54dfb0e4',
  'f50007b3-0ba7-41cd-bd18-e6cd36776487',
  '8f6af8b1-11aa-433c-9d45-7dd2d2b5a650',
  'a3cd8425-5068-4b23-92ae-51c1b7a03412',
  'ac2a6ea5-e555-4582-a4b8-5161e6a3bbe2',
  '5ebf6e44-1b33-4572-936c-4a98730e08a7',
  '4f63f7f1-3e1d-424f-a4ff-ed02534ff884',
  'bf5556ec-a78d-4047-a0f5-7b34b07c21aa', // Iran
  '3a49f921-7a07-4316-8efa-923ff81947db',
  '9d523655-b455-469d-b6e8-e4caf1790c6d',
  '5c1824ec-16dd-4e19-a891-78aa360cab1f',
  '4d1e764a-3605-4983-88e9-55cca2ff8bd2',
  '0cfbaa71-24eb-484b-8051-db6e61f55953',
];

// Shuffle array
function shuffle(array) {
  const shuffled = [...array];
  for (let i = shuffled.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
  }
  return shuffled;
}

// Generate prediction with 12 groups, 4 teams each
function generatePrediction() {
  const shuffled = shuffle(teamIds);
  const groups = ['A', 'B', 'C', 'D', 'E', 'F', 'G', 'H', 'I', 'J', 'K', 'L'];

  const prediction = { groups: {} };

  groups.forEach((group, index) => {
    const start = index * 4; // 4 teams per group
    const groupTeams = shuffled.slice(start, start + 4);

    // Format as nested arrays like in SQL
    prediction.groups[group] = groupTeams.map((teamId) => [teamId]);
  });

  return prediction;
}

// Generate and save
const prediction = generatePrediction();
console.log(JSON.stringify(prediction, null, 2));

// Save to file
fs.writeFileSync('test-prediction.json', JSON.stringify(prediction, null, 2));

console.log('\n✅ Test prediction saved to test-prediction.json');
console.log('📊 12 groups with 4 teams each = 48 total teams');
