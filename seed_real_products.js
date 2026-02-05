const { createClient } = require('@supabase/supabase-js');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '.env.local') });

// Supabase configuration - use the correct environment variables
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || process.env.SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('❌ Missing Supabase configuration:');
  console.error('   NEXT_PUBLIC_SUPABASE_URL:', supabaseUrl ? '✅' : '❌ Missing');
  console.error('   SUPABASE_SERVICE_ROLE_KEY:', supabaseServiceKey ? '✅' : '❌ Missing');
  console.error('\n💡 Please check your .env.local file for these variables:');
  console.error('   NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co');
  console.error('   SUPABASE_SERVICE_ROLE_KEY=your_service_role_key');
  console.error('\n📁 Current working directory:', __dirname);
  console.error('🔍 Available env vars starting with NEXT_PUBLIC:', 
    Object.keys(process.env).filter(k => k.startsWith('NEXT_PUBLIC')).join(', ')
  );
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

// Real products data
const realProducts = [
  {
    name: 'Girls Dashiki',
    slug: 'girls-dashiki',
    description: 'Latest style ladies Dashiki dress made with premium fabric and traditional African patterns.',
    short_description: 'Latest style ladies Dashiki dress.',
    sku: '100206',
    price: 30.00,
    category_name: 'Women Fashion',
    inventory_quantity: 50,
    status: 'active',
    images: ['https://your-supabase-project.supabase.co/storage/v1/object/public/product-images/girls-dashiki.jpg'],
    tags: ['dashiki', 'women', 'traditional', 'african'],
    colors: ['red', 'brown', 'ash']
  },
  {
    name: 'Boys Dashiki',
    slug: 'boys-dashiki',
    description: 'Latest style boys Dashiki dress made with premium fabric and traditional African patterns.',
    short_description: 'Latest style boys Dashiki dress.',
    sku: '100207',
    price: 30.00,
    category_name: 'Men Fashion',
    inventory_quantity: 50,
    status: 'active',
    images: ['https://your-supabase-project.supabase.co/storage/v1/object/public/product-images/boys-dashiki.jpg'],
    tags: ['dashiki', 'men', 'traditional', 'african'],
    colors: ['red', 'brown', 'ash']
  },
  {
    name: 'Banku Flour',
    slug: 'banku-flour',
    description: 'Premium quality fermented banku flour made from maize and cassava. Perfect for preparing traditional Ghanaian banku.',
    short_description: 'Premium quality fermented banku flour.',
    sku: '100201',
    price: 50.00,
    category_name: 'Food',
    inventory_quantity: 100,
    status: 'active',
    images: ['https://your-supabase-project.supabase.co/storage/v1/object/public/product-images/banku-flour.jpg'],
    tags: ['banku', 'flour', 'fermented', 'ghanaian', 'food'],
    colors: ['red', 'ash']
  },
  {
    name: 'Banku Mix',
    slug: 'banku-mix',
    description: 'High quality banku mix powder with hygienic preparation. Easy to prepare and consistently great taste.',
    short_description: 'High Quality Banku Mix Powder.',
    sku: '100202',
    price: 40.00,
    category_name: 'Food',
    inventory_quantity: 100,
    status: 'active',
    images: ['https://your-supabase-project.supabase.co/storage/v1/object/public/product-images/banku-mix.jpg'],
    tags: ['banku', 'mix', 'powder', 'ghanaian', 'food'],
    colors: ['red', 'ash']
  },
  {
    name: 'Barbeque',
    slug: 'barbeque',
    description: 'Delicious grilled barbeque skewers available in cow, goat, and chicken varieties. Perfectly seasoned and grilled to perfection.',
    short_description: 'Delicious grilled barbeque skewers.',
    sku: '100203',
    price: 3.00,
    category_name: 'Food',
    inventory_quantity: 200,
    status: 'active',
    images: ['https://your-supabase-project.supabase.co/storage/v1/object/public/product-images/barbeque.jpg'],
    tags: ['barbeque', 'grilled', 'meat', 'skewers', 'food'],
    kind: ['Cow', 'Goat', 'Chicken']
  }
];

