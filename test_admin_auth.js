const axios = require('axios');

// Test admin authentication
async function testAdminAuth() {
  const baseURL = process.env.API_URL || 'http://localhost:3001';
  
  try {
    console.log('🔐 Testing Admin Authentication...');
    
    // Test both admin accounts
    const adminAccounts = [
      {
        email: 'admin@afrosuperstore.ca',
        password: 'Admin123!',
        name: 'Primary Admin'
      },
      {
        email: 'info@afrosuperstore.ca',
        password: 'Iamtech@100',
        name: 'Secondary Admin'
      }
    ];

    for (const admin of adminAccounts) {
      console.log(`\n📧 Testing ${admin.name} login...`);
      
      try {
        const loginResponse = await axios.post(`${baseURL}/api/admin/auth/login`, {
          email: admin.email,
          password: admin.password
        });
        
        if (loginResponse.data.success) {
          console.log(`✅ ${admin.name} login successful`);
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
          
          console.log(`✅ ${admin.name} authentication test passed`);
          
        } else {
          console.log(`❌ ${admin.name} login failed:`, loginResponse.data.message);
        }
      } catch (error) {
        console.log(`❌ ${admin.name} authentication failed:`, error.response?.data || error.message);
      }
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
