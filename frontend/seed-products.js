const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error('Missing Supabase configuration');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

const categories = [
  { name: 'Clothing', slug: 'clothing', description: 'Afrocentric clothing and apparel' },
  { name: 'Accessories', slug: 'accessories', description: 'Fashion accessories and jewelry' },
  { name: 'Home & Living', slug: 'home-living', description: 'Home decor and lifestyle products' },
  { name: 'Art & Crafts', slug: 'art-crafts', description: 'Traditional and contemporary art pieces' },
  { name: 'Beauty & Health', slug: 'beauty-health', description: 'Natural beauty and health products' },
  { name: 'Food & Beverages', slug: 'food-beverages', description: 'Authentic African food and beverages' }
];

const sampleProducts = [
  {
    name: 'African Dashiki Shirt',
    slug: 'african-dashiki-shirt',
    description: 'Beautiful traditional African dashiki shirt featuring authentic patterns and vibrant colors. Made with quality cotton fabric.',
    price: 45.99,
    images: ['https://picsum.photos/400/400?random=1'],
    inventory_quantity: 50,
    status: 'active',
    featured: true,
    sku: 'DASH-001',
    category_slug: 'clothing'
  },
  {
    name: 'Ankara Print Dress',
    slug: 'ankara-print-dress',
    description: 'Elegant Ankara print dress perfect for special occasions. Features traditional African wax print patterns.',
    price: 65.99,
    images: ['https://picsum.photos/400/400?random=2'],
    inventory_quantity: 30,
    status: 'active',
    featured: true,
    sku: 'ANK-001',
    category_slug: 'clothing'
  },
  {
    name: 'Handwoven Basket',
    slug: 'handwoven-basket',
    description: 'Traditional handwoven basket made by skilled artisans. Perfect for home decor or storage.',
    price: 25.99,
    images: ['https://picsum.photos/400/400?random=3'],
    inventory_quantity: 20,
    status: 'active',
    featured: false,
    sku: 'BASK-001',
    category_slug: 'home-living'
  },
  {
    name: 'Shea Butter Cream',
    slug: 'shea-butter-cream',
    description: 'Natural shea butter cream for skin care. Rich in vitamins and perfect for moisturizing.',
    price: 15.99,
    images: ['https://picsum.photos/400/400?random=4'],
    inventory_quantity: 100,
    status: 'active',
    featured: false,
    sku: 'SHEA-001',
    category_slug: 'beauty-health'
  },
  {
    name: 'Traditional Necklace',
    slug: 'traditional-necklace',
    description: 'Beautiful traditional African necklace made with beads and crafted by local artisans.',
    price: 35.99,
    images: ['https://picsum.photos/400/400?random=5'],
    inventory_quantity: 25,
    status: 'active',
    featured: true,
    sku: 'NECK-001',
    category_slug: 'accessories'
  },
  {
    name: 'Banku Mix',
    slug: 'banku-mix',
    description: 'Authentic Banku mix for preparing traditional Ghanaian dish. Easy to prepare and delicious.',
    price: 8.99,
    images: ['https://picsum.photos/400/400?random=6'],
    inventory_quantity: 75,
    status: 'active',
    featured: false,
    sku: 'BANK-001',
    category_slug: 'food-beverages'
  }
];

async function seedCategories() {
  try {
    console.log('📁 Seeding categories...');
    
    const { data, error } = await supabase
      .from('categories')
      .upsert(categories, {
        onConflict: 'slug',
        ignoreDuplicates: false
      })
      .select();

    if (error) {
      console.error('❌ Error seeding categories:', error);
      return null;
    }

    console.log(`✅ Successfully seeded ${data?.length || 0} categories`);
    return data;
  } catch (error) {
    console.error('❌ Unexpected error seeding categories:', error);
    return null;
  }
}

async function seedProducts() {
  try {
    console.log('🌱 Starting to seed products...');
    
    // First seed categories
    const categoriesData = await seedCategories();
    if (!categoriesData) {
      console.error('❌ Failed to seed categories, aborting product seeding');
      process.exit(1);
    }

    // Create category slug to ID mapping
    const categoryMap = {};
    categoriesData.forEach(cat => {
      categoryMap[cat.slug] = cat.id;
    });

    // Update products with category IDs
    const productsWithCategoryIds = sampleProducts.map(product => ({
      ...product,
      category_id: categoryMap[product.category_slug]
    }));

    // Remove category_slug field
    const cleanProducts = productsWithCategoryIds.map(({ category_slug, ...product }) => product);

    const { data, error } = await supabase
      .from('products')
      .upsert(cleanProducts, {
        onConflict: 'slug',
        ignoreDuplicates: false
      })
      .select();

    if (error) {
      console.error('❌ Error seeding products:', error);
      process.exit(1);
    }

    console.log(`✅ Successfully seeded ${data?.length || 0} products`);
    console.log('📦 Products:', data?.map(p => p.name));
    
  } catch (error) {
    console.error('❌ Unexpected error:', error);
    process.exit(1);
  }
}

seedProducts();