async function setupRealProducts() {
  try {
    console.log('🚀 Setting up real products for AfroSuperStore...');

    // 1. Clear existing mock data
    console.log('🗑️  Clearing existing mock data...');
    await supabase.from('order_items').delete().neq('id', '');
    await supabase.from('cart').delete().neq('id', '');
    await supabase.from('inventory_logs').delete().neq('id', '');
    await supabase.from('reviews').delete().neq('id', '');
    await supabase.from('payments').delete().neq('id', '');
    await supabase.from('orders').delete().neq('id', '');
    await supabase.from('products').delete().neq('id', '');

    // 2. Setup required categories
    console.log('📂 Setting up required categories...');
    const categories = [
      { name: 'Women Fashion', slug: 'women-fashion', description: 'Latest women\'s fashion and clothing', sort_order: 1 },
      { name: 'Men Fashion', slug: 'men-fashion', description: 'Latest men\'s fashion and clothing', sort_order: 2 },
      { name: 'Food', slug: 'food', description: 'Authentic African food products', sort_order: 3 }
    ];

    for (const category of categories) {
      const { data, error } = await supabase
        .from('categories')
        .upsert(category, { onConflict: 'slug' })
        .select();

      if (error) {
        console.error(`❌ Error creating category ${category.name}:`, error);
      } else {
        console.log(`✅ Category "${category.name}" created/updated`);
      }
    }

    // 3. Get category IDs
    console.log('🔍 Getting category IDs...');
    const { data: categoryData } = await supabase
      .from('categories')
      .select('id, name')
      .in('name', ['Women Fashion', 'Men Fashion', 'Food']);

    const categoryMap = {};
    categoryData?.forEach(cat => {
      categoryMap[cat.name] = cat.id;
    });

    // 4. Insert real products
    console.log('🛍️  Inserting real products...');
    for (const product of realProducts) {
      const categoryId = categoryMap[product.category_name];
      
      if (!categoryId) {
        console.error(`❌ Category not found for product: ${product.name}`);
        continue;
      }

      const productData = {
        name: product.name,
        slug: product.slug,
        description: product.description,
        short_description: product.short_description,
        sku: product.sku,
        price: product.price,
        category_id: categoryId,
        inventory_quantity: product.inventory_quantity,
        status: product.status,
        images: product.images,
        tags: product.tags,
        track_inventory: true,
        allow_backorder: false,
        requires_shipping: true,
        is_digital: false,
        featured: false
      };

      const { data, error } = await supabase
        .from('products')
        .upsert(productData, { onConflict: 'sku' })
        .select();

      if (error) {
        console.error(`❌ Error inserting product ${product.name}:`, error);
      } else {
        console.log(`✅ Product "${product.name}" inserted successfully`);
        console.log(`   SKU: ${product.sku}, Price: $${product.price}, Stock: ${product.inventory_quantity}`);
      }
    }

    // 5. Verify insertion
    console.log('\n📊 Verifying product insertion...');
    const { data: verificationData } = await supabase
      .from('products')
      .select(`
        id,
        name,
        sku,
        price,
        inventory_quantity,
        status,
        categories!inner(name)
      `)
      .order('categories(name), name');

    if (verificationData && verificationData.length > 0) {
      console.log('\n✅ Successfully inserted products:');
      verificationData.forEach(product => {
        console.log(`   ${product.categories.name}: ${product.name} (${product.sku}) - $${product.price}`);
      });
    } else {
      console.log('❌ No products found in verification');
    }

    console.log('\n🎉 Real products setup complete!');
    console.log('📝 Next steps:');
    console.log('   1. Upload product images to Supabase Storage');
    console.log('   2. Update image URLs in the products table');
    console.log('   3. Remove mock data from frontend');

  } catch (error) {
    console.error('❌ Error during setup:', error);
    process.exit(1);
  }
}

// Run the setup
setupRealProducts();
