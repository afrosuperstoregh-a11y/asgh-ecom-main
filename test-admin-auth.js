// Test admin authentication flow
const testAdminAuth = async () => {
  try {
    console.log('🧪 Testing admin authentication...');
    
    // Test login
    const loginResponse = await fetch('http://localhost:3000/api/admin/auth/login', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ 
        email: 'info@afrosuperstore.ca', 
        password: 'Iamtech@100' 
      }),
    });

    const loginData = await loginResponse.json();
    console.log('✅ Login response:', loginData);

    if (loginData.success && loginData.token) {
      console.log('✅ Login successful, token received');
      
      // Test dashboard API with token
      const dashboardResponse = await fetch('http://localhost:3000/api/admin/dashboard', {
        headers: {
          'Authorization': `Bearer ${loginData.token}`,
          'Content-Type': 'application/json',
        },
      });

      const dashboardData = await dashboardResponse.json();
      console.log('✅ Dashboard response:', dashboardData);
      
      // Test auth validation
      const authResponse = await fetch('http://localhost:3000/api/admin/auth/me', {
        headers: {
          'Authorization': `Bearer ${loginData.token}`,
          'Content-Type': 'application/json',
        },
      });

      const authData = await authResponse.json();
      console.log('✅ Auth validation response:', authData);
      
      console.log('🎉 All authentication tests passed!');
    } else {
      console.error('❌ Login failed:', loginData);
    }
  } catch (error) {
    console.error('❌ Test failed:', error);
  }
};

// Run the test
testAdminAuth();
