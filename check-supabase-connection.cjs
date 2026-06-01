const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: 'frontend/.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error('❌ Missing Supabase credentials');
  process.exit(1);
}

console.log('🔍 Checking Supabase connection...');
console.log('URL:', supabaseUrl);

const supabase = createClient(supabaseUrl, supabaseKey);

async function checkConnection() {
  try {
    // Test connection by checking categories
    const { data: categories, error: catError } = await supabase
      .from('categories')
      .select('id, name, slug')
      .order('id');
    
    if (catError) {
      console.error('❌ Categories query error:', catError.message);
      return;
    }
    
    console.log('✅ Supabase connection successful');
    console.log(`📊 Found ${categories.length} categories`);
    categories.forEach(cat => {
      console.log(`   - ${cat.name} (slug: ${cat.slug})`);
    });
    
    // Check products
    const { data: products, error: prodError } = await supabase
      .from('products')
      .select('id, name, category_id, images')
      .limit(20);
    
    if (prodError) {
      console.error('❌ Products query error:', prodError.message);
      return;
    }
    
    console.log(`\n📦 Found ${products.length} products`);
    
    // Group by category
    const byCategory = {};
    products.forEach(prod => {
      if (!byCategory[prod.category_id]) {
        byCategory[prod.category_id] = [];
      }
      byCategory[prod.category_id].push(prod);
    });
    
    console.log('\n📋 Products by category:');
    for (const [catId, prods] of Object.entries(byCategory)) {
      const cat = categories.find(c => c.id === parseInt(catId));
      const catName = cat ? cat.name : `Unknown (${catId})`;
      console.log(`   ${catName}: ${prods.length} products`);
    }
    
    // Check for books and stationery specifically
    const booksCat = categories.find(c => c.slug === 'books-media' || c.name.toLowerCase().includes('book'));
    const stationeryCat = categories.find(c => c.slug === 'stationery' || c.name.toLowerCase().includes('stationery'));
    
    console.log('\n🔍 Specific categories:');
    if (booksCat) {
      const booksProducts = products.filter(p => p.category_id === booksCat.id);
      console.log(`   Books & Media: ${booksProducts.length} products`);
      booksProducts.forEach(p => console.log(`      - ${p.name}`));
    } else {
      console.log('   ❌ Books & Media category not found');
    }
    
    if (stationeryCat) {
      const stationeryProducts = products.filter(p => p.category_id === stationeryCat.id);
      console.log(`   Stationery: ${stationeryProducts.length} products`);
      stationeryProducts.forEach(p => console.log(`      - ${p.name}`));
    } else {
      console.log('   ❌ Stationery category not found');
    }
    
    // Get all products for stationery category if it exists
    if (stationeryCat) {
      const { data: allStationeryProducts, error: stationeryError } = await supabase
        .from('products')
        .select('name, price')
        .eq('category_id', stationeryCat.id);
      
      if (!stationeryError && allStationeryProducts) {
        console.log(`\n   All Stationery products in database: ${allStationeryProducts.length}`);
        allStationeryProducts.forEach(p => console.log(`      - ${p.name} (GHS ${p.price})`));
      }
    }
    
  } catch (error) {
    console.error('❌ Connection error:', error.message);
  }
}

checkConnection();
