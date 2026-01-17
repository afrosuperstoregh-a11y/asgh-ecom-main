// Simple API test script
// Run with: node test-api.js

const http = require('http');

const BASE_URL = 'http://localhost:3001/api';

// Test endpoints
const tests = [
  {
    name: 'Health Check',
    method: 'GET',
    path: '/api/health'
  },
  {
    name: 'Get Products',
    method: 'GET',
    path: '/api/products'
  },
  {
    name: 'Get Categories',
    method: 'GET',
    path: '/api/products/categories'
  },
  {
    name: 'Get Featured Products',
    method: 'GET',
    path: '/api/products/featured'
  },
  {
    name: 'User Registration',
    method: 'POST',
    path: '/api/auth/register',
    data: {
      email: 'testuser@example.com',
      password: 'password123',
      name: 'Test User'
    }
  },
  {
    name: 'User Login',
    method: 'POST',
    path: '/api/auth/login',
    data: {
      email: 'test@example.com',
      password: 'password123'
    }
  }
];

function makeRequest(options) {
  return new Promise((resolve, reject) => {
    const url = `http://localhost:3001${options.path}`;
    const requestOptions = {
      method: options.method || 'GET',
      headers: {
        'Content-Type': 'application/json',
      }
    };

    const req = http.request(url, requestOptions, (res) => {
      let data = '';
      
      res.on('data', (chunk) => {
        data += chunk;
      });
      
      res.on('end', () => {
        try {
          const response = {
            status: res.statusCode,
            data: JSON.parse(data)
          };
          resolve(response);
        } catch (error) {
          resolve({
            status: res.statusCode,
            data: data
          });
        }
      });
    });

    req.on('error', (error) => {
      reject(error);
    });

    if (options.data) {
      req.write(JSON.stringify(options.data));
    }
    
    req.end();
  });
}

async function runTests() {
  console.log('🧪 Testing E-Commerce API\n');
  console.log('Make sure the server is running on http://localhost:3001\n');

  for (const test of tests) {
    try {
      console.log(`📋 ${test.name}...`);
      const response = await makeRequest(test);
      
      if (response.status >= 200 && response.status < 300) {
        console.log(`✅ ${test.name} - Status: ${response.status}`);
        if (response.data.data) {
          console.log(`   Response: ${JSON.stringify(response.data.data).substring(0, 100)}...`);
        }
      } else {
        console.log(`❌ ${test.name} - Status: ${response.status}`);
        console.log(`   Error: ${JSON.stringify(response.data)}`);
      }
    } catch (error) {
      console.log(`❌ ${test.name} - Error: ${error.message}`);
    }
    console.log(''); // Empty line for readability
  }

  console.log('🎉 API testing complete!');
  console.log('\n📚 Next steps:');
  console.log('1. Start the frontend application');
  console.log('2. Test the complete user flow');
  console.log('3. Set up Stripe webhooks for payments');
  console.log('4. Configure Typesense for advanced search');
}

// Check if server is running
function checkServer() {
  makeRequest({ path: '/api/health' })
    .then(() => {
      console.log('✅ Server is running!');
      runTests();
    })
    .catch(() => {
      console.log('❌ Server is not running on http://localhost:3001');
      console.log('Please start the server with: npm run dev');
      console.log('Then run this test script again.');
    });
}

checkServer();
