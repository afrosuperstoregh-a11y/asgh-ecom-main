const axios = require('axios');

async function testLogin() {
  try {
    const response = await axios.post('http://localhost:3001/api/admin/auth/login', {
      email: 'admin@afrosuperstore.ca',
      password: 'Admin123!'
    });
    
    console.log('✅ Login successful:', response.data);
  } catch (error) {
    console.log('❌ Login failed:', error.response?.data || error.message);
  }
}

testLogin();
