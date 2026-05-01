const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(
  'https://azpgqsmgyorjbqsgxuxw.supabase.co',
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImF6cGdxc21neW9yamJxc2d4dXh3Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjkyOTg1NjAsImV4cCI6MjA4NDg3NDU2MH0.cxHD8ihT9E5ZAxtkfGa2VjYxYmadbYxyl3xVDPtgh9Q'
);

// Food & beverage products to add to database
const foodBeverageProducts = [
  // Real working images from database
  { name: 'Cabbage Stew', image: 'food&beverages/cabbage-stew.png', price: 15.99 },
  { name: 'Chicken Wings Ghanaian Style 2', image: 'food&beverages/chicken-wings-ghanaian-style-2.jpg', price: 12.99 },
  { name: 'Chicken', image: 'food&beverages/chicken.png', price: 18.99 },
  { name: 'Different Stew Party Orders 1', image: 'food&beverages/different-stew-party-orders-1.jpg', price: 45.99 },
  { name: 'Different Stew Party Orders 2', image: 'food&beverages/different-stew-party-orders-2.jpg', price: 45.99 },
  { name: 'Different Stew Party Orders 3', image: 'food&beverages/different-stew-party-orders-3.jpg', price: 45.99 },
  { name: 'Different Stew Party Orders 4', image: 'food&beverages/different-stew-party-orders-4.jpg', price: 45.99 },
  { name: 'Fried Fish 2', image: 'food&beverages/fried-fish-2.jpg', price: 22.99 },
  { name: 'Fried Fish', image: 'food&beverages/fried-fish.jpg', price: 22.99 },
  { name: 'Fried Rice And Chicken', image: 'food&beverages/fried-rice-and-chicken.jpg', price: 16.99 },
  { name: 'Fried Rice With Chicken Combo 2', image: 'food&beverages/fried-rice-with-chicken-combo-2.jpg', price: 18.99 },
  { name: 'Fried Rice With Chicken Combo 3', image: 'food&beverages/fried-rice-with-chicken-combo-3.jpg', price: 18.99 },
  { name: 'Fried Rice With Chicken Combo 4', image: 'food&beverages/fried-rice-with-chicken-combo-4.jpg', price: 18.99 },
  { name: 'Fried Rice With Chicken Combo', image: 'food&beverages/fried-rice-with-chicken-combo.jpg', price: 18.99 },
  { name: 'Ghana Nkulenu Plam Sauce', image: 'food&beverages/ghana-nkulenu-plam-sauce.jpeg', price: 8.99 },
  { name: 'Jollof Combo', image: 'food&beverages/jollof-combo.jpg', price: 16.99 },
  { name: 'Jollof Rice', image: 'food&beverages/jollof-rice.jpg', price: 14.99 },
  { name: 'Jolof Rice Plaintain Vegetables & Chicken', image: 'food&beverages/jolof-rice,-plaintain-vegetables-&-chicken.png', price: 19.99 },
  { name: 'Kenkey', image: 'food&beverages/kenkey.jpg', price: 12.99 },
  { name: 'Khebab 1', image: 'food&beverages/khebab-1.jpg', price: 15.99 },
  { name: 'Khebab 2', image: 'food&beverages/khebab-2.jpg', price: 15.99 },
  { name: 'Kontomire Stew', image: 'food&beverages/kontomire-stew.jpg', price: 13.99 },
  { name: 'Meat Pie', image: 'food&beverages/meat-pie.png', price: 6.99 },
  { name: 'Neat Fufu', image: 'food&beverages/neat-fufu.png', price: 10.99 },
  { name: 'Nigerian Egusi Stew', image: 'food&beverages/nigerian-egusi-stew.jpg', price: 16.99 },
  { name: 'Palm Oil', image: 'food&beverages/palm-oil.jpg', price: 7.99 },
  { name: 'Pasta', image: 'food&beverages/pasta.png', price: 5.99 },
  { name: 'Rice With Green Pea', image: 'food&beverages/rice-with-green-pea.png', price: 11.99 },
  { name: 'Sierra Leone Food', image: 'food&beverages/sierra-leone-food.jpg', price: 20.99 },
  { name: 'Spaghetti', image: 'food&beverages/spaghetti.jpg', price: 6.99 },
  { name: 'Tuozafi 2', image: 'food&beverages/tuozafi-2.jpg', price: 13.99 },
  { name: 'Tuozafi', image: 'food&beverages/tuozafi.jpg', price: 13.99 },
  { name: 'Vegetables & Bake Beans', image: 'food&beverages/vegetables-&-bake-beans.png', price: 9.99 },
  { name: 'Waakye With Fish Combo 1', image: 'food&beverages/waakye-with-fish-combo-1.jpg', price: 17.99 },
  { name: 'Waakye With Fish Combo 2', image: 'food&beverages/waakye-with-fish-combo-2.jpg', price: 17.99 },
  { name: 'Waakye', image: 'food&beverages/waakye.png', price: 14.99 },
  { name: 'All Ghanaian Foods Party Orders 1', image: 'food&beverages/all-ghanaian-foods-party-orders-1.jpg', price: 55.99 },
  { name: 'All Ghanaian Foods Party Orders 2', image: 'food&beverages/all-ghanaian-foods-party-orders-2.jpg', price: 55.99 },
  { name: 'All Ghanaian Foods Party Orders 3', image: 'food&beverages/all-ghanaian-foods-party-orders-3.jpg', price: 55.99 },
  // Additional items (placeholders)
  { name: 'Banku Flour', image: 'food&beverages/banku-flour.jpg', price: 8.99 },
  { name: 'Banku Mix', image: 'food&beverages/banku-mix.jpg', price: 9.99 },
  { name: 'Barbeque', image: 'food&beverages/barbeque.png', price: 16.99 },
  { name: 'Red Red', image: 'food&beverages/red-red.jpg', price: 12.99 },
  { name: 'Shito', image: 'food&beverages/shito.jpg', price: 4.99 },
  { name: 'Gari', image: 'food&beverages/gari.jpg', price: 6.99 },
  { name: 'Kelewele', image: 'food&beverages/kelewele.jpg', price: 8.99 },
  { name: 'Fried Plantain', image: 'food&beverages/fried-plantain.jpg', price: 7.99 },
  { name: 'Groundnut Soup', image: 'food&beverages/groundnut-soup.jpg', price: 14.99 },
  { name: 'Light Soup', image: 'food&beverages/light-soup.jpg', price: 13.99 },
  { name: 'Banga Soup', image: 'food&beverages/banga-soup.jpg', price: 15.99 },
  { name: 'Egusi Soup', image: 'food&beverages/egusi-soup.jpg', price: 16.99 },
  { name: 'Okro Soup', image: 'food&beverages/okro-soup.jpg', price: 14.99 },
  { name: 'African Salad', image: 'food&beverages/african-salad.jpg', price: 9.99 },
  { name: 'Fruit Juice Mix', image: 'food&beverages/fruit-juice-mix.jpg', price: 5.99 },
  { name: 'Sobolo', image: 'food&beverages/sobolo.jpg', price: 4.99 },
  { name: 'Zobo', image: 'food&beverages/zobo.jpg', price: 4.99 }
];

