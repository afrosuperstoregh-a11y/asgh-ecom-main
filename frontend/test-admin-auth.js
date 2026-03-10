// Admin Authentication Test Script
// Run this in browser console on http://localhost:3000/admin/login

async function testAdminAuth() {
  console.log('🔍 Testing Admin Authentication Flow...\n');

  try {
    // Test 1: Login with super admin credentials
    console.log('📝 Test 1: Admin Login');
    const loginResponse = await fetch('/api/admin/auth/login', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ 
        email: 'admin@afrosuperstore.ca', 
        password: 'Admin123!' 
      }),
    });

    const loginData = await loginResponse.json();
    console.log('Login Response:', loginData);

    if (loginData.success && loginData.token) {
      console.log('✅ Login successful');
      
      // Store token (simulate what the login page does)
      localStorage.setItem('adminToken', loginData.token);
      localStorage.setItem('adminUser', JSON.stringify(loginData.user));
      
      console.log('🔑 Token stored:', loginData.token.substring(0, 50) + '...');
      
      // Test 2: Validate token with /api/admin/auth/me
      console.log('\n📝 Test 2: Token Validation');
      const meResponse = await fetch('/api/admin/auth/me', {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${loginData.token}`
        }
      });

      const meData = await meResponse.json();
      console.log('Auth Me Response:', meData);

      if (meData.success) {
        console.log('✅ Token validation successful');
        
        // Test 3: Access dashboard API
        console.log('\n📝 Test 3: Dashboard API Access');
        const dashboardResponse = await fetch('/api/admin/dashboard', {
          method: 'GET',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${loginData.token}`
          }
        });

        const dashboardData = await dashboardResponse.json();
        console.log('Dashboard Response:', dashboardData);

        if (dashboardData.success) {
          console.log('✅ Dashboard API access successful');
          console.log('📊 Dashboard Stats:', dashboardData.data.stats);
        } else {
          console.log('❌ Dashboard API access failed:', dashboardData.message);
        }
      } else {
        console.log('❌ Token validation failed:', meData.message);
      }
    } else {
      console.log('❌ Login failed:', loginData.message);
    }

    // Test 4: Test token manager functions
    console.log('\n📝 Test 4: Token Manager Functions');
    const tokenManager = {
      getToken: () => localStorage.getItem('adminToken'),
      getUser: () => {
        const userStr = localStorage.getItem('adminUser');
        return userStr ? JSON.parse(userStr) : null;
      },
      validateToken: (token) => {
        if (!token) return false;
        if (!token.startsWith('prod-jwt-token-')) return false;
        
        const tokenParts = token.split('-');
        const timestamp = tokenParts[3];
        
        if (timestamp) {
          const tokenTime = parseInt(timestamp);
          const currentTime = Date.now();
          const isExpired = (currentTime - tokenTime) > 24 * 60 * 60 * 1000;
          return !isExpired;
        }
        return true;
      }
    };

    const storedToken = tokenManager.getToken();
    const storedUser = tokenManager.getUser();
    const isValidToken = tokenManager.validateToken(storedToken);

    console.log('Stored Token:', storedToken ? storedToken.substring(0, 50) + '...' : 'None');
    console.log('Stored User:', storedUser);
    console.log('Token Valid:', isValidToken);

    console.log('\n🎉 Admin Authentication Test Complete!');
    console.log('📱 You can now visit: http://localhost:3000/admin');

  } catch (error) {
    console.error('❌ Test failed:', error);
  }
}

// Auto-run the test
testAdminAuth();
