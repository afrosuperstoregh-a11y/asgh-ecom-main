const axios = require('axios');

const API_BASE = 'http://localhost:3001/api';

async function testAuth() {
  try {
    console.log('Testing Authentication API...\n');

    // Test registration
    console.log('1. Testing registration...');
    const registerResponse = await axios.post(`${API_BASE}/auth/register`, {
      email: 'test@example.com',
      password: 'TestPassword123!',
      name: 'Test User'
    });
    console.log('Registration successful:', registerResponse.data);
    console.log('');

    // Test login
    console.log('2. Testing login...');
    const loginResponse = await axios.post(`${API_BASE}/auth/login`, {
      email: 'test@example.com',
      password: 'TestPassword123!'
    });
    console.log('Login successful:', loginResponse.data);
    console.log('');

    // Test protected route
    console.log('3. Testing protected route...');
    const token = loginResponse.data.data.tokens.accessToken;
    const meResponse = await axios.get(`${API_BASE}/user/profile`, {
      headers: {
        'Authorization': `Bearer ${token}`
      }
    });
    console.log('Profile fetch successful:', meResponse.data);
    console.log('');

    console.log('All tests passed! ✅');

  } catch (error) {
    console.error('Test failed:', error.response?.data || error.message);
  }
}

testAuth();