async function addFoodBeverageProducts() {
  try {
    console.log('🔍 Adding food & beverage products to database...');
    
    // First, check if food & beverages category exists
    const { data: categories, error: categoryError } = await supabase
      .from('categories')
      .select('*')
      .ilike('name', '%food%');
    
    if (categoryError) {
      console.log('❌ Error checking categories:', categoryError.message);
      return;
    }
    
    let foodBeverageCategory;
    
    if (categories && categories.length > 0) {
      foodBeverageCategory = categories[0];
      console.log(`✅ Found existing category: ${foodBeverageCategory.name}`);
    } else {
      // Create food & beverages category
      const { data: newCategory, error: createError } = await supabase
        .from('categories')
        .insert({
          name: 'Food & Beverages',
          slug: 'food-beverages',
          description: 'Authentic African food and beverage products',
          image: 'food&beverages/category-image.jpg'
        })
        .select()
        .single();
      
      if (createError) {
        console.log('❌ Error creating category:', createError.message);
        return;
      }
      
      foodBeverageCategory = newCategory;
      console.log(`✅ Created new category: ${foodBeverageCategory.name}`);
    }
    
    // Now add products
    let addedCount = 0;
    let skippedCount = 0;
    
    for (const product of foodBeverageProducts) {
      try {
        // Check if product already exists
        const { data: existingProduct, error: checkError } = await supabase
          .from('products')
          .select('id')
          .eq('name', product.name)
          .single();
        
        if (existingProduct) {
          console.log(`⏭️  Skipped (already exists): ${product.name}`);
          skippedCount++;
          continue;
        }
        
        // Add the product
        const { data: newProduct, error: insertError } = await supabase
          .from('products')
          .insert({
            name: product.name,
            slug: product.name.toLowerCase().replace(/[^a-z0-9]+/g, '-'),
            description: `Authentic ${product.name.toLowerCase()} from our premium African food collection`,
            short_description: `Premium quality ${product.name.toLowerCase()}`,
            sku: `FB-${String(addedCount + 1).padStart(3, '0')}`,
            price: product.price,
            compare_price: product.price * 1.2,
            category_id: foodBeverageCategory.id,
            images: product.image,
            tags: product.name.toLowerCase().replace(/[^a-z0-9]+/g, ','),
            inventory_quantity: Math.floor(Math.random() * 50) + 10,
            track_inventory: true,
            allow_backorder: false,
            requires_shipping: true,
            is_digital: false,
            status: 'active',
            featured: addedCount < 10, // Make first 10 products featured
            seo_title: product.name,
            seo_description: `Buy ${product.name} online - Authentic African food products`,
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString()
          })
          .select()
          .single();
        
        if (insertError) {
          console.log(`❌ Error adding ${product.name}:`, insertError.message);
        } else {
          console.log(`✅ Added: ${product.name} - $${product.price}`);
          addedCount++;
        }
        
      } catch (error) {
        console.log(`❌ Error processing ${product.name}:`, error.message);
      }
    }
    
    console.log(`\n📊 Summary:`);
    console.log(`✅ Successfully added: ${addedCount} products`);
    console.log(`⏭️  Skipped (already exist): ${skippedCount} products`);
    console.log(`📝 Total processed: ${addedCount + skippedCount} products`);
    console.log(`🎯 All food & beverage products are now available in the main shop!`);
    
  } catch (error) {
    console.log('❌ Error:', error.message);
  }
}

addFoodBeverageProducts();
