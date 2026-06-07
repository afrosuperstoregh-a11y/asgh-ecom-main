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

async function checkStorageContents() {
  try {
    console.log('🔍 Checking Supabase storage contents...\n');
    
    // List all buckets
    console.log('📦 Listing storage buckets...');
    const { data: buckets, error: bucketsError } = await supabase.storage.listBuckets();
    
    if (bucketsError) {
      console.error('❌ Error listing buckets:', bucketsError);
      console.log('💡 This might be due to RLS policies. Let me try to access common bucket names...');
      
      // Try common bucket names
      const commonBuckets = ['products', 'images', 'uploads', 'public', 'media'];
      
      for (const bucketName of commonBuckets) {
        console.log(`\n🔍 Trying bucket: ${bucketName}`);
        
        try {
          const { data: files, error: filesError } = await supabase.storage.from(bucketName).list('', { limit: 100 });
          
          if (filesError) {
            console.log(`   ❌ Bucket '${bucketName}' not accessible or doesn't exist`);
          } else {
            console.log(`   ✅ Found bucket '${bucketName}' with ${files.length} files:`);
            
            if (files.length > 0) {
              files.forEach((file, index) => {
                console.log(`     ${index + 1}. ${file.name} (${file.id || 'no id'})`);
                console.log(`        Size: ${file.size || 'unknown'} bytes`);
                console.log(`        Updated: ${file.updated_at || 'unknown'}`);
              });
              
              // Generate public URLs for the first few files
              console.log(`\n   📸 Sample public URLs:`);
              files.slice(0, 3).forEach((file, index) => {
                const { data: publicUrl } = supabase.storage.from(bucketName).getPublicUrl(file.name);
                console.log(`     ${index + 1}. ${publicUrl.publicUrl}`);
              });
            } else {
              console.log(`     (empty bucket)`);
            }
          }
        } catch (err) {
          console.log(`   ❌ Error accessing bucket '${bucketName}': ${err.message}`);
        }
      }
    } else {
      console.log(`✅ Found ${buckets.length} buckets:`);
      
      for (const bucket of buckets) {
        console.log(`\n📦 Bucket: ${bucket.name}`);
        console.log(`   Public: ${bucket.public ? 'Yes' : 'No'}`);
        console.log(`   Created: ${bucket.created_at}`);
        console.log(`   Updated: ${bucket.updated_at}`);
        
        // List files in this bucket
        const { data: files, error: filesError } = await supabase.storage.from(bucket.name).list('', { limit: 100 });
        
        if (filesError) {
          console.log(`   ❌ Error listing files: ${filesError.message}`);
        } else {
          console.log(`   Files: ${files.length}`);
          
          if (files.length > 0) {
            console.log('   File list:');
            files.forEach((file, index) => {
              console.log(`     ${index + 1}. ${file.name}`);
            });
            
            // Show sample URLs
            console.log(`\n   📸 Sample public URLs:`);
            files.slice(0, 3).forEach((file, index) => {
              const { data: publicUrl } = supabase.storage.from(bucket.name).getPublicUrl(file.name);
              console.log(`     ${index + 1}. ${publicUrl.publicUrl}`);
            });
          }
        }
      }
    }
    
    console.log('\n💡 If you have images but they\'re not showing up:');
    console.log('   1. Check if the bucket is public');
    console.log('   2. Check Row Level Security (RLS) policies');
    console.log('   3. Try using the service role key instead of anon key');
    console.log('   4. Access via Supabase Studio: http://127.0.0.1:54323');
    
  } catch (error) {
    console.error('❌ Error checking storage:', error);
  }
}

checkStorageContents();
