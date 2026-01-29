const axios = require('axios');

// Test admin authentication
async function testAdminAuth() {
  const baseURL = process.env.API_URL || 'http://localhost:3001';
  
  try {
    console.log('🔐 Testing Admin Authentication...');
    
    // Test admin login
    console.log('\n📧 Testing admin login...');
    const loginResponse = await axios.post(`${baseURL}/api/admin/auth/login`, {
      email: 'admin@afrosuperstore.ca',
      password: 'Admin123!'
    });
    
    if (loginResponse.data.success) {
      console.log('✅ Admin login successful');
      console.log('   User:', loginResponse.data.user.email);
      console.log('   Role:', loginResponse.data.user.role);
      console.log('   Token received:', loginResponse.data.token ? 'Yes' : 'No');
      
      const token = loginResponse.data.token;
      
      // Test authenticated endpoint
      console.log('\n🛡️  Testing authenticated endpoint...');
      const authResponse = await axios.get(`${baseURL}/api/admin/auth/me`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      
      if (authResponse.data.success) {
        console.log('✅ Authenticated endpoint working');
        console.log('   User data:', authResponse.data.user.email);
      }
      
      // Test admin dashboard
      console.log('\n📊 Testing admin dashboard...');
      const dashboardResponse = await axios.get(`${baseURL}/api/admin/dashboard`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      
      if (dashboardResponse.data.success) {
        console.log('✅ Admin dashboard accessible');
        console.log('   Stats available:', Object.keys(dashboardResponse.data.stats).length);
      }
      
      // Test unauthorized access
      console.log('\n🚫 Testing unauthorized access...');
      try {
        await axios.get(`${baseURL}/api/admin/dashboard`);
        console.log('❌ Security issue: endpoint accessible without token');
      } catch (error) {
        if (error.response && error.response.status === 401) {
          console.log('✅ Security working: unauthorized access blocked');
        }
      }
      
      console.log('\n🎉 Admin authentication test completed successfully!');
      
    } else {
      console.log('❌ Admin login failed:', loginResponse.data.message);
    }
    
  } catch (error) {
    console.error('❌ Authentication test failed:', error.response?.data || error.message);
    
    if (error.code === 'ECONNREFUSED') {
      console.log('\n💡 Note: Backend server needs to be running');
      console.log('   Start with: npm run dev');
    }
  }
}

// Test if we can run this from command line
if (require.main === module) {
  require('dotenv').config({ path: '.env.local' });
  testAdminAuth();
}

module.exports = { testAdminAuth };
