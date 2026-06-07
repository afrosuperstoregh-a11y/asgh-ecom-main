// Fix books & media product image paths to use relative paths
const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: './frontend/.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function fixBooksMediaImagePaths() {
  console.log('🔍 Fixing books & media product image paths...\n');

  // Get books & media category
  const { data: category, error: catError } = await supabase
    .from('categories')
    .select('*')
    .eq('slug', 'books-media')
    .single();

  if (catError) {
    console.error('❌ Error fetching books & media category:', catError.message);
    return;
  }

  console.log(`✅ Books & Media Category: ${category.name} (ID: ${category.id})`);

  // Get books & media products
  const { data: products, error: prodError } = await supabase
    .from('products')
    .select('id, name, images')
    .eq('category_id', category.id);

  if (prodError) {
    console.error('❌ Error fetching books & media products:', prodError.message);
    return;
  }

  console.log(`\n✅ Found ${products.length} books & media products to fix:\n`);

  for (const product of products) {
    console.log(`📚 ${product.name}`);
    console.log(`   Current image path: ${product.images?.[0] || 'none'}`);
    
    if (product.images?.[0]) {
      // Extract relative path from full URL
      const fullPath = product.images[0];
      let relativePath = fullPath;
      
      // If it's a full Supabase URL, extract the path after /storage/v1/object/public/product-images/
      if (fullPath.includes('storage/v1/object/public/product-images/')) {
        relativePath = fullPath.split('storage/v1/object/public/product-images/')[1];
      }
      
      console.log(`   New relative path: ${relativePath}`);
      
      // Update the product with the relative path
      const { error: updateError } = await supabase
        .from('products')
        .update({ images: [relativePath] })
        .eq('id', product.id);
      
      if (updateError) {
        console.error(`   ❌ Error updating: ${updateError.message}`);
      } else {
        console.log(`   ✅ Updated successfully`);
      }
    }
    console.log('');
  }

  console.log('✅ Fix complete');
}

fixBooksMediaImagePaths();
