const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('❌ Missing Supabase environment variables');
  console.error('Required: SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  }
});

async function createSampleData() {
  try {
    console.log('🚀 Creating sample categories and products...');

    // Create sample categories
    const categories = [
      {
        name: 'Electronics',
        slug: 'electronics',
        description: 'Latest electronic gadgets and devices',
        image_url: 'electronics.jpg',
        sort_order: 1,
        is_active: true
      },
      {
        name: 'Fashion',
        slug: 'fashion',
        description: 'Trendy clothing and accessories',
        image_url: 'fashion.jpg',
        sort_order: 2,
        is_active: true
      },
      {
        name: 'Home & Garden',
        slug: 'home-garden',
        description: 'Everything for your home and garden',
        image_url: 'home.jpg',
        sort_order: 3,
        is_active: true
      },
      {
        name: 'Sports',
        slug: 'sports',
        description: 'Sports equipment and activewear',
        image_url: 'sports.jpg',
        sort_order: 4,
        is_active: true
      }
    ];

    console.log('📁 Creating categories...');
    for (const category of categories) {
      const { data, error } = await supabase
        .from('categories')
        .insert(category)
        .select()
        .single();

      if (error && !error.message.includes('duplicate key')) {
        console.error(`❌ Error creating category ${category.name}:`, error);
      } else if (data) {
        console.log(`✅ Created category: ${category.name}`);
      }
    }

    // Get created categories
    const { data: createdCategories, error: catError } = await supabase
      .from('categories')
      .select('*')
      .eq('is_active', true);

    if (catError) {
      console.error('❌ Error fetching categories:', catError);
      return;
    }

    console.log(`\n📦 Creating products for ${createdCategories.length} categories...`);

    // Create many products to get 90+ total
    const products = [];
    
    // Electronics products (30 products)
    const electronicsProducts = [
      'Laptop Pro 15"', 'Gaming Desktop PC', 'Wireless Mouse', 'Mechanical Keyboard',
      '4K Monitor', 'Webcam HD', 'USB-C Hub', 'External SSD 1TB', 'Graphics Card RTX',
      'Power Bank 20000mAh', 'Bluetooth Speakers', 'Smart Watch', 'Tablet Pro',
      'Wireless Earbuds', 'Smartphone X', 'Drone Camera', 'VR Headset',
      'Smart Home Hub', 'Security Camera', 'Router WiFi 6', 'Network Switch',
      'Cable Management', 'Desk Lamp LED', 'Phone Stand', 'Laptop Stand',
      'Cooling Pad', 'Screen Protector', 'Charging Station', 'Microphone USB'
    ];

    electronicsProducts.forEach((name, index) => {
      products.push({
        name,
        category: 'Electronics',
        price: Math.floor(Math.random() * 2000) + 100,
        image_url: `electronics-${index + 1}.jpg`
      });
    });

    // Fashion products (25 products)
    const fashionProducts = [
      'Designer T-Shirt', 'Classic Jeans', 'Leather Jacket', 'Sneakers Pro',
      'Summer Dress', 'Winter Coat', 'Business Suit', 'Casual Shorts',
      'Sports Jersey', 'Running Shoes', 'Handbag Premium', 'Wallet Leather',
      'Sunglasses UV', 'Watch Classic', 'Belt Genuine', 'Scarf Silk',
      'Hat Baseball', 'Gloves Winter', 'Socks Cotton', 'Underwear Set',
      'Swimsuit Beach', 'Pajamas Comfort', 'Robe Luxury', 'Boots Ankle',
      'Sandals Summer'
    ];

    fashionProducts.forEach((name, index) => {
      products.push({
        name,
        category: 'Fashion',
        price: Math.floor(Math.random() * 300) + 20,
        image_url: `fashion-${index + 1}.jpg`
      });
    });

    // Home & Garden products (20 products)
    const homeProducts = [
      'Coffee Maker Deluxe', 'Garden Tool Set', 'LED Desk Lamp', 'Plant Collection',
      'Kitchen Knife Set', 'Cookware Set', 'Blender Professional', 'Toaster Oven',
      'Air Purifier', 'Humidifier Cool', 'Vacuum Cleaner', 'Mop Steam',
      'Curtains Blackout', 'Rug Persian', 'Pillow Set', 'Blanket Wool',
      'Mirror Wall', 'Clock Digital', 'Picture Frame', 'Storage Box'
    ];

    homeProducts.forEach((name, index) => {
      products.push({
        name,
        category: 'Home & Garden',
        price: Math.floor(Math.random() * 200) + 15,
        image_url: `home-${index + 1}.jpg`
      });
    });

    // Sports products (20 products)
    const sportsProducts = [
      'Yoga Mat Premium', 'Dumbbells Set', 'Running Shoes', 'Water Bottle',
      'Tennis Racket', 'Basketball', 'Football Soccer', 'Golf Clubs Set',
      'Bicycle Mountain', 'Treadmill Electric', 'Exercise Bike', 'Rowing Machine',
      'Jump Rope', 'Resistance Bands', 'Punching Bag', 'Gloves Boxing',
      'Swimming Goggles', 'Skateboard Pro', 'Helmet Safety', 'Knee Pads'
    ];

    sportsProducts.forEach((name, index) => {
      products.push({
        name,
        category: 'Sports',
        price: Math.floor(Math.random() * 400) + 25,
        image_url: `sports-${index + 1}.jpg`
      });
    });

    console.log(`Creating ${products.length} products...`);

    for (const product of products) {
      const category = createdCategories.find(cat => cat.name === product.category);
      if (!category) {
        console.log(`⚠️ Category not found for product: ${product.name}`);
        continue;
      }

      const { data, error } = await supabase
        .from('products')
        .insert({
          name: product.name,
          slug: product.name.toLowerCase().replace(/[^a-z0-9]+/g, '-') + '-' + Date.now() + Math.random().toString(36).substr(2, 9),
          description: `High-quality ${product.name.toLowerCase()} with premium features and modern design.`,
          sku: product.name.toLowerCase().replace(/[^a-z0-9]+/g, '-').toUpperCase(),
          price: product.price,
          category_id: category.id,
          images: [product.image_url],
          status: 'active',
          featured: Math.random() > 0.8, // 20% chance of being featured
          inventory_quantity: Math.floor(Math.random() * 100) + 10,
          track_inventory: true,
          weight: Math.round(Math.random() * 5000) / 1000,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        })
        .select()
        .single();

      if (error && !error.message.includes('duplicate key')) {
        console.error(`❌ Error creating product ${product.name}:`, error);
      } else if (data) {
        console.log(`✅ Created product: ${product.name} ($${product.price})`);
      }
    }

    console.log('\n🎉 Sample data creation completed!');
    
    // Verify created data
    const { data: finalCategories } = await supabase.from('categories').select('*');
    const { data: finalProducts } = await supabase.from('products').select('*');
    
    console.log(`\n📊 Summary:`);
    console.log(`   Categories: ${finalCategories?.length || 0}`);
    console.log(`   Products: ${finalProducts?.length || 0}`);

  } catch (error) {
    console.error('❌ Error creating sample data:', error);
  }
}

createSampleData();
