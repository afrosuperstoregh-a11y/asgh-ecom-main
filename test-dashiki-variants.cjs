const https = require('https');

async function testImageUrl(url) {
  return new Promise((resolve) => {
    const request = https.request(url, { method: 'HEAD', timeout: 5000 }, (response) => {
      resolve({
        url,
        status: response.statusCode,
        contentType: response.headers['content-type'],
        accessible: response.statusCode < 400
      });
    });
    
    request.on('error', () => {
      resolve({
        url,
        status: 'ERROR',
        contentType: null,
        accessible: false
      });
    });
    
    request.on('timeout', () => {
      request.destroy();
      resolve({
        url,
        status: 'TIMEOUT',
        contentType: null,
        accessible: false
      });
    });
    
    request.end();
  });
}

async function testDashikiVariants() {
  const baseUrl = 'https://azpgqsmgyorjbqsgxuxw.supabase.co/storage/v1/object/public/product-images';
  
  const testUrls = [
    `${baseUrl}/boys-dashiki.jpg`,
    `${baseUrl}/girls-dashiki.jpg`,
    `${baseUrl}/boys-dashiki.png`,
    `${baseUrl}/girls-dashiki.png`,
    `${baseUrl}/boys-dashiki.jpeg`,
    `${baseUrl}/girls-dashiki.jpeg`,
    `${baseUrl}/clothing/boys-dashiki.jpg`,
    `${baseUrl}/clothing/girls-dashiki.jpg`,
    `${baseUrl}/dashiki/boys-dashiki.jpg`,
    `${baseUrl}/dashiki/girls-dashiki.jpg`
  ];
  
  console.log('🔍 Testing different dashiki file paths...');
  
  for (const url of testUrls) {
    const result = await testImageUrl(url);
    
    if (result.accessible) {
      console.log(`✅ FOUND: ${result.status} - ${result.contentType}`);
      console.log(`   ${url}`);
    } else {
      console.log(`❌ ${result.status}`);
    }
  }
}

testDashikiVariants();
