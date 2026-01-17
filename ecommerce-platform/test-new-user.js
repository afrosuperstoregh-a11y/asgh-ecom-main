const axios = require('axios');

const API_BASE = 'http://localhost:3001/api';

async function testNewUser() {
  try {
    console.log('Testing with new user...\n');

    // Test registration with new email
    const timestamp = Date.now();
    const email = `user${timestamp}@example.com`;
    
    console.log('1. Testing registration...');
    const registerResponse = await axios.post(`${API_BASE}/auth-simple/register`, {
      email: email,
      password: 'TestPassword123!',
      name: 'New Test User'
    });
    console.log('✅ Registration successful!');
    console.log('');

    // Test login
    console.log('2. Testing login...');
    const loginResponse = await axios.post(`${API_BASE}/auth-simple/login`, {
      email: email,
      password: 'TestPassword123!'
    });
    console.log('✅ Login successful!');
    console.log('');

    // Test protected route
    console.log('3. Testing protected route...');
    const token = loginResponse.data.data.tokens.accessToken;
    const meResponse = await axios.get(`${API_BASE}/auth-simple/me`, {
      headers: {
        'Authorization': `Bearer ${token}`
      }
    });
    console.log('✅ Protected route working!');
    console.log('');

    console.log('🎉 All authentication tests passed!');
    console.log('API is ready for frontend integration!');

  } catch (error) {
    console.error('❌ Test failed:', error.response?.data || error.message);
  }
}

testNewUser();
