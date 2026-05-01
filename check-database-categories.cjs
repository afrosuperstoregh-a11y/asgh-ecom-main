const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(
  'https://azpgqsmgyorjbqsgxuxw.supabase.co',
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImF6cGdxc21neW9yamJxc2d4dXh3Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjkyOTg1NjAsImV4cCI6MjA4NDg3NDU2MH0.cxHD8ihT9E5ZAxtkfGa2VjYxYmadbYxyl3xVDPtgh9Q'
);

async function checkDatabaseCategories() {
  try {
    console.log('🔍 Checking database categories and product relationships...');
    
    // Check all categories
    const { data: categories, error: categoriesError } = await supabase
      .from('categories')
      .select('*')
      .order('name');
    
    if (categoriesError) {
      console.log('❌ Error fetching categories:', categoriesError.message);
      return;
    }
    
    console.log(`\n📂 Found ${categories.length} categories:`);
    categories.forEach((category, index) => {
      console.log(`  ${index + 1}. ${category.name} (ID: ${category.id}, Slug: ${category.slug})`);
    });
    
    // Find food & beverages category
    const foodCategory = categories.find(c => 
      c.name.toLowerCase().includes('food') || 
      c.slug.toLowerCase().includes('food')
    );
    
    if (!foodCategory) {
      console.log('\n❌ No food & beverages category found!');
      return;
    }
    
    console.log(`\n🍽️ Food & Beverages category: ${foodCategory.name} (ID: ${foodCategory.id})`);
    
    // Check products in food & beverages category
    const { data: foodProducts, error: foodProductsError } = await supabase
      .from('products')
      .select('id, name, price, category_id, status')
      .eq('category_id', foodCategory.id)
      .eq('status', 'active')
      .order('name');
    
    if (foodProductsError) {
      console.log('❌ Error fetching food products:', foodProductsError.message);
      return;
    }
    
    console.log(`\n📦 Found ${foodProducts.length} products in food & beverages category:`);
    foodProducts.forEach((product, index) => {
      console.log(`  ${index + 1}. ${product.name} - $${product.price} (Category ID: ${product.category_id})`);
    });
    
    // Check if there are products with food-related names but different categories
    const { data: allProducts, error: allProductsError } = await supabase
      .from('products')
      .select('id, name, price, category_id, status')
      .eq('status', 'active')
      .order('name');
    
    if (allProductsError) {
      console.log('❌ Error fetching all products:', allProductsError.message);
      return;
    }
    
    const foodRelatedProducts = allProducts.filter(p => {
      const name = (p.name || '').toLowerCase();
      return name.includes('food') || 
             name.includes('rice') ||
             name.includes('stew') ||
             name.includes('jollof') ||
             name.includes('kenkey') ||
             name.includes('waakye') ||
             name.includes('banku') ||
             name.includes('shito') ||
             name.includes('gari') ||
             name.includes('kelewele') ||
             name.includes('plantain') ||
             name.includes('soup') ||
             name.includes('egusi') ||
             name.includes('fufu');
    });
    
    console.log(`\n🔍 Found ${foodRelatedProducts.length} products with food-related names:`);
    
    const wrongCategoryProducts = foodRelatedProducts.filter(p => p.category_id !== foodCategory.id);
    
    if (wrongCategoryProducts.length > 0) {
      console.log(`\n❌ ${wrongCategoryProducts.length} food products in wrong categories:`);
      wrongCategoryProducts.forEach((product, index) => {
        const categoryName = categories.find(c => c.id === product.category_id)?.name || 'Unknown';
        console.log(`  ${index + 1}. ${product.name} - Category: ${categoryName} (ID: ${product.category_id})`);
      });
      
      console.log(`\n💡 Solution: Move these products to the Food & Beverages category (ID: ${foodCategory.id})`);
    } else {
      console.log(`\n✅ All food-related products are in the correct category!`);
    }
    
    return { categories, foodCategory, foodProducts, foodRelatedProducts, wrongCategoryProducts };
    
  } catch (error) {
    console.log('❌ Error:', error.message);
    return { categories: [], foodCategory: null, foodProducts: [], foodRelatedProducts: [], wrongCategoryProducts: [] };
  }
}

checkDatabaseCategories();
