const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(
  'https://azpgqsmgyorjbqsgxuxw.supabase.co',
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImF6cGdxc21neW9yamJxc2d4dXh3Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjkyOTg1NjAsImV4cCI6MjA4NDg3NDU2MH0.cxHD8ihT9E5ZAxtkfGa2VjYxYmadbYxyl3xVDPtgh9Q'
);

async function checkAllCategories() {
  try {
    console.log('🔍 Checking all categories and their products...');
    
    // Get all categories
    const { data: categories, error: categoriesError } = await supabase
      .from('categories')
      .select('*')
      .order('name');
    
    if (categoriesError) {
      console.log('❌ Error fetching categories:', categoriesError.message);
      return;
    }
    
    // Get all active products
    const { data: allProducts, error: productsError } = await supabase
      .from('products')
      .select('id, name, price, category_id, status')
      .eq('status', 'active')
      .order('name');
    
    if (productsError) {
      console.log('❌ Error fetching products:', productsError.message);
      return;
    }
    
    console.log(`\n📂 Found ${categories.length} categories and ${allProducts.length} active products\n`);
    
    // Check each category
    for (const category of categories) {
      const categoryProducts = allProducts.filter(p => p.category_id === category.id);
      console.log(`📁 ${category.name} (ID: ${category.id}) - ${categoryProducts.length} products:`);
      
      if (categoryProducts.length === 0) {
        console.log('   ⚠️  No products in this category');
      } else {
        categoryProducts.forEach((product, index) => {
          console.log(`   ${index + 1}. ${product.name} - $${product.price}`);
        });
      }
      console.log('');
    }
    
    // Check uncategorized products
    const uncategorized = allProducts.filter(p => !p.category_id);
    if (uncategorized.length > 0) {
      console.log(`❌ UNCATEGORIZED PRODUCTS (${uncategorized.length}):`);
      uncategorized.forEach((product, index) => {
        console.log(`   ${index + 1}. ${product.name} - $${product.price}`);
      });
    } else {
      console.log('✅ All products are categorized!');
    }
    
    // Summary
    console.log('\n📊 SUMMARY:');
    console.log(`- Total Categories: ${categories.length}`);
    console.log(`- Total Active Products: ${allProducts.length}`);
    console.log(`- Uncategorized Products: ${uncategorized.length}`);
    console.log(`- Categorized Products: ${allProducts.length - uncategorized.length}`);
    
    // Find categories with no products
    const emptyCategories = categories.filter(cat => {
      const catProducts = allProducts.filter(p => p.category_id === cat.id);
      return catProducts.length === 0;
    });
    
    if (emptyCategories.length > 0) {
      console.log(`\n⚠️  Categories with no products: ${emptyCategories.length}`);
      emptyCategories.forEach(cat => {
        console.log(`   - ${cat.name} (ID: ${cat.id})`);
      });
    }
    
  } catch (error) {
    console.log('❌ Error:', error.message);
  }
}

checkAllCategories();
