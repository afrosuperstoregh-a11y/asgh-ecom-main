const { createClient } = require('@supabase/supabase-js');

// Supabase configuration
const supabaseUrl = 'https://azpgqsmgyorjbqsgxuxw.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImF6cGdxc21neW9yamJxc2d4dXh3Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjkyOTg1NjAsImV4cCI6MjA4NDg3NDU2MH0.cxHD8ihT9E5ZAxtkfGa2VjYxYmadbYxyl3xVDPtgh9Q';

const supabase = createClient(supabaseUrl, supabaseKey);

function encodeUrlPath(path) {
  return path.split('/').map(encodeURIComponent).join('/');
}

function testUrlEncoding() {
  console.log('🔍 Analyzing URL encoding issues...');
  
  const problemUrls = [
    'food&beverages/banku-mix.png',
    'food&beverages/barbeque.png',
    'boys-dashiki.jpg',
    'girls-dashiki.jpg'
  ];
  
  for (const path of problemUrls) {
    console.log(`\n📁 Original path: ${path}`);
    
    const encoded = encodeUrlPath(path);
    console.log(`🔐 Encoded path: ${encoded}`);
    
    const fullUrl = `${supabaseUrl}/storage/v1/object/public/product-images/${encoded}`;
    console.log(`🌐 Full URL: ${fullUrl}`);
    
    // Test different encoding approaches
    const simpleEncoded = path.replace(/&/g, '%26');
    const simpleUrl = `${supabaseUrl}/storage/v1/object/public/product-images/${simpleEncoded}`;
    console.log(`🔐 Simple encoded: ${simpleUrl}`);
  }
}

testUrlEncoding();
