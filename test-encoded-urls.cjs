const https = require('https');
const http = require('http');

async function testImageUrl(url) {
  return new Promise((resolve) => {
    const client = url.startsWith('https') ? https : http;
    
    const request = client.request(url, { method: 'HEAD', timeout: 5000 }, (response) => {
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

async function testEncodedUrls() {
  const testUrls = [
    'https://azpgqsmgyorjbqsgxuxw.supabase.co/storage/v1/object/public/product-images/food%26beverages/banku-mix.png',
    'https://azpgqsmgyorjbqsgxuxw.supabase.co/storage/v1/object/public/product-images/food%26beverages/barbeque.png',
    'https://azpgqsmgyorjbqsgxuxw.supabase.co/storage/v1/object/public/product-images/food%26beverages/chicken.png',
    'https://azpgqsmgyorjbqsgxuxw.supabase.co/storage/v1/object/public/product-images/food%26beverages/meat-pie.png',
    'https://azpgqsmgyorjbqsgxuxw.supabase.co/storage/v1/object/public/product-images/boys-dashiki.jpg',
    'https://azpgqsmgyorjbqsgxuxw.supabase.co/storage/v1/object/public/product-images/girls-dashiki.jpg'
  ];
  
  console.log('🔍 Testing encoded image URL accessibility...');
  
  for (const url of testUrls) {
    const result = await testImageUrl(url);
    
    if (result.accessible) {
      console.log(`✅ ${result.status} - ${result.contentType}`);
    } else {
      console.log(`❌ ${result.status}`);
    }
    console.log(`   ${result.url.substring(0, 80)}...`);
  }
}

testEncodedUrls();
