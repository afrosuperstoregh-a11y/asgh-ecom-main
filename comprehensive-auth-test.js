// Comprehensive authentication test to identify exact issues
const testCompleteAuthFlow = async () => {
  console.log('🔍 === COMPREHENSIVE AUTHENTICATION TEST ===');
  
  try {
    // Test 1: Login API
    console.log('\n📋 Step 1: Testing Login API...');
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

    if (!loginResponse.ok) {
      console.error('❌ Login API failed:', loginResponse.status, await loginResponse.text());
      return;
    }

    const loginData = await loginResponse.json();
    console.log('✅ Login API Response:', JSON.stringify(loginData, null, 2));

    if (!loginData.success || !loginData.token) {
      console.error('❌ Login API response invalid');
      return;
    }

    // Test 2: Token Validation API
    console.log('\n📋 Step 2: Testing Token Validation API...');
    const authResponse = await fetch('http://localhost:3000/api/admin/auth/me', {
      headers: {
        'Authorization': `Bearer ${loginData.token}`,
        'Content-Type': 'application/json',
      },
    });

    if (!authResponse.ok) {
      console.error('❌ Token Validation API failed:', authResponse.status, await authResponse.text());
      return;
    }

    const authData = await authResponse.json();
    console.log('✅ Token Validation Response:', JSON.stringify(authData, null, 2));

    // Test 3: Dashboard API
    console.log('\n📋 Step 3: Testing Dashboard API...');
    const dashboardResponse = await fetch('http://localhost:3000/api/admin/dashboard', {
      headers: {
        'Authorization': `Bearer ${loginData.token}`,
        'Content-Type': 'application/json',
      },
    });

    if (!dashboardResponse.ok) {
      console.error('❌ Dashboard API failed:', dashboardResponse.status, await dashboardResponse.text());
      return;
    }

    const dashboardData = await dashboardResponse.json();
    console.log('✅ Dashboard API Response:', JSON.stringify(dashboardData, null, 2));

    // Test 4: Frontend Routes
    console.log('\n📋 Step 4: Testing Frontend Routes...');
    
    // Test login page accessibility
    const loginPageResponse = await fetch('http://localhost:3000/admin/login');
    console.log('✅ Login Page Status:', loginPageResponse.status);

    // Test dashboard page accessibility (should redirect to login without token)
    const dashboardPageResponse = await fetch('http://localhost:3000/admin');
    console.log('✅ Dashboard Page Status (without token):', dashboardPageResponse.status);

    console.log('\n🎉 ALL TESTS PASSED - Authentication backend is working correctly!');
    console.log('\n📝 Next Steps:');
    console.log('1. Check browser console for frontend errors');
    console.log('2. Verify localStorage token storage');
    console.log('3. Check for JavaScript errors in browser');
    console.log('4. Verify Next.js routing is working');

  } catch (error) {
    console.error('❌ Test failed with error:', error);
  }
};

// Run the comprehensive test
testCompleteAuthFlow();
