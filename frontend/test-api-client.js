// Test script to verify admin API client functionality
// Run this in browser console after logging in

async function testAdminApiClient() {
  console.log('🧪 Testing Admin API Client...');
  
  // Test 1: Products API
  try {
    console.log('📦 Testing Products API...');
    const productsResponse = await fetch('/api/admin/products', {
      headers: {
        'Authorization': `Bearer ${tokenManager.getToken()}`
      }
    });
    
    console.log('✅ Products API Status:', productsResponse.status);
    if (productsResponse.ok) {
      const productsData = await productsResponse.json();
      console.log('✅ Products API Success:', productsData.success);
      console.log('✅ Products Count:', productsData.data?.products?.length || 0);
    }
  } catch (error) {
    console.error('❌ Products API Failed:', error);
  }
  
  // Test 2: Categories API
  try {
    console.log('🏷️ Testing Categories API...');
    const categoriesResponse = await fetch('/api/admin/categories', {
      headers: {
        'Authorization': `Bearer ${tokenManager.getToken()}`
      }
    });
    
    console.log('✅ Categories API Status:', categoriesResponse.status);
    if (categoriesResponse.ok) {
      const categoriesData = await categoriesResponse.json();
      console.log('✅ Categories API Success:', categoriesData.success);
      console.log('✅ Categories Count:', categoriesData.categories?.length || 0);
    }
  } catch (error) {
    console.error('❌ Categories API Failed:', error);
  }
  
  // Test 3: Orders API
  try {
    console.log('📋 Testing Orders API...');
    const ordersResponse = await fetch('/api/admin/orders', {
      headers: {
        'Authorization': `Bearer ${tokenManager.getToken()}`
      }
    });
    
    console.log('✅ Orders API Status:', ordersResponse.status);
    if (ordersResponse.ok) {
      const ordersData = await ordersResponse.json();
      console.log('✅ Orders API Success:', ordersData.success);
      console.log('✅ Orders Count:', ordersData.data?.orders?.length || 0);
    }
  } catch (error) {
    console.error('❌ Orders API Failed:', error);
  }
  
  // Test 4: Dashboard API
  try {
    console.log('📊 Testing Dashboard API...');
    const dashboardResponse = await fetch('/api/admin/dashboard', {
      headers: {
        'Authorization': `Bearer ${tokenManager.getToken()}`
      }
    });
    
    console.log('✅ Dashboard API Status:', dashboardResponse.status);
    if (dashboardResponse.ok) {
      const dashboardData = await dashboardResponse.json();
      console.log('✅ Dashboard API Success:', dashboardData.success);
    }
  } catch (error) {
    console.error('❌ Dashboard API Failed:', error);
  }
}

// Test token refresh mechanism
function testTokenRefresh() {
  console.log('🔄 Testing Token Refresh Mechanism...');
  
  const currentToken = tokenManager.getToken();
  console.log('Current Token:', currentToken?.substring(0, 30) + '...');
  
  // Generate fresh token
  const freshToken = tokenManager.generateFreshToken();
  console.log('Fresh Token:', freshToken.substring(0, 30) + '...');
  
  // Set fresh token
  tokenManager.setToken(freshToken);
  console.log('✅ Fresh token set');
  
  // Validate fresh token
  const isValid = tokenManager.validateToken(freshToken);
  console.log('✅ Fresh token validation:', isValid);
}

// Run all tests
console.log('🚀 Starting Admin API Client Tests...');
testTokenRefresh();
setTimeout(testAdminApiClient, 1000);
