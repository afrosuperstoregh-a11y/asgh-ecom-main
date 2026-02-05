const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '.env.local') });

// Supabase configuration - use the correct environment variables
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || process.env.SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('❌ Missing Supabase configuration:');
  console.error('   NEXT_PUBLIC_SUPABASE_URL:', supabaseUrl ? '✅' : '❌ Missing');
  console.error('   SUPABASE_SERVICE_ROLE_KEY:', supabaseServiceKey ? '✅' : '❌ Missing');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

// Product images configuration
const productImages = [
  {
    filename: 'girls-dashiki.jpg',
    sku: '100206',
    description: 'Girls Dashiki - Latest style ladies Dashiki dress'
  },
  {
    filename: 'boys-dashiki.jpg',
    sku: '100207', 
    description: 'Boys Dashiki - Latest style boys Dashiki dress'
  },
  {
    filename: 'banku-flour.jpg',
    sku: '100201',
    description: 'Banku Flour - Premium quality fermented banku flour'
  },
  {
    filename: 'banku-mix.jpg',
    sku: '100202',
    description: 'Banku Mix - High quality banku mix powder'
  },
  {
    filename: 'barbeque.jpg',
    sku: '100203',
    description: 'Barbeque - Delicious grilled barbeque skewers'
  }
];

async function uploadProductImages() {
  try {
    console.log('🚀 Uploading product images to Supabase Storage...');

    // Create product-images bucket if it doesn't exist
    const { data: buckets } = await supabase.storage.listBuckets();
    const bucketExists = buckets?.some(bucket => bucket.name === 'product-images');

    if (!bucketExists) {
      console.log('📦 Creating product-images bucket...');
      const { error: bucketError } = await supabase.storage.createBucket('product-images', {
        public: true,
        fileSizeLimit: 5242880, // 5MB
        allowedMimeTypes: ['image/jpeg', 'image/jpg', 'image/png', 'image/webp', 'image/gif']
      });

      if (bucketError) {
        console.error('❌ Error creating bucket:', bucketError);
        return;
      }
      console.log('✅ Bucket created successfully');
    } else {
      console.log('✅ Bucket already exists');
    }

    // Upload images (simulated - you'll need to provide actual image files)
    console.log('📸 Uploading product images...');
    
    for (const image of productImages) {
      // Check if image file exists locally (try both .jpg and .svg)
      const imagePathJpg = path.join(__dirname, 'product_images', image.filename);
      const imagePathSvg = path.join(__dirname, 'product_images', image.filename.replace('.jpg', '.svg'));
      let imagePath = imagePathJpg;
      
      if (!fs.existsSync(imagePathJpg) && fs.existsSync(imagePathSvg)) {
        imagePath = imagePathSvg;
      }
      
      if (fs.existsSync(imagePath)) {
        console.log(`📤 Uploading ${image.filename}...`);
        
        const fileBuffer = fs.readFileSync(imagePath);
        
        // Determine content type
        const contentType = image.filename.endsWith('.svg') ? 'image/svg+xml' : 'image/jpeg';
        
        const { data, error } = await supabase.storage
          .from('product-images')
          .upload(image.filename, fileBuffer, {
            contentType: contentType,
            cacheControl: '3600',
            upsert: true
          });

        if (error) {
          console.error(`❌ Error uploading ${image.filename}:`, error);
        } else {
          console.log(`✅ ${image.filename} uploaded successfully`);
          
          // Get public URL
          const { data: publicUrlData } = supabase.storage
            .from('product-images')
            .getPublicUrl(image.filename);
          
          console.log(`   🔗 Public URL: ${publicUrlData.publicUrl}`);
        }
      } else {
        console.log(`⚠️  Image file not found: ${imagePath}`);
        console.log(`   💡 Please place the actual image files in a 'product_images' directory`);
        
        // Generate placeholder URL for now
        const placeholderUrl = `${supabaseUrl}/storage/v1/object/public/product-images/${image.filename}`;
        console.log(`   🔗 Placeholder URL: ${placeholderUrl}`);
      }
    }

    // Update product records with image URLs
    console.log('\n🔄 Updating product records with image URLs...');
    
    for (const image of productImages) {
      const imageUrl = `${supabaseUrl}/storage/v1/object/public/product-images/${image.filename}`;
      
      const { data, error } = await supabase
        .from('products')
        .update({ 
          images: [imageUrl]
        })
        .eq('sku', image.sku)
        .select();

      if (error) {
        console.error(`❌ Error updating product ${image.sku}:`, error);
      } else if (data && data.length > 0) {
        console.log(`✅ Updated product ${image.sku} (${data[0].name}) with image URL`);
      } else {
        console.log(`⚠️  Product with SKU ${image.sku} not found`);
      }
    }

    // Verify all products have images
    console.log('\n🔍 Verifying product images...');
    const { data: products } = await supabase
      .from('products')
      .select('name, sku, images, image_url')
      .order('name');

    if (products && products.length > 0) {
      console.log('\n📊 Product image status:');
      products.forEach(product => {
        const hasImage = product.images && product.images.length > 0;
        console.log(`   ${product.name} (${product.sku}): ${hasImage ? '✅ Has image' : '❌ No image'}`);
        if (hasImage) {
          console.log(`      URL: ${product.images[0]}`);
        }
      });
    }

    console.log('\n🎉 Product image upload complete!');
    console.log('📝 Next steps:');
    console.log('   1. Place actual product images in the "product_images" directory');
    console.log('   2. Run this script again to upload real images');
    console.log('   3. Update frontend to use API data instead of mock data');

  } catch (error) {
    console.error('❌ Error during image upload:', error);
    process.exit(1);
  }
}

// Create product_images directory if it doesn't exist
const productImagesDir = path.join(__dirname, 'product_images');
if (!fs.existsSync(productImagesDir)) {
  fs.mkdirSync(productImagesDir);
  console.log('📁 Created product_images directory');
  console.log('💡 Please place your product images in this directory:');
  productImages.forEach(img => {
    console.log(`   - ${img.filename}`);
  });
}

// Run the upload
uploadProductImages();
