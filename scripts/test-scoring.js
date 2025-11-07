const axios = require('axios');

const API_URL = 'http://localhost:3000/api';
let authToken = '';

// Correct groups from config
const CORRECT_GROUPS = {
  A: [
    'ab2fc597-2155-4b63-b61f-2a1164d596d0',
    '4aa49644-8e88-4606-95c7-283074ebd555',
    '6febc182-cc6d-4ee7-88c9-349643f17ab2',
    '91fb96c3-1b47-4d6a-bd56-9dedebf29307',
  ],
  B: [
    '4d1e764a-3605-4983-88e9-55cca2ff8bd2',
    'c7adb883-2fee-4160-9a9c-8b8d25f80681',
    'bb0e3411-c9cb-4d7b-989a-85e66da231ce',
    '5e4b6cb2-d345-4dc8-b248-cc2f1b4314c8',
  ],
  C: [
    'e09bbfe5-1838-499b-8179-c8145d9aa211',
    '9aaf0485-4d98-4565-b61b-ff5827d50af4',
    '1f02004d-a219-4742-9b32-7a610f0be53f',
    'ebf44aab-c0c8-4f3c-9d4b-2a1da10bc426',
  ],
  D: [
    '5c1824ec-16dd-4e19-a891-78aa360cab1f',
    '295c02f8-1d5b-458b-9fca-53cc96804bb0',
    'a7cbdde6-f6be-4da6-a41f-342d6e2aaac1',
    '455dde8b-3e0e-4190-84cc-8de44f0f04eb',
  ],
  E: [
    '9369a23e-7905-4d34-a477-3b092846ffd3',
    '57ef44a7-8c6f-4276-a34d-e2a275a450e0',
    'a24dd484-f24d-45ce-9186-f2c6b746b75e',
    'f9c2ddd2-b1db-4452-919e-873fdab685b1',
  ],
  F: [
    'bf5556ec-a78d-4047-a0f5-7b34b07c21aa', // Iran
    '72bd98c9-c7c5-43ef-8495-1d4a08632dc8',
    '2a0504f4-0633-456d-86a5-19aab0f05b09',
    'e6a15144-fa72-41c7-8b25-a96c85f10be1',
  ],
  G: [
    '86bcb8c4-68fe-4323-a478-02461ce2c2d1',
    '9ba65926-3b5d-4a2e-85ee-9ae2cf20f86c',
    'ae863984-2ec7-40cd-97bb-b771d17a8bd7',
    '4c747601-010c-4139-bfcd-e5351495c66d',
  ],
  H: [
    'a47bf240-fd3b-49fe-bde3-80ff6738286a',
    'ee97c1d4-c027-465d-bed8-a1e511598c93',
    'c9d1fd0f-3a03-4790-9be4-f28a70f2cf76',
    '59d50cb6-077f-4754-bcb5-a603f50d76cd',
  ],
  I: [
    'd94a6cf6-6303-48b0-a850-23da1594499d',
    'ffcf0c31-3be9-48c9-a477-3472a5f49d31',
    '77cc97d5-ff3f-48ff-84e1-70b2128b017f',
    '7bffa03e-8eb3-4b21-b03c-407c8f841c99',
  ],
  J: [
    '29a3ca1a-cfc3-43fa-995d-eb94b27ee0ec',
    '46dbd242-5fd3-437f-b3ee-9e6083456760',
    'b1e78534-de48-4eb5-b144-662f54dfb0e4',
    'f50007b3-0ba7-41cd-bd18-e6cd36776487',
  ],
  K: [
    '8f6af8b1-11aa-433c-9d45-7dd2d2b5a650',
    'a3cd8425-5068-4b23-92ae-51c1b7a03412',
    'ac2a6ea5-e555-4582-a4b8-5161e6a3bbe2',
    '5ebf6e44-1b33-4572-936c-4a98730e08a7',
  ],
  L: [
    '4f63f7f1-3e1d-424f-a4ff-ed02534ff884',
    '3a49f921-7a07-4316-8efa-923ff81947db',
    '9d523655-b455-469d-b6e8-e4caf1790c6d',
    '0cfbaa71-24eb-484b-8051-db6e61f55953',
  ],
};

// Helper to format prediction
function formatPrediction(groups) {
  const formatted = {};
  for (const [group, teams] of Object.entries(groups)) {
    formatted[group] = teams.map((t) => [t]);
  }
  return { groups: formatted };
}

// Test Scenario 1: Perfect prediction (State 1 - 100 points)
function createPerfectPrediction() {
  return formatPrediction(CORRECT_GROUPS);
}

// Test Scenario 2: 2 teams wrong (State 2 - 80 points)
function create2TeamsWrong() {
  const prediction = JSON.parse(JSON.stringify(CORRECT_GROUPS));

  // Swap 2 teams between groups A and B
  const temp = prediction.A[0];
  prediction.A[0] = prediction.B[0];
  prediction.B[0] = temp;

  return formatPrediction(prediction);
}

// Test Scenario 3: 3 teams wrong (State 3 - 60 points)
function create3TeamsWrong() {
  const prediction = JSON.parse(JSON.stringify(CORRECT_GROUPS));

  // Swap 3 teams
  const temp1 = prediction.A[0];
  prediction.A[0] = prediction.B[0];
  prediction.B[0] = prediction.C[0];
  prediction.C[0] = temp1;

  return formatPrediction(prediction);
}

