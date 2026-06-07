const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseAnonKey = process.env.SUPABASE_ANON_KEY;

const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  }
});

async function checkStorage() {
  try {
    console.log('🔍 Checking storage buckets...');
    
    // List all buckets
    const { data: buckets, error: bucketsError } = await supabase.storage.listBuckets();
    
    if (bucketsError) {
      console.error('❌ Error listing buckets:', bucketsError);
      return;
    }
    
    console.log(`✅ Found ${buckets.length} buckets:`);
    buckets.forEach(bucket => {
      console.log(`   - ${bucket.name} (${bucket.public ? 'public' : 'private'})`);
    });
    
    // Check if product-images bucket exists
    const productsBucket = buckets.find(b => b.name === 'product-images');
    
    if (!productsBucket) {
      console.log('❌ No "product-images" bucket found. Creating one...');
      
      const { data: newBucket, error: createError } = await supabase.storage.createBucket('product-images', {
        public: true,
        allowedMimeTypes: ['image/*'],
        fileSizeLimit: 10485760 // 10MB
      });
      
      if (createError) {
        console.error('❌ Error creating bucket:', createError);
        return;
      }
      
      console.log('✅ Created "product-images" bucket');
    } else {
      console.log('✅ "product-images" bucket exists');
      
      // List files in product-images bucket
      const { data: files, error: filesError } = await supabase.storage.from('product-images').list('', { limit: 1000 });
      
      if (filesError) {
        console.error('❌ Error listing files:', filesError);
        return;
      }
      
      console.log(`✅ Found ${files.length} files in product-images bucket:`);
      files.forEach((file, index) => {
        console.log(`   ${index + 1}. ${file.name} (${file.id})`);
      });
      
      if (files.length === 0) {
        console.log('ℹ️  No files found. You need to upload images to the product-images bucket.');
        console.log('ℹ️  You can upload images via:');
        console.log('   1. Supabase Studio: http://127.0.0.1:54323');
        console.log('   2. CLI: npx supabase storage upload');
        console.log('   3. Or create sample images for testing');
      }
    }
    
  } catch (error) {
    console.error('❌ Error checking storage:', error);
  }
}

checkStorage();
