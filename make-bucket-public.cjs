const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = 'https://lljxxaejmueoxsaqaowf.supabase.co';
const supabaseServiceKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imxsanh4YWVqbXVlb3hzYXFhb3dmIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3ODEwODIyMSwiZXhwIjoyMDkzNjg0MjIxfQ.qXvtkAhMYRSOHSQUFVdLGQypZ0_k-Z5Y2TlDDYJBzFQ';

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function makeBucketPublic() {
  try {
    console.log('🔧 Making product-images bucket public...\n');
    
    const { data, error } = await supabase
      .storage
      .updateBucket('product-images', { public: true });
    
    if (error) {
      console.error('❌ Error making bucket public:', error);
      return;
    }
    
    console.log('✅ Bucket is now public\n');
    
    // Verify the change
    const { data: bucket, error: bucketError } = await supabase
      .storage
      .getBucket('product-images');
    
    if (bucketError) {
      console.error('❌ Error getting bucket info:', bucketError);
      return;
    }
    
    console.log('📦 Updated bucket info:');
    console.log(`   Name: ${bucket.name}`);
    console.log(`   Public: ${bucket.public}`);
    console.log('');
    
    // Test a public URL
    const testUrl = `${supabaseUrl}/storage/v1/object/public/product-images/books&stationeries/holy_bible_KJV2.jpg`;
    console.log(`🔍 Testing public URL: ${testUrl}`);
    
    try {
      const response = await fetch(testUrl, { method: 'HEAD' });
      console.log(`✅ Public URL works: ${response.status}`);
    } catch (err) {
      console.error(`❌ Public URL failed: ${err.message}`);
    }
    
  } catch (error) {
    console.error('❌ Error:', error.message);
  }
}

makeBucketPublic();
