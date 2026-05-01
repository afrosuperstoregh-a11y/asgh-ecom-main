const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(
  'https://azpgqsmgyorjbqsgxuxw.supabase.co',
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImF6cGdxc21neW9yamJxc2d4dXh3Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjkyOTg1NjAsImV4cCI6MjA4NDg3NDU2MH0.cxHD8ihT9E5ZAxtkfGa2VjYxYmadbYxyl3xVDPtgh9Q'
);

// All 55 food & beverage products with proper Supabase URLs
const allFoodBeverageProducts = [
  // Real working images
  { name: 'Cabbage Stew', image: 'https://azpgqsmgyorjbqsgxuxw.supabase.co/storage/v1/object/public/product-images/food%26beverages/cabbage-stew.png', price: 15.99 },
  { name: 'Chicken Wings Ghanaian Style 2', image: 'https://azpgqsmgyorjbqsgxuxw.supabase.co/storage/v1/object/public/product-images/food%26beverages/chicken-wings-ghanaian-style-2.jpg', price: 12.99 },
  { name: 'Chicken', image: 'https://azpgqsmgyorjbqsgxuxw.supabase.co/storage/v1/object/public/product-images/food%26beverages/chicken.png', price: 18.99 },
  { name: 'Different Stew Party Orders 1', image: 'https://azpgqsmgyorjbqsgxuxw.supabase.co/storage/v1/object/public/product-images/food%26beverages/different-stew-party-orders-1.jpg', price: 45.99 },
  { name: 'Different Stew Party Orders 2', image: 'https://azpgqsmgyorjbqsgxuxw.supabase.co/storage/v1/object/public/product-images/food%26beverages/different-stew-party-orders-2.jpg', price: 45.99 },
  { name: 'Different Stew Party Orders 3', image: 'https://azpgqsmgyorjbqsgxuxw.supabase.co/storage/v1/object/public/product-images/food%26beverages/different-stew-party-orders-3.jpg', price: 45.99 },
  { name: 'Different Stew Party Orders 4', image: 'https://azpgqsmgyorjbqsgxuxw.supabase.co/storage/v1/object/public/product-images/food%26beverages/different-stew-party-orders-4.jpg', price: 45.99 },
  { name: 'Fried Fish 2', image: 'https://azpgqsmgyorjbqsgxuxw.supabase.co/storage/v1/object/public/product-images/food%26beverages/fried-fish-2.jpg', price: 22.99 },
  { name: 'Fried Fish', image: 'https://azpgqsmgyorjbqsgxuxw.supabase.co/storage/v1/object/public/product-images/food%26beverages/fried-fish.jpg', price: 22.99 },
  { name: 'Fried Rice And Chicken', image: 'https://azpgqsmgyorjbqsgxuxw.supabase.co/storage/v1/object/public/product-images/food%26beverages/fried-rice-and-chicken.jpg', price: 16.99 },
  { name: 'Fried Rice With Chicken Combo 2', image: 'https://azpgqsmgyorjbqsgxuxw.supabase.co/storage/v1/object/public/product-images/food%26beverages/fried-rice-with-chicken-combo-2.jpg', price: 18.99 },
  { name: 'Fried Rice With Chicken Combo 3', image: 'https://azpgqsmgyorjbqsgxuxw.supabase.co/storage/v1/object/public/product-images/food%26beverages/fried-rice-with-chicken-combo-3.jpg', price: 18.99 },
  { name: 'Fried Rice With Chicken Combo 4', image: 'https://azpgqsmgyorjbqsgxuxw.supabase.co/storage/v1/object/public/product-images/food%26beverages/fried-rice-with-chicken-combo-4.jpg', price: 18.99 },
  { name: 'Fried Rice With Chicken Combo', image: 'https://azpgqsmgyorjbqsgxuxw.supabase.co/storage/v1/object/public/product-images/food%26beverages/fried-rice-with-chicken-combo.jpg', price: 18.99 },
  { name: 'Ghana Nkulenu Plam Sauce', image: 'https://azpgqsmgyorjbqsgxuxw.supabase.co/storage/v1/object/public/product-images/food%26beverages/ghana-nkulenu-plam-sauce.jpeg', price: 8.99 },
  { name: 'Jollof Combo', image: 'https://azpgqsmgyorjbqsgxuxw.supabase.co/storage/v1/object/public/product-images/food%26beverages/jollof-combo.jpg', price: 16.99 },
  { name: 'Jollof Rice', image: 'https://azpgqsmgyorjbqsgxuxw.supabase.co/storage/v1/object/public/product-images/food%26beverages/jollof-rice.jpg', price: 14.99 },
  { name: 'Jolof Rice Plaintain Vegetables & Chicken', image: 'https://azpgqsmgyorjbqsgxuxw.supabase.co/storage/v1/object/public/product-images/food%26beverages/jolof-rice,-plaintain-vegetables-&-chicken.png', price: 19.99 },
  { name: 'Kenkey', image: 'https://azpgqsmgyorjbqsgxuxw.supabase.co/storage/v1/object/public/product-images/food%26beverages/kenkey.jpg', price: 12.99 },
  { name: 'Khebab 1', image: 'https://azpgqsmgyorjbqsgxuxw.supabase.co/storage/v1/object/public/product-images/food%26beverages/khebab-1.jpg', price: 15.99 },
  { name: 'Khebab 2', image: 'https://azpgqsmgyorjbqsgxuxw.supabase.co/storage/v1/object/public/product-images/food%26beverages/khebab-2.jpg', price: 15.99 },
  { name: 'Kontomire Stew', image: 'https://azpgqsmgyorjbqsgxuxw.supabase.co/storage/v1/object/public/product-images/food%26beverages/kontomire-stew.jpg', price: 13.99 },
  { name: 'Meat Pie', image: 'https://azpgqsmgyorjbqsgxuxw.supabase.co/storage/v1/object/public/product-images/food%26beverages/meat-pie.png', price: 6.99 },
  { name: 'Neat Fufu', image: 'https://azpgqsmgyorjbqsgxuxw.supabase.co/storage/v1/object/public/product-images/food%26beverages/neat-fufu.png', price: 10.99 },
  { name: 'Nigerian Egusi Stew', image: 'https://azpgqsmgyorjbqsgxuxw.supabase.co/storage/v1/object/public/product-images/food%26beverages/nigerian-egusi-stew.jpg', price: 16.99 },
  { name: 'Palm Oil', image: 'https://azpgqsmgyorjbqsgxuxw.supabase.co/storage/v1/object/public/product-images/food%26beverages/palm-oil.jpg', price: 7.99 },
  { name: 'Pasta', image: 'https://azpgqsmgyorjbqsgxuxw.supabase.co/storage/v1/object/public/product-images/food%26beverages/pasta.png', price: 5.99 },
  { name: 'Rice With Green Pea', image: 'https://azpgqsmgyorjbqsgxuxw.supabase.co/storage/v1/object/public/product-images/food%26beverages/rice-with-green-pea.png', price: 11.99 },
  { name: 'Sierra Leone Food', image: 'https://azpgqsmgyorjbqsgxuxw.supabase.co/storage/v1/object/public/product-images/food%26beverages/sierra-leone-food.jpg', price: 20.99 },
  { name: 'Spaghetti', image: 'https://azpgqsmgyorjbqsgxuxw.supabase.co/storage/v1/object/public/product-images/food%26beverages/spaghetti.jpg', price: 6.99 },
  { name: 'Tuozafi 2', image: 'https://azpgqsmgyorjbqsgxuxw.supabase.co/storage/v1/object/public/product-images/food%26beverages/tuozafi-2.jpg', price: 13.99 },
  { name: 'Tuozafi', image: 'https://azpgqsmgyorjbqsgxuxw.supabase.co/storage/v1/object/public/product-images/food%26beverages/tuozafi.jpg', price: 13.99 },
  { name: 'Vegetables & Bake Beans', image: 'https://azpgqsmgyorjbqsgxuxw.supabase.co/storage/v1/object/public/product-images/food%26beverages/vegetables-&-bake-beans.png', price: 9.99 },
  { name: 'Waakye With Fish Combo 1', image: 'https://azpgqsmgyorjbqsgxuxw.supabase.co/storage/v1/object/public/product-images/food%26beverages/waakye-with-fish-combo-1.jpg', price: 17.99 },
  { name: 'Waakye With Fish Combo 2', image: 'https://azpgqsmgyorjbqsgxuxw.supabase.co/storage/v1/object/public/product-images/food%26beverages/waakye-with-fish-combo-2.jpg', price: 17.99 },
  { name: 'Waakye', image: 'https://azpgqsmgyorjbqsgxuxw.supabase.co/storage/v1/object/public/product-images/food%26beverages/waakye.png', price: 14.99 },
  { name: 'All Ghanaian Foods Party Orders 1', image: 'https://azpgqsmgyorjbqsgxuxw.supabase.co/storage/v1/object/public/product-images/food%26beverages/all-ghanaian-foods-party-orders-1.jpg', price: 55.99 },
  { name: 'All Ghanaian Foods Party Orders 2', image: 'https://azpgqsmgyorjbqsgxuxw.supabase.co/storage/v1/object/public/product-images/food%26beverages/all-ghanaian-foods-party-orders-2.jpg', price: 55.99 },
  { name: 'All Ghanaian Foods Party Orders 3', image: 'https://azpgqsmgyorjbqsgxuxw.supabase.co/storage/v1/object/public/product-images/food%26beverages/all-ghanaian-foods-party-orders-3.jpg', price: 55.99 },
  // Additional items (some may be placeholders)
  { name: 'Banku Flour', image: 'https://azpgqsmgyorjbqsgxuxw.supabase.co/storage/v1/object/public/product-images/food%26beverages/banku-flour.jpg', price: 8.99 },
  { name: 'Banku Mix', image: 'https://azpgqsmgyorjbqsgxuxw.supabase.co/storage/v1/object/public/product-images/food%26beverages/banku-mix.png', price: 9.99 },
  { name: 'Barbeque', image: 'https://azpgqsmgyorjbqsgxuxw.supabase.co/storage/v1/object/public/product-images/food%26beverages/barbeque.png', price: 16.99 },
  { name: 'Red Red', image: 'https://azpgqsmgyorjbqsgxuxw.supabase.co/storage/v1/object/public/product-images/food%26beverages/red-red.jpg', price: 12.99 },
  { name: 'Shito', image: 'https://azpgqsmgyorjbqsgxuxw.supabase.co/storage/v1/object/public/product-images/food%26beverages/shito.jpg', price: 4.99 },
  { name: 'Gari', image: 'https://azpgqsmgyorjbqsgxuxw.supabase.co/storage/v1/object/public/product-images/food%26beverages/gari.jpg', price: 6.99 },
  { name: 'Kelewele', image: 'https://azpgqsmgyorjbqsgxuxw.supabase.co/storage/v1/object/public/product-images/food%26beverages/kelewele.jpg', price: 8.99 },
  { name: 'Fried Plantain', image: 'https://azpgqsmgyorjbqsgxuxw.supabase.co/storage/v1/object/public/product-images/food%26beverages/fried-plantain.jpg', price: 7.99 },
  { name: 'Groundnut Soup', image: 'https://azpgqsmgyorjbqsgxuxw.supabase.co/storage/v1/object/public/product-images/food%26beverages/groundnut-soup.jpg', price: 14.99 },
  { name: 'Light Soup', image: 'https://azpgqsmgyorjbqsgxuxw.supabase.co/storage/v1/object/public/product-images/food%26beverages/light-soup.jpg', price: 13.99 },
  { name: 'Banga Soup', image: 'https://azpgqsmgyorjbqsgxuxw.supabase.co/storage/v1/object/public/product-images/food%26beverages/banga-soup.jpg', price: 15.99 },
  { name: 'Egusi Soup', image: 'https://azpgqsmgyorjbqsgxuxw.supabase.co/storage/v1/object/public/product-images/food%26beverages/egusi-soup.jpg', price: 16.99 },
  { name: 'Okro Soup', image: 'https://azpgqsmgyorjbqsgxuxw.supabase.co/storage/v1/object/public/product-images/food%26beverages/okro-soup.jpg', price: 14.99 },
  { name: 'African Salad', image: 'https://azpgqsmgyorjbqsgxuxw.supabase.co/storage/v1/object/public/product-images/food%26beverages/african-salad.jpg', price: 9.99 },
  { name: 'Fruit Juice Mix', image: 'https://azpgqsmgyorjbqsgxuxw.supabase.co/storage/v1/object/public/product-images/food%26beverages/fruit-juice-mix.jpg', price: 5.99 },
  { name: 'Sobolo', image: 'https://azpgqsmgyorjbqsgxuxw.supabase.co/storage/v1/object/public/product-images/food%26beverages/sobolo.jpg', price: 4.99 },
  { name: 'Zobo', image: 'https://azpgqsmgyorjbqsgxuxw.supabase.co/storage/v1/object/public/product-images/food%26beverages/zobo.jpg', price: 4.99 }
];

