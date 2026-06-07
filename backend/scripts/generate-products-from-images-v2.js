const { getSupabaseServer } = require('../lib/supabase/server');
require('dotenv').config();

// Default categories to create if they don't exist
const DEFAULT_CATEGORIES = [
  { name: 'Electronics', description: 'Electronic devices and accessories' },
  { name: 'Accessories', description: 'Fashion and lifestyle accessories' },
  { name: 'Home', description: 'Home and living products' },
  { name: 'Office', description: 'Office and work supplies' },
  { name: 'Lifestyle', description: 'Lifestyle and wellness products' }
];

// Helper function to generate slug from name
function generateSlug(name) {
  return name
    .toLowerCase()
    .replace(/[^a-z0-9 -]/g, '')
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-')
    .trim();
}

// Helper function to generate product name from filename
function generateProductName(filename) {
  // Remove file extension and replace dashes/underscores with spaces
  const nameWithoutExt = filename.replace(/\.[^/.]+$/, '');
  const name = nameWithoutExt.replace(/[-_]/g, ' ');
  
  // Capitalize first letter of each word
  return name.split(' ')
    .map(word => word.charAt(0).toUpperCase() + word.slice(1))
    .join(' ');
}

// Helper function to generate random price
function generateRandomPrice(min = 10, max = 200) {
  return Math.round((Math.random() * (max - min) + min) * 100) / 100;
}

// Fetch images from Supabase storage
async function fetchImagesFromStorage() {
  try {
    console.log('🔍 Fetching images from Supabase storage...');
    
    const supabase = getSupabaseServer();
    
    const { data, error } = await supabase.storage
      .from('products')
      .list('', { limit: 1000 });

    if (error) {
      console.error('❌ Error fetching images:', error);
      throw error;
    }

    console.log(`✅ Found ${data.length} images in storage`);
    return data;
  } catch (error) {
    console.error('❌ Failed to fetch images from storage:', error);
    throw error;
  }
}

// Get or create categories
async function getOrCreateCategories() {
  try {
    console.log('📂 Checking existing categories...');
    
    const supabase = getSupabaseServer();
    
    // Get existing categories
    const { data: existingCategories, error: fetchError } = await supabase
      .from('categories')
      .select('*')
      .eq('is_active', true);

    if (fetchError) {
      console.error('❌ Error fetching categories:', fetchError);
      throw fetchError;
    }

    const categories = existingCategories || [];
    console.log(`✅ Found ${categories.length} existing categories`);

    // If no categories exist, create default ones
    if (categories.length === 0) {
      console.log('📝 Creating default categories...');
      
      for (const categoryData of DEFAULT_CATEGORIES) {
        const slug = generateSlug(categoryData.name);
        
        const { data: newCategory, error: createError } = await supabase
          .from('categories')
          .insert({
            name: categoryData.name,
            slug: slug,
            description: categoryData.description,
            is_active: true,
            sort_order: 0,
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString()
          })
          .select()
          .single();

        if (createError) {
          console.error(`❌ Error creating category ${categoryData.name}:`, createError);
          continue;
        }

        categories.push(newCategory);
        console.log(`✅ Created category: ${categoryData.name}`);
      }
    }

    return categories;
  } catch (error) {
    console.error('❌ Failed to get/create categories:', error);
    throw error;
  }
}

// Generate products from images
async function generateProducts(images, categories) {
  try {
    console.log('🛍️  Generating products from images...');
    
    if (categories.length === 0) {
      throw new Error('No categories available to assign products');
    }

    const products = [];
    
    for (const image of images) {
      if (!image.name) continue;
      
      // Skip if this is not an image file
      const imageExtensions = ['.jpg', '.jpeg', '.png', '.gif', '.webp', '.bmp'];
      const fileExtension = image.name.toLowerCase().substring(image.name.lastIndexOf('.'));
      if (!imageExtensions.includes(fileExtension)) {
        console.log(`⏭️  Skipping non-image file: ${image.name}`);
        continue;
      }

      const productName = generateProductName(image.name);
      const slug = generateSlug(productName) + '-' + Date.now();
      const randomCategory = categories[Math.floor(Math.random() * categories.length)];
      const price = generateRandomPrice();
      
      // Generate public URL for the image
      const supabaseUrl = process.env.SUPABASE_URL || 'http://127.0.0.1:54321';
      const imageUrl = `${supabaseUrl}/storage/v1/object/public/products/${image.name}`;
      
      const product = {
        name: productName,
        slug: slug,
        description: `High-quality ${productName.toLowerCase()} - perfect for your everyday needs. Made with premium materials for durability and style.`,
        short_description: `Premium ${productName.toLowerCase()} with excellent quality.`,
        sku: `SKU-${Date.now()}-${Math.floor(Math.random() * 10000)}`,
        price: price,
        compare_price: price * 1.2, // 20% higher compare price
        cost_price: price * 0.6, // 40% cost price
        category_id: randomCategory.id,
        status: 'active',
        featured: Math.random() > 0.8, // 20% chance of being featured
        inventory_quantity: Math.floor(Math.random() * 100) + 10,
        track_inventory: true,
        weight: Math.round(Math.random() * 5000) / 1000, // Random weight between 0 and 5kg
        image_url: imageUrl,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      };

      products.push(product);
    }

    console.log(`✅ Generated ${products.length} products`);
    return products;
  } catch (error) {
    console.error('❌ Failed to generate products:', error);
    throw error;
  }
}

// Insert products into database
async function insertProducts(products) {
  try {
    console.log(`💾 Inserting ${products.length} products into database...`);
    
    const supabase = getSupabaseServer();
    const batchSize = 20; // Insert in smaller batches to avoid timeout
    let insertedCount = 0;
    
    for (let i = 0; i < products.length; i += batchSize) {
      const batch = products.slice(i, i + batchSize);
      
      const { data, error } = await supabase
        .from('products')
        .insert(batch)
        .select();

      if (error) {
        console.error(`❌ Error inserting batch ${Math.floor(i/batchSize) + 1}:`, error);
        continue;
      }

      insertedCount += batch.length;
      console.log(`✅ Inserted batch ${Math.floor(i/batchSize) + 1}/${Math.ceil(products.length/batchSize)} (${batch.length} products)`);
    }

    console.log(`✅ Successfully inserted ${insertedCount} products`);
    return insertedCount;
  } catch (error) {
    console.error('❌ Failed to insert products:', error);
    throw error;
  }
}

// Main function
async function main() {
  try {
    console.log('🚀 Starting product generation from Supabase storage images...\n');
    
    // Step 1: Fetch images from storage
    const images = await fetchImagesFromStorage();
    
    if (images.length === 0) {
      console.log('ℹ️  No images found in storage. Nothing to process.');
      return;
    }
    
    // Step 2: Get or create categories
    const categories = await getOrCreateCategories();
    
    // Step 3: Generate products from images
    const products = await generateProducts(images, categories);
    
    if (products.length === 0) {
      console.log('ℹ️  No valid products generated from images.');
      return;
    }
    
    // Step 4: Insert products into database
    const insertedCount = await insertProducts(products);
    
    console.log('\n🎉 Product generation completed!');
    console.log(`📊 Summary:`);
    console.log(`   - Images found: ${images.length}`);
    console.log(`   - Categories available: ${categories.length}`);
    console.log(`   - Products generated: ${products.length}`);
    console.log(`   - Products inserted: ${insertedCount}`);
    
  } catch (error) {
    console.error('\n❌ Product generation failed:', error);
    process.exit(1);
  }
}

// Run the script
if (require.main === module) {
  main();
}

module.exports = { main };
