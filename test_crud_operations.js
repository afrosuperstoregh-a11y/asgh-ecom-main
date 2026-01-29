const axios = require('axios');

// Comprehensive CRUD validation tests
const baseURL = process.env.API_URL || 'http://localhost:3001';
let authToken = '';

async function loginAdmin() {
  try {
    console.log('🔐 Logging in as admin...');
    const response = await axios.post(`${baseURL}/api/admin/auth/login`, {
      email: 'admin@afrosuperstore.ca',
      password: 'Admin123!'
    });
    
    if (response.data.success) {
      authToken = response.data.token;
      console.log('✅ Admin login successful');
      return true;
    }
    return false;
  } catch (error) {
    console.log('❌ Admin login failed:', error.response?.data || error.message);
    return false;
  }
}

async function testProductsCRUD() {
  console.log('\n🛍️  Testing Products CRUD...');
  
  try {
    // Create product
    console.log('📝 Creating product...');
    const createResponse = await axios.post(`${baseURL}/api/products`, {
      name: 'Test Product',
      slug: 'test-product',
      description: 'Test product description',
      sku: 'TEST-001',
      price: 29.99,
      inventory_quantity: 100,
      status: 'active',
      images: ['https://example.com/image.jpg'],
      tags: ['test', 'product']
    }, {
      headers: { 'Authorization': `Bearer ${authToken}` }
    });
    
    if (createResponse.data.success) {
      const productId = createResponse.data.data.id;
      console.log('✅ Product created:', productId);
      
      // Read product
      console.log('📖 Reading product...');
      const readResponse = await axios.get(`${baseURL}/api/products/${productId}`);
      if (readResponse.data.success) {
        console.log('✅ Product read successfully');
      }
      
      // Update product
      console.log('✏️  Updating product...');
      const updateResponse = await axios.put(`${baseURL}/api/products/${productId}`, {
        price: 39.99,
        description: 'Updated description'
      }, {
        headers: { 'Authorization': `Bearer ${authToken}` }
      });
      
      if (updateResponse.data.success) {
        console.log('✅ Product updated successfully');
      }
      
      // Delete product (soft delete)
      console.log('🗑️  Deleting product...');
      const deleteResponse = await axios.delete(`${baseURL}/api/products/${productId}`, {
        headers: { 'Authorization': `Bearer ${authToken}` }
      });
      
      if (deleteResponse.data.success) {
        console.log('✅ Product deleted successfully');
      }
    }
    
  } catch (error) {
    console.log('❌ Products CRUD test failed:', error.response?.data || error.message);
  }
}

async function testCategoriesCRUD() {
  console.log('\n📂 Testing Categories CRUD...');
  
  try {
    // Create category
    console.log('📝 Creating category...');
    const createResponse = await axios.post(`${baseURL}/api/categories`, {
      name: 'Test Category',
      description: 'Test category description',
      sort_order: 1
    }, {
      headers: { 'Authorization': `Bearer ${authToken}` }
    });
    
    if (createResponse.data.success) {
      const categoryId = createResponse.data.data.id;
      console.log('✅ Category created:', categoryId);
      
      // Read category
      console.log('📖 Reading category...');
      const readResponse = await axios.get(`${baseURL}/api/categories/${categoryId}`);
      if (readResponse.data.success) {
        console.log('✅ Category read successfully');
      }
      
      // Update category
      console.log('✏️  Updating category...');
      const updateResponse = await axios.put(`${baseURL}/api/categories/${categoryId}`, {
        name: 'Updated Category',
        description: 'Updated description'
      }, {
        headers: { 'Authorization': `Bearer ${authToken}` }
      });
      
      if (updateResponse.data.success) {
        console.log('✅ Category updated successfully');
      }
    }
    
  } catch (error) {
    console.log('❌ Categories CRUD test failed:', error.response?.data || error.message);
  }
}

