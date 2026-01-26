// Test script to verify API routes work locally
const http = require('http');

function testEndpoint(path, method = 'GET', data = null) {
  return new Promise((resolve, reject) => {
    let postData = '';
    if (data) {
      postData = JSON.stringify(data);
    }

    const options = {
      hostname: 'localhost',
      port: 3000, // Next.js default port
      path: path,
      method: method,
      headers: {
        'Content-Type': 'application/json',
        ...(data && { 'Content-Length': Buffer.byteLength(postData) })
      }
    };

    const req = http.request(options, (res) => {
      let responseData = '';
      
      res.on('data', (chunk) => {
        responseData += chunk;
      });
      
      res.on('end', () => {
        resolve({
          status: res.statusCode,
          data: responseData
        });
      });
    });

    req.on('error', (e) => {
      reject(e);
    });

    if (data) {
      req.write(postData);
    }
    req.end();
  });
}

async function runTests() {
  console.log('Testing Local API Endpoints...\n');

  try {
    // Test health endpoint
    console.log('1. Testing /api/health');
    try {
      const healthResult = await testEndpoint('/api/health');
      console.log(`Status: ${healthResult.status}`);
      console.log(`Response: ${healthResult.data}\n`);
    } catch (error) {
      console.log(`Error: ${error.message}\n`);
    }

    // Test admin login
    console.log('2. Testing /api/admin/auth/login');
    try {
      const loginResult = await testEndpoint('/api/admin/auth/login', 'POST', {
        email: 'info@afrosuperstore.ca',
        password: 'Iamtech@100'
      });
      console.log(`Status: ${loginResult.status}`);
      console.log(`Response: ${loginResult.data}\n`);
    } catch (error) {
      console.log(`Error: ${error.message}\n`);
    }

    // Test analytics
    console.log('3. Testing /api/analytics');
    try {
      const analyticsResult = await testEndpoint('/api/analytics');
      console.log(`Status: ${analyticsResult.status}`);
      console.log(`Response: ${analyticsResult.data.substring(0, 100)}...\n`);
    } catch (error) {
      console.log(`Error: ${error.message}\n`);
    }

    console.log('✅ Local tests completed!');

  } catch (error) {
    console.error('❌ Error testing endpoints:', error);
  }
}

runTests();
