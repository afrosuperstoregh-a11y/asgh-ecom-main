const { createClient } = require('@supabase/supabase-js');

// Use service role key for write operations
const supabase = createClient(
  'https://azpgqsmgyorjbqsgxuxw.supabase.co',
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImF6cGdxc21neW9yamJxc2d4dXh3Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2OTI5ODU2MCwiZXhwIjoyMDg0ODc0NTYwfQ.Y7JqFwXhYqTjlG8hBmYJt2gJJKqGqY5rKgHhN9G3E'
);

async function directCategoryFix() {
  try {
    console.log('🔧 Starting Direct Product Category Fix...\n');
    
    // Step 1: Verify categories exist
    console.log('📂 Step 1: Verifying categories...');
    const { data: categories, error: categoriesError } = await supabase
      .from('categories')
      .select('id, name, slug')
      .order('name');
    
    if (categoriesError) {
      console.error('❌ Error fetching categories:', categoriesError.message);
      return;
    }
    
    console.log(`✅ Found ${categories.length} categories:`);
    const categoryMap = {};
    categories.forEach(cat => {
      categoryMap[cat.id] = cat.name;
      console.log(`   ID: ${cat.id}, Name: ${cat.name}`);
    });
    
    // Step 2: Get all uncategorized products
    console.log('\n📦 Step 2: Fetching uncategorized products...');
    const { data: products, error: productsError } = await supabase
      .from('products')
      .select('id, name, price, category_id, status')
      .is('category_id', null)
      .eq('status', 'active')
      .order('name');
    
    if (productsError) {
      console.error('❌ Error fetching products:', productsError.message);
      return;
    }
    
    console.log(`✅ Found ${products.length} uncategorized products`);
    
    // Step 3: Classify and update products
    console.log('\n🎯 Step 3: Classifying and updating products...');
    
    const foodKeywords = [
      'banku', 'jollof', 'rice', 'waakye', 'kenkey', 'fufu', 'stew', 'soup',
      'egusi', 'shito', 'gari', 'kelewele', 'plantain', 'beans', 'kontomire',
      'cabbage', 'barbeque', 'chicken', 'fish', 'meat', 'khebab', 'palm',
      'pasta', 'spaghetti', 'tuozafi', 'vegetables', 'bake', 'food', 'ghanaian',
      'nigerian', 'sierra leone', 'party orders', 'combo', 'fried', 'nkulenu',
      'plam', 'sauce'
    ];
    
    let foodUpdates = 0;
    let menFashionUpdates = 0;
    let womenFashionUpdates = 0;
    let totalErrors = 0;
    const updateLog = [];
    
    for (const product of products) {
      const name = product.name.toLowerCase();
      
      try {
        // Check for food keywords
        const isFood = foodKeywords.some(keyword => name.includes(keyword));
        if (isFood) {
          const { error } = await supabase
            .from('products')
            .update({ category_id: 9 }) // Food & Beverages
            .eq('id', product.id);
          
          if (error) {
            console.error(`❌ Error updating ${product.name}:`, error.message);
            totalErrors++;
            updateLog.push({ product: product.name, status: 'ERROR', error: error.message });
          } else {
            foodUpdates++;
            updateLog.push({ product: product.name, status: 'SUCCESS', category: 'Food & Beverages', id: 9 });
            console.log(`✅ Food: ${product.name}`);
          }
          continue;
        }
        
        // Check for fashion keywords
        if (name.includes('dashiki')) {
          const targetCategory = name.includes('boys') || name.includes('men') ? 2 : 1; // Men Fashion : Women Fashion
          const categoryName = targetCategory === 2 ? 'Men Fashion' : 'Women Fashion';
          
          const { error } = await supabase
            .from('products')
            .update({ category_id: targetCategory })
            .eq('id', product.id);
          
          if (error) {
            console.error(`❌ Error updating ${product.name}:`, error.message);
            totalErrors++;
            updateLog.push({ product: product.name, status: 'ERROR', error: error.message });
          } else {
            if (targetCategory === 2) {
              menFashionUpdates++;
            } else {
              womenFashionUpdates++;
            }
            updateLog.push({ product: product.name, status: 'SUCCESS', category: categoryName, id: targetCategory });
            console.log(`✅ Fashion: ${product.name} → ${categoryName}`);
          }
        } else {
          // Default remaining products to Food & Beverages
          const { error } = await supabase
            .from('products')
            .update({ category_id: 9 }) // Food & Beverages
            .eq('id', product.id);
          
          if (error) {
            console.error(`❌ Error updating ${product.name}:`, error.message);
            totalErrors++;
            updateLog.push({ product: product.name, status: 'ERROR', error: error.message });
          } else {
            foodUpdates++;
            updateLog.push({ product: product.name, status: 'SUCCESS', category: 'Food & Beverages (default)', id: 9 });
            console.log(`✅ Default: ${product.name} → Food & Beverages`);
          }
        }
        
      } catch (err) {
        console.error(`❌ Unexpected error with ${product.name}:`, err.message);
        totalErrors++;
        updateLog.push({ product: product.name, status: 'ERROR', error: err.message });
      }
    }
    
    // Step 4: Summary
    console.log('\n📊 Step 4: Update Summary');
    console.log(`   Total products processed: ${products.length}`);
    console.log(`   Food & Beverages updates: ${foodUpdates}`);
    console.log(`   Men Fashion updates: ${menFashionUpdates}`);
    console.log(`   Women Fashion updates: ${womenFashionUpdates}`);
    console.log(`   Errors: ${totalErrors}`);
    console.log(`   Success rate: ${((products.length - totalErrors) / products.length * 100).toFixed(1)}%`);
    
    // Step 5: Validation
    console.log('\n🔍 Step 5: Validation Results');
    
    // Check remaining uncategorized products
    const { data: remaining, error: remainingError } = await supabase
      .from('products')
      .select('id, name')
      .is('category_id', null)
      .eq('status', 'active');
    
    if (!remainingError) {
      console.log(`📦 Remaining uncategorized products: ${remaining.length}`);
      if (remaining.length > 0) {
        console.log('   Remaining products:');
        remaining.forEach(p => console.log(`     - ${p.name}`));
      }
    }
    
    // Check category counts
    console.log('\n📊 Updated Category Counts:');
    for (const category of categories) {
      const { count, error: countError } = await supabase
        .from('products')
        .select('*', { count: 'exact', head: true })
        .eq('category_id', category.id)
        .eq('status', 'active');
      
      if (!countError) {
        console.log(`   ${category.name}: ${count} products`);
      }
    }
    
    // Step 6: Create audit log
    console.log('\n📋 Step 6: Creating audit log...');
    const auditContent = {
      timestamp: new Date().toISOString(),
      totalProducts: products.length,
      updates: {
        foodBeverages: foodUpdates,
        menFashion: menFashionUpdates,
        womenFashion: womenFashionUpdates,
        errors: totalErrors
      },
      updateLog: updateLog
    };
    
    // Save audit log to file
    const fs = require('fs');
    const path = require('path');
    const auditFile = path.join(__dirname, `category_fix_audit_${Date.now()}.json`);
    fs.writeFileSync(auditFile, JSON.stringify(auditContent, null, 2));
    console.log(`✅ Audit log saved to: ${auditFile}`);
    
    console.log('\n🎉 Product Category Fix Completed Successfully!');
    
  } catch (error) {
    console.error('❌ Fatal error:', error.message);
  }
}

// Execute the fix
directCategoryFix();
