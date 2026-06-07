// Verify stationery products and their images
const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: './frontend/.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function verifyStationeryProducts() {
  console.log('🔍 Verifying stationery products and images...\n');

  // Get stationery category
  const { data: category, error: catError } = await supabase
    .from('categories')
    .select('*')
    .eq('slug', 'stationery')
    .single();

  if (catError) {
    console.error('❌ Error fetching stationery category:', catError.message);
    return;
  }

  console.log(`✅ Stationery Category: ${category.name} (ID: ${category.id})`);

  // Get stationery products
  const { data: products, error: prodError } = await supabase
    .from('products')
    .select('id, name, slug, images, price, status')
    .eq('category_id', category.id);

  if (prodError) {
    console.error('❌ Error fetching stationery products:', prodError.message);
    return;
  }

  console.log(`\n✅ Found ${products.length} stationery products:\n`);

  for (const product of products) {
    console.log(`📦 ${product.name}`);
    console.log(`   Slug: ${product.slug}`);
    console.log(`   Price: GHS ${product.price}`);
    console.log(`   Status: ${product.status}`);
    console.log(`   Image path: ${product.images?.[0] || 'none'}`);
    
    // Construct full URL
    if (product.images?.[0]) {
      const imageUrl = `${supabaseUrl}/storage/v1/object/public/product-images/${product.images[0]}`;
      console.log(`   Full URL: ${imageUrl}`);
      
      // Test accessibility
      try {
        const response = await fetch(imageUrl, { method: 'HEAD' });
        console.log(`   Accessibility: ${response.status} ${response.statusText}`);
      } catch (error) {
        console.log(`   Accessibility: Failed - ${error.message}`);
      }
    }
    console.log('');
  }

  // Also check books & media products
  console.log('\n🔍 Verifying books & media products...\n');

  const { data: booksCategory, error: booksCatError } = await supabase
    .from('categories')
    .select('*')
    .eq('slug', 'books-media')
    .single();

  if (!booksCatError && booksCategory) {
    console.log(`✅ Books & Media Category: ${booksCategory.name} (ID: ${booksCategory.id})`);

    const { data: booksProducts, error: booksProdError } = await supabase
      .from('products')
      .select('id, name, slug, images, price, status')
      .eq('category_id', booksCategory.id);

    if (!booksProdError && booksProducts) {
      console.log(`\n✅ Found ${booksProducts.length} books & media products:\n`);

      for (const product of booksProducts) {
        console.log(`📚 ${product.name}`);
        console.log(`   Image path: ${product.images?.[0] || 'none'}`);
        
        if (product.images?.[0]) {
          const imageUrl = `${supabaseUrl}/storage/v1/object/public/product-images/${product.images[0]}`;
          console.log(`   Full URL: ${imageUrl}`);
          
          try {
            const response = await fetch(imageUrl, { method: 'HEAD' });
            console.log(`   Accessibility: ${response.status} ${response.statusText}`);
          } catch (error) {
            console.log(`   Accessibility: Failed - ${error.message}`);
          }
        }
        console.log('');
      }
    }
  }

  console.log('✅ Verification complete');
}

verifyStationeryProducts();
