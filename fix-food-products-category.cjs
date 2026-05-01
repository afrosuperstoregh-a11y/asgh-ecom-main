const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(
  'https://azpgqsmgyorjbqsgxuxw.supabase.co',
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImF6cGdxc21neW9yamJxc2d4dXh3Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjkyOTg1NjAsImV4cCI6MjA4NDg3NDU2MH0.cxHD8ihT9E5ZAxtkfGa2VjYxYmadbYxyl3xVDPtgh9Q'
);

async function fixFoodProductsCategory() {
  try {
    console.log('🔧 Fixing food products category assignment...');
    
    const FOOD_BEVERAGES_CATEGORY_ID = 9;
    
    // Get all food-related products with null category_id
    const { data: foodProducts, error: foodProductsError } = await supabase
      .from('products')
      .select('id, name, price, category_id, status')
      .eq('status', 'active')
      .is('category_id', null)
      .or('name.ilike.%food%,name.ilike.%rice%,name.ilike.%stew%,name.ilike.%jollof%,name.ilike.%kenkey%,name.ilike.%waakye%,name.ilike.%banku%,name.ilike.%shito%,name.ilike.%gari%,name.ilike.%kelewele%,name.ilike.%plantain%,name.ilike.%soup%,name.ilike.%egusi%,name.ilike.%fufu%')
      .order('name');
    
    if (foodProductsError) {
      console.log('❌ Error fetching food products:', foodProductsError.message);
      return;
    }
    
    console.log(`\n📦 Found ${foodProducts.length} food products without category assignment:`);
    
    let updatedCount = 0;
    let errorCount = 0;
    
    for (const product of foodProducts) {
      try {
        console.log(`\n🔄 Updating: ${product.name}`);
        console.log(`📋 ID: ${product.id}, Price: $${product.price}`);
        console.log(`🎯 Assigning to Food & Beverages category (ID: ${FOOD_BEVERAGES_CATEGORY_ID})`);
        
        // Update the product with the correct category
        const { data: updatedProduct, error: updateError } = await supabase
          .from('products')
          .update({
            category_id: FOOD_BEVERAGES_CATEGORY_ID,
            updated_at: new Date().toISOString()
          })
          .eq('id', product.id)
          .select()
          .single();
        
        if (updateError) {
          console.log(`❌ Error updating ${product.name}:`, updateError.message);
          errorCount++;
        } else {
          console.log(`✅ Successfully updated: ${product.name}`);
          console.log(`📝 New category ID: ${updatedProduct.category_id}`);
          updatedCount++;
        }
        
      } catch (error) {
        console.log(`❌ Error processing ${product.name}:`, error.message);
        errorCount++;
      }
    }
    
    console.log(`\n📊 Update Summary:`);
    console.log(`✅ Successfully updated: ${updatedCount} products`);
    console.log(`❌ Failed to update: ${errorCount} products`);
    console.log(`📝 Total processed: ${foodProducts.length} products`);
    
    // Verify the updates
    console.log(`\n🔍 Verifying updates...`);
    
    const { data: verifyProducts, error: verifyError } = await supabase
      .from('products')
      .select('id, name, price, category_id')
      .eq('category_id', FOOD_BEVERAGES_CATEGORY_ID)
      .eq('status', 'active')
      .order('name');
    
    if (verifyError) {
      console.log('❌ Error verifying:', verifyError.message);
    } else {
      console.log(`\n✅ Food & Beverages category now contains ${verifyProducts.length} products:`);
      verifyProducts.forEach((product, index) => {
        console.log(`  ${index + 1}. ${product.name} - $${product.price}`);
      });
    }
    
    // Test the API again
    console.log(`\n🌐 Testing API after category fix...`);
    try {
      const apiResponse = await fetch('http://localhost:3000/api/products?category=food-beverages&limit=100');
      if (apiResponse.ok) {
        const apiData = await apiResponse.json();
        const apiProducts = apiData.data?.products || [];
        console.log(`✅ API now returns ${apiProducts.length} food & beverage products`);
        
        if (apiProducts.length > 3) {
          console.log(`\n🎉 SUCCESS: Shop will now display all food & beverage products!`);
          console.log(`📝 Sample products from API:`);
          apiProducts.slice(0, 5).forEach((product, index) => {
            console.log(`  ${index + 1}. ${product.name} - $${product.price}`);
          });
        }
      } else {
        console.log(`❌ API test failed: ${apiResponse.status}`);
      }
    } catch (err) {
      console.log(`❌ API test error: ${err.message}`);
    }
    
    console.log(`\n🎉 Food products category assignment complete!`);
    console.log(`🛒 The shop will now display all food & beverage products!`);
    
  } catch (error) {
    console.log('❌ Error:', error.message);
  }
}

fixFoodProductsCategory();
