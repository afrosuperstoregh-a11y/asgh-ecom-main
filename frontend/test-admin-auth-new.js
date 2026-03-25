// Test script to verify admin authentication flow
// Run this in the browser console on the admin login page

async function testAdminAuth() {
  console.log('🧪 Testing Admin Authentication Flow...');
  
  // Test 1: Check if we can generate a fresh token
  const timestamp = Date.now();
  const testToken = `prod-jwt-token-admin-${timestamp}`;
  console.log('✅ Generated fresh token:', testToken.substring(0, 30) + '...');
  
  // Test 2: Test token validation
  const tokenManager = window.tokenManager;
  if (tokenManager) {
    console.log('✅ Token manager found');
    
    // Clear any existing tokens
    tokenManager.removeToken();
    console.log('✅ Cleared existing tokens');
    
    // Set fresh token
    tokenManager.setToken(testToken);
    console.log('✅ Set fresh token');
    
    // Validate token
    const isValid = tokenManager.validateToken(testToken);
    console.log('✅ Token validation result:', isValid);
    
    // Test API call
    try {
      const response = await fetch('/api/admin/products', {
        headers: {
          'Authorization': `Bearer ${testToken}`
        }
      });
      
      console.log('✅ API Response Status:', response.status);
      if (response.ok) {
        const data = await response.json();
        console.log('✅ API Response Data:', data.success ? 'Success' : 'Failed');
      }
    } catch (error) {
      console.error('❌ API Call Failed:', error);
    }
  } else {
    console.error('❌ Token manager not found');
  }
}

// Test expired token handling
async function testExpiredToken() {
  console.log('🧪 Testing Expired Token Handling...');
  
  const expiredToken = 'prod-jwt-token-admin-1712345678900'; // Old timestamp
  console.log('✅ Using expired token:', expiredToken.substring(0, 30) + '...');
  
  try {
    const response = await fetch('/api/admin/products', {
      headers: {
        'Authorization': `Bearer ${expiredToken}`
      }
    });
    
    console.log('✅ Expired Token Response Status:', response.status);
    if (response.status === 401) {
      console.log('✅ Correctly rejected expired token');
    }
  } catch (error) {
    console.error('❌ API Call Failed:', error);
  }
}

// Run tests
console.log('🚀 Starting Admin Auth Tests...');
testAdminAuth().then(() => {
  setTimeout(testExpiredToken, 1000);
});