async function testOrdersCRUD() {
  console.log('\n📦 Testing Orders CRUD...');
  
  try {
    // Create order
    console.log('📝 Creating order...');
    const createResponse = await axios.post(`${baseURL}/api/orders`, {
      email: 'test@example.com',
      subtotal: 100.00,
      tax_amount: 13.00,
      shipping_amount: 10.00,
      total_amount: 123.00,
      shipping_address: {
        street: '123 Test St',
        city: 'Test City',
        country: 'CA'
      }
    }, {
      headers: { 'Authorization': `Bearer ${authToken}` }
    });
    
    if (createResponse.data.id) {
      const orderId = createResponse.data.id;
      console.log('✅ Order created:', orderId);
      
      // Read order
      console.log('📖 Reading order...');
      const readResponse = await axios.get(`${baseURL}/api/orders/${orderId}`, {
        headers: { 'Authorization': `Bearer ${authToken}` }
      });
      
      if (readResponse.data.id) {
        console.log('✅ Order read successfully');
      }
      
      // Update order status
      console.log('✏️  Updating order status...');
      const updateResponse = await axios.put(`${baseURL}/api/orders/${orderId}/status`, {
        status: 'confirmed'
      }, {
        headers: { 'Authorization': `Bearer ${authToken}` }
      });
      
      if (updateResponse.data.success) {
        console.log('✅ Order status updated successfully');
      }
    }
    
  } catch (error) {
    console.log('❌ Orders CRUD test failed:', error.response?.data || error.message);
  }
}

async function testPublicEndpoints() {
  console.log('\n🌐 Testing Public Endpoints...');
  
  try {
    // Test public products endpoint
    console.log('📦 Testing public products...');
    const productsResponse = await axios.get(`${baseURL}/api/products`);
    if (productsResponse.data.success) {
      console.log('✅ Public products endpoint working');
    }
    
    // Test public categories endpoint
    console.log('📂 Testing public categories...');
    const categoriesResponse = await axios.get(`${baseURL}/api/categories`);
    if (categoriesResponse.data.success) {
      console.log('✅ Public categories endpoint working');
    }
    
  } catch (error) {
    console.log('❌ Public endpoints test failed:', error.response?.data || error.message);
  }
}

async function testSecurity() {
  console.log('\n🛡️  Testing Security...');
  
  try {
    // Test unauthorized access to admin endpoints
    console.log('🚫 Testing unauthorized admin access...');
    try {
      await axios.get(`${baseURL}/api/admin/dashboard`);
      console.log('❌ SECURITY ISSUE: Admin endpoint accessible without token');
    } catch (error) {
      if (error.response && error.response.status === 401) {
        console.log('✅ Security working: Unauthorized access blocked');
      }
    }
    
    // Test invalid token
    console.log('🔑 Testing invalid token...');
    try {
      await axios.get(`${baseURL}/api/admin/dashboard`, {
        headers: { 'Authorization': 'Bearer invalid-token' }
      });
      console.log('❌ SECURITY ISSUE: Admin endpoint accessible with invalid token');
    } catch (error) {
      if (error.response && error.response.status === 401) {
        console.log('✅ Security working: Invalid token blocked');
      }
    }
    
  } catch (error) {
    console.log('❌ Security test failed:', error.response?.data || error.message);
  }
}

async function runAllTests() {
  console.log('🧪 Starting Comprehensive CRUD Validation Tests...\n');
  
  const isAdminLoggedIn = await loginAdmin();
  if (!isAdminLoggedIn) {
    console.log('❌ Cannot proceed with tests - admin login failed');
    return;
  }
  
  await testPublicEndpoints();
  await testProductsCRUD();
  await testCategoriesCRUD();
  await testOrdersCRUD();
  await testSecurity();
  
  console.log('\n🎉 CRUD Validation Tests Complete!');
}

// Run tests
if (require.main === module) {
  require('dotenv').config({ path: '.env.local' });
  runAllTests();
}

module.exports = { runAllTests };
