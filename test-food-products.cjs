const { createClient } = require('@supabase/supabase-js');

// Initialize Supabase client with service role key for admin access
const supabaseUrl = 'https://azpgqsmgyorjbqsgxuxw.supabase.co';
const serviceRoleKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImF6cGdxc21neW9yamJxc2d4dXh3Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2OTI5ODU2MCwiZXhwIjoyMDg0ODc0NTYwfQ.A-gUiUyjt9XWxwB2mCfWScOGDCbSGmm-zXt2G5Xseh0';

const supabase = createClient(supabaseUrl, serviceRoleKey);

async function checkFoodProducts() {
  console.log('Checking products in Food & Beverages category...\n');
  
  try {
    // First, let's see the actual columns in the products table
    console.log('Checking products table structure...');
    const { data: columns, error: colError } = await supabase
      .from('products')
      .select('*')
      .limit(1);
    
    if (colError) {
      console.error('Error getting table structure:', colError);
      return;
    }
    
    if (columns.length > 0) {
      console.log('Available columns:', Object.keys(columns[0]));
    }
    
    // Now get products in Food & Beverages category
    const { data, error } = await supabase
      .from('products')
      .select(`
        id, 
        name, 
        images, 
        category_id,
        categories!inner(
          id, 
          name
        )
      `)
      .eq('categories.name', 'Food & Beverages')
      .limit(10);
    
    if (error) {
      console.error('Error fetching products:', error);
      return;
    }
    
    console.log(`\nFound ${data.length} products in Food & Beverages category:\n`);
    
    data.forEach((product, index) => {
      console.log(`${index + 1}. ${product.name}`);
      console.log(`   Category: ${product.categories?.name || 'N/A'}`);
      console.log(`   Images: ${product.images?.length || 0}`);
      console.log(`   Category ID: ${product.category_id}`);
      
      if (product.images && product.images.length > 0) {
        console.log(`   First image: ${product.images[0]}`);
        
        // Test if the image URL works
        const imageUrl = `https://azpgqsmgyorjbqsgxuxw.supabase.co/storage/v1/object/public/product-images/${product.images[0]}`;
        console.log(`   Full URL: ${imageUrl}`);
      }
      console.log('');
    });
    
  } catch (err) {
    console.error('Unexpected error:', err);
  }
}

async function testImageUrls() {
  console.log('\n\nTesting some specific image URLs...\n');
  
  const testImages = [
    'food&beverages/all-ghanaian-foods-party-orders-1.jpg',
    'food&beverages/banku-with-tilapia-1.jpg',
    'food&beverages/jollof-rice.jpg'
  ];
  
  for (const imagePath of testImages) {
    const imageUrl = `https://azpgqsmgyorjbqsgxuxw.supabase.co/storage/v1/object/public/product-images/${imagePath}`;
    console.log(`Testing: ${imagePath}`);
    console.log(`URL: ${imageUrl}`);
    
    try {
      const response = await fetch(imageUrl, { method: 'HEAD' });
      console.log(`Status: ${response.status} ${response.statusText}`);
      
      if (response.ok) {
        console.log('✓ Image is accessible');
      } else {
        console.log('✗ Image is not accessible');
      }
    } catch (error) {
      console.log(`✗ Error accessing image: ${error.message}`);
    }
    
    console.log('');
  }
}

async function main() {
  await checkFoodProducts();
  await testImageUrls();
}

main();
