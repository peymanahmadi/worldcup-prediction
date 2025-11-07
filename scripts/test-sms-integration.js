const axios = require('axios');

const API_URL = 'http://localhost:3000';

async function testSmsIntegration() {
  console.log('🧪 Testing SMS.ir Integration\n');
  console.log('='.repeat(50));

  try {
    // Test 1: Valid phone number
    console.log('\n📱 Test 1: Send OTP to valid phone');
    const phone = '09132064550'; // Your test phone

    const sendResponse = await axios.post(`${API_URL}/auth/send-otp`, {
      phone,
    });

    console.log('✅ Response:', sendResponse.data);

    if (sendResponse.data.data.messageId) {
      console.log(`📨 SMS.ir Message ID: ${sendResponse.data.data.messageId}`);
    }

    if (sendResponse.data.data.code) {
      console.log(`🔑 OTP Code: ${sendResponse.data.data.code}`);

      // Test 2: Verify OTP
      console.log('\n🔐 Test 2: Verify OTP');
      const code = sendResponse.data.data.code;

      const verifyResponse = await axios.post(`${API_URL}/auth/verify-otp`, {
        phone,
        code,
      });

      console.log('✅ Verification successful');
      console.log(
        `🎟️  Token: ${verifyResponse.data.data.token.substring(0, 20)}...`,
      );
    }

    // Test 3: Invalid phone number
    console.log('\n📱 Test 3: Send OTP to invalid phone');
    try {
      await axios.post(`${API_URL}/auth/send-otp`, { phone: '0913206455' });
    } catch (error) {
      if (error.response) {
        console.log('⚠️  Expected error:', error.response.data.error.message);
      }
    }

    console.log('\n' + '='.repeat(50));
    console.log('✅ All tests completed!\n');
  } catch (error) {
    console.error('\n❌ Test failed:');
    console.error(error.response?.data || error.message);
  }
}

testSmsIntegration();
