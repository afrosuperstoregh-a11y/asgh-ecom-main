// Simulate the fixed getProductImageUrl function
function getProductImageUrl(image, fallback = '/placeholder-product.jpg') {
  if (!image || typeof image !== 'string') {
    return fallback;
  }

  // If it's already a full URL, return as-is
  if (image.startsWith('http')) {
    return image;
  }

  const supabaseUrl = 'https://azpgqsmgyorjbqsgxuxw.supabase.co';
  
  if (supabaseUrl) {
    // Remove leading slash if present
    let cleanPath = image.startsWith('/') ? image.slice(1) : image;
    
    // Check if it's already a full storage path
    if (cleanPath.includes('storage/v1/object/public/')) {
      return image.startsWith('/') ? `${supabaseUrl}${image}` : `${supabaseUrl}/${image}`;
    }
    
    // Remove 'product-images/' prefix if it exists to avoid duplication
    if (cleanPath.startsWith('product-images/')) {
      cleanPath = cleanPath.replace('product-images/', '');
    }
    
    // Encode special characters in path (especially & in folder names)
    const encodedPath = cleanPath.split('/').map(encodeURIComponent).join('/');
    
    return `${supabaseUrl}/storage/v1/object/public/product-images/${encodedPath}`;
  }

  return image;
}

function testFixedUrls() {
  console.log('🔧 Testing fixed image URL generation...');
  
  const testCases = [
    'food&beverages/banku-mix.png',
    'food&beverages/barbeque.png', 
    'food&beverages/chicken.png',
    'food&beverages/meat-pie.png',
    'boys-dashiki.jpg',
    'girls-dashiki.jpg',
    'https://azpgqsmgyorjbqsgxuxw.supabase.co/storage/v1/object/public/product-images/boys-dashiki.jpg',
    'product-images/food&beverages/banku-mix.png'
  ];
  
  for (const testCase of testCases) {
    const result = getProductImageUrl(testCase);
    console.log(`\n📝 Input: ${testCase}`);
    console.log(`🌐 Output: ${result}`);
  }
}

testFixedUrls();
