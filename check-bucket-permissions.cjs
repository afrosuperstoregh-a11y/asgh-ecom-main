const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = 'https://lljxxaejmueoxsaqaowf.supabase.co';
const supabaseServiceKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imxsanh4YWVqbXVlb3hzYXFhb3dmIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3ODEwODIyMSwiZXhwIjoyMDkzNjg0MjIxfQ.qXvtkAhMYRSOHSQUFVdLGQypZ0_k-Z5Y2TlDDYJBzFQ';

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function checkBucketPermissions() {
  try {
    console.log('🔍 Checking bucket permissions and file existence...\n');
    
    // Check if bucket is public
    const { data: bucket, error: bucketError } = await supabase
      .storage
      .getBucket('product-images');
    
    if (bucketError) {
      console.error('❌ Error getting bucket info:', bucketError);
      return;
    }
    
    console.log('📦 Bucket info:');
    console.log(`   Name: ${bucket.name}`);
    console.log(`   Public: ${bucket.public}`);
    console.log(`   File size limit: ${bucket.file_size_limit}`);
    console.log(`   Allowed mime types: ${bucket.allowed_mime_types}`);
    console.log('');
    
    // Try to get a signed URL for a test file
    const testPath = 'books&stationeries/holy_bible_KJV2.jpg';
    console.log(`🔍 Testing signed URL for: ${testPath}`);
    
    const { data: signedUrlData, error: signedUrlError } = await supabase
      .storage
      .from('product-images')
      .createSignedUrl(testPath, 3600);
    
    if (signedUrlError) {
      console.error('❌ Error creating signed URL:', signedUrlError);
    } else {
      console.log(`✅ Signed URL created: ${signedUrlData.signedUrl.substring(0, 100)}...`);
      
      // Test the signed URL
      try {
        const response = await fetch(signedUrlData.signedUrl, { method: 'HEAD' });
        console.log(`✅ Signed URL works: ${response.status}`);
      } catch (err) {
        console.error(`❌ Signed URL failed: ${err.message}`);
      }
    }
    
    // Try to download the file directly
    console.log(`\n🔍 Testing direct download for: ${testPath}`);
    const { data: downloadData, error: downloadError } = await supabase
      .storage
      .from('product-images')
      .download(testPath);
    
    if (downloadError) {
      console.error('❌ Error downloading file:', downloadError);
    } else {
      console.log(`✅ File downloaded successfully, size: ${downloadData.size} bytes`);
    }
    
  } catch (error) {
    console.error('❌ Error:', error.message);
  }
}

checkBucketPermissions();
