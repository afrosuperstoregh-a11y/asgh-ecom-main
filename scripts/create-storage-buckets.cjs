/**
 * Create Supabase Storage Buckets
 * 
 * This script creates the required storage buckets for the AfroSuperStore e-commerce application.
 * Run this script after setting up your Supabase project and before deploying.
 * 
 * Usage:
 *   node scripts/create-storage-buckets.cjs
 * 
 * Prerequisites:
 *   - Supabase project created
 *   - SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY set in .env
 */

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

// Bucket configurations
const buckets = [
  {
    name: 'products',
    public: true,
    fileSizeLimit: 5242880, // 5MB
    allowedMimeTypes: ['image/*'],
    description: 'Product images for the e-commerce store'
  },
  {
    name: 'product-images',
    public: true,
    fileSizeLimit: 5242880, // 5MB
    allowedMimeTypes: ['image/*'],
    description: 'Additional product images and variants'
  },
  {
    name: 'category-images',
    public: true,
    fileSizeLimit: 2097152, // 2MB
    allowedMimeTypes: ['image/*'],
    description: 'Category and collection images'
  },
  {
    name: 'user-avatars',
    public: true,
    fileSizeLimit: 1048576, // 1MB
    allowedMimeTypes: ['image/*'],
    description: 'User profile avatar images'
  }
];

async function createBucket(bucketConfig) {
  try {
    console.log(`\n📦 Creating bucket: ${bucketConfig.name}`);
    
    // Check if bucket already exists
    const { data: existingBuckets, error: listError } = await supabase.storage.listBuckets();
    
    if (listError) {
      console.error(`❌ Error listing buckets:`, listError);
      return false;
    }
    
    const bucketExists = existingBuckets.find(b => b.name === bucketConfig.name);
    
    if (bucketExists) {
      console.log(`✅ Bucket '${bucketConfig.name}' already exists`);
      return true;
    }
    
    // Create the bucket
    const { data, error } = await supabase.storage.createBucket(bucketConfig.name, {
      public: bucketConfig.public,
      fileSizeLimit: bucketConfig.fileSizeLimit,
      allowedMimeTypes: bucketConfig.allowedMimeTypes
    });
    
    if (error) {
      console.error(`❌ Error creating bucket '${bucketConfig.name}':`, error);
      return false;
    }
    
    console.log(`✅ Bucket '${bucketConfig.name}' created successfully`);
    console.log(`   Public: ${bucketConfig.public}`);
    console.log(`   File size limit: ${bucketConfig.fileSizeLimit / 1024 / 1024}MB`);
    console.log(`   Allowed types: ${bucketConfig.allowedMimeTypes.join(', ')}`);
    
    return true;
    
  } catch (error) {
    console.error(`❌ Unexpected error creating bucket '${bucketConfig.name}':`, error);
    return false;
  }
}

async function uploadPlaceholderImages() {
  try {
    console.log('\n📸 Checking for placeholder images...');
    
    // Upload placeholder images if they exist in public folder
    const fs = require('fs');
    const path = require('path');
    
    const placeholderImages = [
      { bucket: 'products', file: 'public/placeholder-product.svg' },
      { bucket: 'category-images', file: 'public/placeholder-category.svg' },
      { bucket: 'user-avatars', file: 'public/placeholder-avatar.svg' }
    ];
    
    for (const placeholder of placeholderImages) {
      const filePath = path.join(process.cwd(), placeholder.file);
      
      if (fs.existsSync(filePath)) {
        console.log(`   Found placeholder: ${placeholder.file}`);
        
        const fileContent = fs.readFileSync(filePath);
        const fileName = path.basename(placeholder.file);
        
        const { data, error } = await supabase.storage
          .from(placeholder.bucket)
          .upload(fileName, fileContent, {
            contentType: 'image/svg+xml',
            upsert: true
          });
        
        if (error) {
          console.log(`   ⚠️  Could not upload ${fileName}:`, error.message);
        } else {
          console.log(`   ✅ Uploaded ${fileName} to ${placeholder.bucket}`);
        }
      } else {
        console.log(`   ℹ️  Placeholder not found: ${placeholder.file}`);
      }
    }
    
  } catch (error) {
    console.error('❌ Error uploading placeholder images:', error);
  }
}

async function verifyBuckets() {
  try {
    console.log('\n🔍 Verifying bucket configuration...');
    
    const { data: buckets, error } = await supabase.storage.listBuckets();
    
    if (error) {
      console.error('❌ Error listing buckets:', error);
      return false;
    }
    
    console.log(`\n✅ Found ${buckets.length} buckets:`);
    
    for (const bucket of buckets) {
      console.log(`   - ${bucket.name}`);
      console.log(`     Public: ${bucket.public ? 'Yes' : 'No'}`);
      console.log(`     Created: ${bucket.created_at}`);
      
      // List files in bucket
      const { data: files, error: filesError } = await supabase.storage.from(bucket.name).list('', { limit: 10 });
      
      if (!filesError) {
        console.log(`     Files: ${files.length}`);
      }
    }
    
    return true;
    
  } catch (error) {
    console.error('❌ Error verifying buckets:', error);
    return false;
  }
}

async function main() {
  console.log('🚀 Starting Supabase Storage bucket setup...\n');
  
  let successCount = 0;
  
  // Create all buckets
  for (const bucketConfig of buckets) {
    const success = await createBucket(bucketConfig);
    if (success) {
      successCount++;
    }
  }
  
  console.log(`\n📊 Bucket creation summary: ${successCount}/${buckets.length} successful`);
  
  // Upload placeholder images
  await uploadPlaceholderImages();
  
  // Verify all buckets
  await verifyBuckets();
  
  console.log('\n✨ Storage bucket setup complete!');
  console.log('\n⚠️  Important: Run the storage policies migration:');
  console.log('   supabase db push');
  console.log('   or execute: supabase/migrations/009_setup_storage_buckets.sql');
  console.log('\n📝 This will configure the RLS policies for storage access.');
}

main().catch(error => {
  console.error('\n❌ Storage bucket setup failed:', error);
  process.exit(1);
});
