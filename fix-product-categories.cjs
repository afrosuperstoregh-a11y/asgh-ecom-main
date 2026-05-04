const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(
  'https://azpgqsmgyorjbqsgxuxw.supabase.co',
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImF6cGdxc21neW9yamJxc2d4dXh3Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjkyOTg1NjAsImV4cCI6MjA4NDg3NDU2MH0.cxHD8ihT9E5ZAxtkfGa2VjYxYmadbYxyl3xVDPtgh9Q'
);

async function fixProductCategories() {
  try {
    console.log('🔧 Starting product category fix...\n');
    
    // Step 1: Fetch all categories with IDs
    console.log('📂 Step 1: Fetching categories...');
    const { data: categories, error: categoriesError } = await supabase
      .from('categories')
      .select('id, name, slug')
      .order('name');
    
    if (categoriesError) {
      console.error('❌ Error fetching categories:', categoriesError.message);
      return;
    }
    
    console.log(`✅ Found ${categories.length} categories:`);
    categories.forEach(cat => {
      console.log(`   ID: ${cat.id}, Name: ${cat.name}, Slug: ${cat.slug}`);
    });
    
    // Create category mapping for easy lookup
    const categoryMap = {};
    categories.forEach(cat => {
      categoryMap[cat.id] = cat.name;
      categoryMap[cat.name.toLowerCase()] = cat.id;
      categoryMap[cat.slug] = cat.id;
    });
    
    // Step 2: Get all uncategorized products
    console.log('\n📦 Step 2: Fetching uncategorized products...');
    const { data: uncategorizedProducts, error: productsError } = await supabase
      .from('products')
      .select('id, name, price, category_id, status')
      .is('category_id', null)
      .eq('status', 'active')
      .order('name');
    
    if (productsError) {
      console.error('❌ Error fetching products:', productsError.message);
      return;
    }
    
    console.log(`✅ Found ${uncategorizedProducts.length} uncategorized products`);
    
    // Step 3: Classification logic
    console.log('\n🎯 Step 3: Classifying products...');
    
    const foodKeywords = [
      'banku', 'jollof', 'rice', 'waakye', 'kenkey', 'fufu', 'stew', 'soup',
      'egusi', 'shito', 'gari', 'kelewele', 'plantain', 'beans', 'kontomire',
      'cabbage', 'barbeque', 'chicken', 'fish', 'meat', 'khebab', 'palm',
      'pasta', 'spaghetti', 'tuozafi', 'vegetables', 'bake', 'food', 'ghanaian',
      'nigerian', 'sierra leone', 'party orders', 'combo', 'fried', 'nkulenu',
      'plam', 'sauce'
    ];
    
    const fashionKeywords = [
      'dashiki', 'shirt', 'dress', 'fashion', 'clothing'
    ];
    
    const classification = {
      food: [],
      fashion: [],
      other: []
    };
    
    uncategorizedProducts.forEach(product => {
      const name = product.name.toLowerCase();
      
      // Check for food keywords
      const isFood = foodKeywords.some(keyword => name.includes(keyword));
      if (isFood) {
        classification.food.push(product);
        return;
      }
      
      // Check for fashion keywords
      const isFashion = fashionKeywords.some(keyword => name.includes(keyword));
      if (isFashion) {
        classification.fashion.push(product);
        return;
      }
      
      // Default to other for manual review
      classification.other.push(product);
    });
    
    console.log(`🍽️ Food products: ${classification.food.length}`);
    console.log(`👔 Fashion products: ${classification.fashion.length}`);
    console.log(`📋 Other products: ${classification.other.length}`);
    
    // Get category IDs
    const foodCategoryId = categoryMap['food & beverages'] || categoryMap['food-beverages'];
    const menFashionId = categoryMap['men fashion'] || categoryMap['men-fashion'];
    const womenFashionId = categoryMap['women fashion'] || categoryMap['women-fashion'];
    
    console.log('\n🎯 Target Categories:');
    console.log(`   Food & Beverages ID: ${foodCategoryId}`);
    console.log(`   Men Fashion ID: ${menFashionId}`);
    console.log(`   Women Fashion ID: ${womenFashionId}`);
    
    if (!foodCategoryId || !menFashionId || !womenFashionId) {
      console.error('❌ Missing required category IDs');
      return;
    }
    
    // Step 4: Prepare updates
    console.log('\n🔄 Step 4: Preparing database updates...');
    
    const updates = [];
    
    // Food products -> Food & Beverages
    classification.food.forEach(product => {
      updates.push({
        id: product.id,
        name: product.name,
        from_category: null,
        to_category: foodCategoryId,
        to_category_name: 'Food & Beverages'
      });
    });
    
    // Fashion products - determine gender
    classification.fashion.forEach(product => {
      const name = product.name.toLowerCase();
      const targetCategory = name.includes('boys') || name.includes('men') ? menFashionId : womenFashionId;
      const categoryName = name.includes('boys') || name.includes('men') ? 'Men Fashion' : 'Women Fashion';
      
      updates.push({
        id: product.id,
        name: product.name,
        from_category: null,
        to_category: targetCategory,
        to_category_name: categoryName
      });
    });
    
    // Other products - try to classify by remaining keywords
    classification.other.forEach(product => {
      const name = product.name.toLowerCase();
      let targetCategory = foodCategoryId; // Default to food
      let categoryName = 'Food & Beverages';
      
      // Additional checks for other products
      if (name.includes('chicken') || name.includes('fish') || name.includes('meat')) {
        targetCategory = foodCategoryId;
        categoryName = 'Food & Beverages';
      }
      
      updates.push({
        id: product.id,
        name: product.name,
        from_category: null,
        to_category: targetCategory,
        to_category_name: categoryName
      });
    });
    
    console.log(`📝 Prepared ${updates.length} updates:`);
    
    // Group by category for summary
    const updatesByCategory = {};
    updates.forEach(update => {
      const key = update.to_category_name;
      if (!updatesByCategory[key]) {
        updatesByCategory[key] = [];
      }
      updatesByCategory[key].push(update);
    });
    
    Object.keys(updatesByCategory).forEach(categoryName => {
      console.log(`\n   ${categoryName} (${updatesByCategory[categoryName].length} products):`);
      updatesByCategory[categoryName].slice(0, 5).forEach(update => {
        console.log(`     - ${update.name}`);
      });
      if (updatesByCategory[categoryName].length > 5) {
        console.log(`     ... and ${updatesByCategory[categoryName].length - 5} more`);
      }
    });
    
    // Step 5: Execute updates in batches
    console.log('\n💾 Step 5: Executing database updates...');
    
    let totalUpdated = 0;
    let errors = [];
    
    // Process in batches of 10
    for (let i = 0; i < updates.length; i += 10) {
      const batch = updates.slice(i, i + 10);
      
      for (const update of batch) {
        try {
          const { error: updateError } = await supabase
            .from('products')
            .update({ category_id: update.to_category })
            .eq('id', update.id);
          
          if (updateError) {
            console.error(`❌ Error updating ${update.name}:`, updateError.message);
            errors.push({ product: update.name, error: updateError.message });
          } else {
            totalUpdated++;
            console.log(`✅ Updated: ${update.name} → ${update.to_category_name}`);
          }
        } catch (err) {
          console.error(`❌ Unexpected error updating ${update.name}:`, err.message);
          errors.push({ product: update.name, error: err.message });
        }
      }
    }
    
    console.log(`\n📊 Update Summary:`);
    console.log(`   Total products processed: ${updates.length}`);
    console.log(`   Successfully updated: ${totalUpdated}`);
    console.log(`   Errors: ${errors.length}`);
    
    if (errors.length > 0) {
      console.log('\n❌ Errors encountered:');
      errors.forEach(err => {
        console.log(`   - ${err.product}: ${err.error}`);
      });
    }
    
    // Step 6: Validation
    console.log('\n🔍 Step 6: Validating results...');
    
    // Check remaining uncategorized products
    const { data: remainingUncategorized, error: remainingError } = await supabase
      .from('products')
      .select('id, name')
      .is('category_id', null)
      .eq('status', 'active');
    
    if (remainingError) {
      console.error('❌ Error checking remaining products:', remainingError.message);
    } else {
      console.log(`📦 Remaining uncategorized products: ${remainingUncategorized.length}`);
      if (remainingUncategorized.length > 0) {
        console.log('   Remaining products:');
        remainingUncategorized.forEach(p => console.log(`     - ${p.name}`));
      }
    }
    
    // Check Food & Beverages count
    const { count: foodCount, error: foodCountError } = await supabase
      .from('products')
      .select('*', { count: 'exact', head: true })
      .eq('category_id', foodCategoryId)
      .eq('status', 'active');
    
    if (!foodCountError) {
      console.log(`🍽️ Food & Beverages now has ${foodCount} products`);
    }
    
    // Check Men Fashion count
    const { count: menCount, error: menCountError } = await supabase
      .from('products')
      .select('*', { count: 'exact', head: true })
      .eq('category_id', menFashionId)
      .eq('status', 'active');
    
    if (!menCountError) {
      console.log(`👔 Men Fashion now has ${menCount} products`);
    }
    
    // Check Women Fashion count
    const { count: womenCount, error: womenCountError } = await supabase
      .from('products')
      .select('*', { count: 'exact', head: true })
      .eq('category_id', womenFashionId)
      .eq('status', 'active');
    
    if (!womenCountError) {
      console.log(`👗 Women Fashion now has ${womenCount} products`);
    }
    
    console.log('\n🎉 Product category fix completed!');
    
  } catch (error) {
    console.error('❌ Fatal error:', error.message);
  }
}

fixProductCategories();
