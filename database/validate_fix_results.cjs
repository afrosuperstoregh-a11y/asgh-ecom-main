const { createClient } = require('@supabase/supabase-js');

// Use anon key for read operations
const supabase = createClient(
  'https://azpgqsmgyorjbqsgxuxw.supabase.co',
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImF6cGdxc21neW9yamJxc2d4dXh3Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjkyOTg1NjAsImV4cCI6MjA4NDg3NDU2MH0.cxHD8ihT9E5ZAxtkfGa2VjYxYmadbYxyl3xVDPtgh9Q'
);

async function validateFixResults() {
  try {
    console.log('🔍 Validating Product Category Fix Results...\n');
    
    // Check category counts
    console.log('📊 Step 1: Checking category product counts...');
    const { data: categories, error: categoriesError } = await supabase
      .from('categories')
      .select('id, name')
      .order('name');
    
    if (categoriesError) {
      console.error('❌ Error fetching categories:', categoriesError.message);
      return;
    }
    
    for (const category of categories) {
      const { count, error: countError } = await supabase
        .from('products')
        .select('*', { count: 'exact', head: true })
        .eq('category_id', category.id)
        .eq('status', 'active');
      
      if (!countError) {
        const status = count === 0 ? '⚠️' : count < 5 ? '⚠️' : '✅';
        console.log(`${status} ${category.name}: ${count} products`);
      }
    }
    
    // Check uncategorized products
    console.log('\n📦 Step 2: Checking uncategorized products...');
    const { data: uncategorized, error: uncategorizedError } = await supabase
      .from('products')
      .select('id, name, price')
      .is('category_id', null)
      .eq('status', 'active')
      .order('name');
    
    if (uncategorizedError) {
      console.error('❌ Error checking uncategorized products:', uncategorizedError.message);
    } else {
      if (uncategorized.length === 0) {
        console.log('✅ No uncategorized products found!');
      } else {
        console.log(`⚠️ Found ${uncategorized.length} uncategorized products:`);
        uncategorized.forEach(p => console.log(`   - ${p.name}`));
      }
    }
    
    // Check Food & Beverages specifically
    console.log('\n🍽️ Step 3: Checking Food & Beverages category...');
    const { count: foodCount, data: foodProducts } = await supabase
      .from('products')
      .select('id, name, price')
      .eq('category_id', 9)
      .eq('status', 'active')
      .order('name');
    
    console.log(`✅ Food & Beverages now has ${foodCount} products`);
    
    if (foodCount >= 40) {
      console.log('🎉 SUCCESS: Food & Beverages category is properly populated!');
    } else {
      console.log('⚠️ WARNING: Food & Beverages may still need more products');
    }
    
    // Show sample Food & Beverages products
    console.log('\n📋 Sample Food & Beverages products:');
    foodProducts.slice(0, 10).forEach(p => {
      console.log(`   - ${p.name} - $${p.price}`);
    });
    if (foodCount > 10) {
      console.log(`   ... and ${foodCount - 10} more`);
    }
    
    // Check fashion categories
    console.log('\n👔 Step 4: Checking fashion categories...');
    
    const { count: menCount } = await supabase
      .from('products')
      .select('*', { count: 'exact', head: true })
      .eq('category_id', 2)
      .eq('status', 'active');
    
    const { count: womenCount } = await supabase
      .from('products')
      .select('*', { count: 'exact', head: true })
      .eq('category_id', 1)
      .eq('status', 'active');
    
    console.log(`👔 Men Fashion: ${menCount} products`);
    console.log(`👗 Women Fashion: ${womenCount} products`);
    
    // Overall summary
    console.log('\n📊 Step 5: Overall Summary');
    const { count: totalActive } = await supabase
      .from('products')
      .select('*', { count: 'exact', head: true })
      .eq('status', 'active');
    
    const { count: totalCategorized } = await supabase
      .from('products')
      .select('*', { count: 'exact', head: true })
      .eq('status', 'active')
      .not('category_id', 'is', null);
    
    console.log(`Total active products: ${totalActive}`);
    console.log(`Total categorized products: ${totalCategorized}`);
    console.log(`Categorization rate: ${((totalCategorized / totalActive) * 100).toFixed(1)}%`);
    
    // Success criteria
    console.log('\n🎯 Success Criteria Check:');
    const criteria = [
      { name: 'Food & Beverages has 40+ products', passed: foodCount >= 40, value: foodCount },
      { name: 'No uncategorized products', passed: uncategorized.length === 0, value: uncategorized.length },
      { name: 'Men Fashion has products', passed: menCount > 0, value: menCount },
      { name: 'Women Fashion has products', passed: womenCount > 0, value: womenCount },
      { name: '95%+ categorization rate', passed: (totalCategorized / totalActive) >= 0.95, value: ((totalCategorized / totalActive) * 100).toFixed(1) + '%' }
    ];
    
    let allPassed = true;
    criteria.forEach(c => {
      const status = c.passed ? '✅' : '❌';
      console.log(`${status} ${c.name}: ${c.value}`);
      if (!c.passed) allPassed = false;
    });
    
    if (allPassed) {
      console.log('\n🎉 ALL SUCCESS CRITERIA MET! Category fix completed successfully.');
    } else {
      console.log('\n⚠️ Some success criteria not met. Review results above.');
    }
    
  } catch (error) {
    console.error('❌ Validation error:', error.message);
  }
}

validateFixResults();