async function fixFoodBeveragesURLs() {
  try {
    console.log('🔧 Fixing food & beverage product URLs in database...');
    
    // Get food & beverages category
    const { data: categories, error: categoryError } = await supabase
      .from('categories')
      .select('*')
      .ilike('name', '%food%');
    
    if (categoryError) {
      console.log('❌ Error checking categories:', categoryError.message);
      return;
    }
    
    if (!categories || categories.length === 0) {
      console.log('❌ No food & beverage category found');
      return;
    }
    
    const foodCategory = categories[0];
    console.log(`✅ Found category: ${foodCategory.name}`);
    
    // Update existing products with correct URLs
    let updatedCount = 0;
    let notFoundCount = 0;
    
    for (const product of allFoodBeverageProducts) {
      try {
        // Check if product exists
        const { data: existingProduct, error: checkError } = await supabase
          .from('products')
          .select('id, images')
          .eq('name', product.name)
          .single();
        
        if (checkError || !existingProduct) {
          notFoundCount++;
          console.log(`❌ Not found: ${product.name}`);
          continue;
        }
        
        // Update the product with correct URL
        const { data: updatedProduct, error: updateError } = await supabase
          .from('products')
          .update({
            images: product.image,
            price: product.price,
            updated_at: new Date().toISOString()
          })
          .eq('id', existingProduct.id)
          .select()
          .single();
        
        if (updateError) {
          console.log(`❌ Error updating ${product.name}:`, updateError.message);
        } else {
          console.log(`✅ Updated: ${product.name} - $${product.price}`);
          updatedCount++;
        }
        
      } catch (error) {
        console.log(`❌ Error processing ${product.name}:`, error.message);
      }
    }
    
    console.log(`\n📊 Summary:`);
    console.log(`✅ Successfully updated: ${updatedCount} products`);
    console.log(`❌ Not found: ${notFoundCount} products`);
    console.log(`📝 Total processed: ${updatedCount + notFoundCount} products`);
    
    // Verify the updates
    console.log(`\n🔍 Verifying updates...`);
    const { data: verifyProducts, error: verifyError } = await supabase
      .from('products')
      .select('id, name, price, images, status')
      .eq('category_id', foodCategory.id)
      .eq('status', 'active')
      .order('created_at', { ascending: false })
      .limit(10);
    
    if (verifyError) {
      console.log('❌ Error verifying:', verifyError.message);
    } else {
      console.log(`\n✅ Updated products in database:`);
      verifyProducts.forEach((product, index) => {
        console.log(`  ${index + 1}. ${product.name} - $${product.price}`);
        console.log(`     Image: ${product.images}`);
      });
    }
    
    console.log(`\n🎉 Food & beverage products are now ready for the main shop with proper URLs!`);
    
  } catch (error) {
    console.log('❌ Error:', error.message);
  }
}

fixFoodBeveragesURLs();
