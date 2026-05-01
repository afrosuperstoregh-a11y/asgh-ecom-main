const { createClient } = require('@supabase/supabase-js');

// Initialize Supabase client
const supabaseUrl = 'https://azpgqsmgyorjbqsgxuxw.supabase.co';
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImF6cGdxc21neW9yamJxc2d4dXh3Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjkyOTg1NjAsImV4cCI6MjA4NDg3NDU2MH0.cxHD8ihT9E5ZAxtkfGa2VjYxYmadbYxyl3xVDPtgh9Q';

const supabase = createClient(supabaseUrl, supabaseAnonKey);

async function checkFoodBeverageImages() {
  console.log('Checking food & beverages images in Supabase storage...\n');
  
  try {
    // List files in food&beverages folder
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
    }
    
    // Check if we can get public URLs for these files
    console.log('\nTesting public URLs for first 5 files:');
    const testFiles = data.slice(0, 5);
    
    for (const file of testFiles) {
      const filePath = `food&beverages/${file.name}`;
      const { data: urlData } = supabase.storage
        .from('product-images')
        .getPublicUrl(filePath);
      
      console.log(`\nFile: ${file.name}`);
      console.log(`Public URL: ${urlData.publicUrl}`);
      
      // Test if URL is accessible
      try {
        const response = await fetch(urlData.publicUrl, { method: 'HEAD' });
        console.log(`Status: ${response.status} ${response.statusText}`);
      } catch (fetchError) {
        console.log(`Error accessing URL: ${fetchError.message}`);
      }
    }
    
  } catch (err) {
    console.error('Unexpected error:', err);
  }
}

// Check products with food & beverages category
async function checkFoodBeverageProducts() {
  console.log('\n\nChecking products in food & beverages category...\n');
  
  try {
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
      .ilike('categories.name', '%food%')
      .or('categories.name.ilike.%beverage%');
    
    if (error) {
      console.error('Error fetching products:', error);
      return;
    }
    
    console.log(`Found ${data.length} products in food & beverages categories:\n`);
    
    data.forEach((product, index) => {
      console.log(`${index + 1}. ${product.name}`);
      console.log(`   Category: ${product.categories?.name || 'N/A'}`);
      console.log(`   Images: ${product.images?.length || 0}`);
      console.log(`   Image URL: ${product.image_url || 'N/A'}`);
      console.log('');
    });
    
  } catch (err) {
    console.error('Unexpected error:', err);
  }
}

async function main() {
  await checkFoodBeverageImages();
  await checkFoodBeverageProducts();
}

main();