// Test Scenario 4: Iran correct, but many teams wrong (State 4 - 50 points)
function createIranCorrect() {
  const prediction = JSON.parse(JSON.stringify(CORRECT_GROUPS));

  // Keep Iran in correct group (F)
  // But mess up other groups (more than 3 teams)
  const temp1 = prediction.A[0];
  const temp2 = prediction.B[0];
  const temp3 = prediction.C[0];
  const temp4 = prediction.D[0];

  prediction.A[0] = temp2;
  prediction.B[0] = temp3;
  prediction.C[0] = temp4;
  prediction.D[0] = temp1;

  return formatPrediction(prediction);
}

// Test Scenario 5: One complete group (State 5 - 40 points)
function createOneCompleteGroup() {
  const prediction = JSON.parse(JSON.stringify(CORRECT_GROUPS));

  // Keep group A perfect, mess up others
  for (let i = 0; i < 4; i++) {
    const temp = prediction.B[i];
    prediction.B[i] = prediction.C[i];
    prediction.C[i] = prediction.D[i];
    prediction.D[i] = prediction.E[i];
    prediction.E[i] = temp;
  }

  return formatPrediction(prediction);
}

// Test Scenario 6: 3 teams correct in one group (State 6 - 20 points)
function create3TeamsInGroup() {
  const prediction = JSON.parse(JSON.stringify(CORRECT_GROUPS));

  // Keep 3 teams in group A correct, swap 1
  prediction.A[3] = prediction.B[3];
  prediction.B[3] = CORRECT_GROUPS.A[3];

  // Mess up all other groups completely
  for (let i = 0; i < 4; i++) {
    const temp = prediction.C[i];
    prediction.C[i] = prediction.D[i];
    prediction.D[i] = prediction.E[i];
    prediction.E[i] = prediction.F[i];
    prediction.F[i] = temp;
  }

  return formatPrediction(prediction);
}

async function authenticate() {
  const phone = `0917${Date.now().toString().slice(-7)}`;

  // Send OTP
  const otpResponse = await axios.post(`${API_URL}/auth/send-otp`, { phone });
  const code = otpResponse.data.data.code;

  // Verify OTP
  const verifyResponse = await axios.post(`${API_URL}/auth/verify-otp`, {
    phone,
    code,
  });

  authToken = verifyResponse.data.data.token;
  console.log('✅ Authenticated');
}

async function testScenario(name, predictionFunc, expectedScore, expectedRule) {
  console.log(`\n🧪 Testing: ${name}`);

  try {
    // Create new user for each test
    await authenticate();

    const prediction = predictionFunc();

    // Submit prediction
    await axios.post(`${API_URL}/predictions`, prediction, {
      headers: { Authorization: `Bearer ${authToken}` },
    });
    console.log('  ✓ Prediction submitted');

    // Finalize prediction
    await axios.post(
      `${API_URL}/predictions/finalize`,
      {},
      {
        headers: { Authorization: `Bearer ${authToken}` },
      },
    );
    console.log('  ✓ Prediction finalized');

    // Trigger processing
    const processResponse = await axios.post(
      `${API_URL}/admin/trigger-prediction-process`,
      { reprocess: true },
      { headers: { Authorization: `Bearer ${authToken}` } },
    );
    console.log('  ✓ Processing triggered');

    // Get my prediction to find user_id
    const myPredResponse = await axios.get(
      `${API_URL}/predictions/my-prediction`,
      {
        headers: { Authorization: `Bearer ${authToken}` },
      },
    );
    const userId = myPredResponse.data.data.prediction.user_id;

    // Get result
    const resultResponse = await axios.get(
      `${API_URL}/predictions/result/${userId}`,
      {
        headers: { Authorization: `Bearer ${authToken}` },
      },
    );

    const result = resultResponse.data.data.result;

    if (!result) {
      console.log('  ❌ No result found');
      return;
    }

    console.log(
      `  📊 Score: ${result.total_score} (Expected: ${expectedScore})`,
    );
    console.log(
      `  📋 Rule: ${result.details.applied_rule} (Expected: ${expectedRule})`,
    );
    console.log(`  📈 Details:`);
    console.log(`     - Misplaced: ${result.details.total_misplaced}`);
    console.log(`     - Iran correct: ${result.details.iran_correct}`);
    console.log(
      `     - Complete groups: ${result.details.complete_groups.length}`,
    );

    if (
      result.total_score === expectedScore &&
      result.details.applied_rule === expectedRule
    ) {
      console.log('  ✅ PASS');
    } else {
      console.log('  ❌ FAIL');
    }
  } catch (error) {
    console.log('  ❌ Error:', error.response?.data || error.message);
  }
}

async function runTests() {
  console.log('🚀 Starting Scoring Algorithm Tests\n');
  console.log('='.repeat(50));

  await testScenario(
    'State 1: Perfect prediction (100 points)',
    createPerfectPrediction,
    100,
    'state_1',
  );

  await testScenario(
    'State 2: 2 teams wrong (80 points)',
    create2TeamsWrong,
    80,
    'state_2',
  );

  await testScenario(
    'State 3: 3 teams wrong (60 points)',
    create3TeamsWrong,
    60,
    'state_3',
  );

  await testScenario(
    'State 4: Iran correct (50 points)',
    createIranCorrect,
    50,
    'state_4',
  );

  await testScenario(
    'State 5: One complete group (40 points)',
    createOneCompleteGroup,
    40,
    'state_5',
  );

  await testScenario(
    'State 6: 3 teams in group (20 points)',
    create3TeamsInGroup,
    20,
    'state_6',
  );

  console.log('\n' + '='.repeat(50));
  console.log('✅ All tests completed!\n');
}

runTests().catch(console.error);
