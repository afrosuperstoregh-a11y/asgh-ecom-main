const { createClient } = require('@supabase/supabase-js');

// Initialize Supabase client with service role key for admin access
const supabaseUrl = 'https://azpgqsmgyorjbqsgxuxw.supabase.co';
const serviceRoleKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImF6cGdxc21neW9yamJxc2d4dXh3Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2OTI5ODU2MCwiZXhwIjoyMDg0ODc0NTYwfQ.A-gUiUyjt9XWxwB2mCfWScOGDCbSGmm-zXt2G5Xseh0';

const supabase = createClient(supabaseUrl, serviceRoleKey);

async function testStorageAccess() {
  console.log('Testing storage access with service role key...\n');
  
  try {
    // List files in food&beverages folder
    console.log('Checking food&beverages folder...');
    const { data, error } = await supabase.storage
      .from('product-images')
      .list('food&beverages', {
        limit: 100
      });
    
    if (error) {
      console.error('Error listing files:', error);
      return;
    }
    
    console.log(`Found ${data.length} files in food&beverages folder:\n`);
    
    if (data.length === 0) {
      console.log('No files found in food&beverages folder');
    } else {
      data.forEach((file, index) => {
        console.log(`${index + 1}. ${file.name} (${file.size} bytes) - ${file.created_at}`);
      });
      
      // Test public URLs for first few files
      console.log('\nTesting public URLs for first 3 files:');
      const testFiles = data.slice(0, 3);
      
      for (const file of testFiles) {
        const filePath = `food&beverages/${file.name}`;
        const { data: urlData } = supabase.storage
          .from('product-images')
          .getPublicUrl(filePath);
        
        console.log(`\nFile: ${file.name}`);
        console.log(`Public URL: ${urlData.publicUrl}`);
      }
    }
    
  } catch (err) {
    console.error('Unexpected error:', err);
  }
}

async function checkProducts() {
  console.log('\n\nChecking products with food/beverage categories...\n');
  
  try {
    // First get all categories to see what's available
    const { data: categories, error: catError } = await supabase
      .from('categories')
      .select('id, name')
      .ilike('name', '%food%')
      .or('name.ilike.%beverage%');
    
    if (catError) {
      console.error('Error fetching categories:', catError);
    } else {
      console.log(`Found ${categories.length} food/beverage categories:`);
      categories.forEach((cat, index) => {
        console.log(`${index + 1}. ${cat.name} (ID: ${cat.id})`);
      });
    }
    
    // Now get products in these categories
    const { data, error } = await supabase
      .from('products')
      .select(`
        id, 
        name, 
        images, 
        image_url,
        category_id,
        categories!inner(
          id, 
          name
        )
      `)
      .ilike('categories.name', '%food%');
    
    if (error) {
      console.error('Error fetching products:', error);
      return;
    }
    
    console.log(`\nFound ${data.length} products in food categories:\n`);
    
    data.forEach((product, index) => {
      console.log(`${index + 1}. ${product.name}`);
      console.log(`   Category: ${product.categories?.name || 'N/A'}`);
      console.log(`   Images: ${product.images?.length || 0}`);
      console.log(`   Image URL: ${product.image_url || 'N/A'}`);
      
      // Test image URL if available
      if (product.image_url) {
        console.log(`   Testing image URL: ${product.image_url}`);
      }
      console.log('');
    });
    
  } catch (err) {
    console.error('Unexpected error:', err);
  }
}

async function main() {
  await testStorageAccess();
  await checkProducts();
}

main();
