/**
 * Create product-images storage bucket using Supabase Management API
 * This script creates the bucket via SQL since we have service role access
 */

const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error('Missing SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function createBucket() {
  console.log('Creating product-images storage bucket...\n');
  
  // First, try to list buckets to see if it already exists
  const { data: buckets, error: listError } = await supabase.storage.listBuckets();
  
  if (listError) {
    console.error('Error listing buckets:', listError);
    process.exit(1);
  }
  
  console.log('Existing buckets:', buckets.map(b => b.name));
  
  const existingBucket = buckets.find(b => b.id === 'product-images');
  
  if (existingBucket) {
    console.log('\n✓ product-images bucket already exists');
    console.log('  Public:', existingBucket.public);
    console.log('  File size limit:', existingBucket.file_size_limit);
    return;
  }
  
  // Create the bucket using SQL
  console.log('\nCreating bucket via SQL...');
  
  const { data, error } = await supabase.rpc('exec_sql', {
    sql: `
      INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
      VALUES ('product-images', 'product-images', true, 10485760, ARRAY['image/jpeg', 'image/png', 'image/gif', 'image/webp'])
      ON CONFLICT (id) DO UPDATE SET
          public = true,
          file_size_limit = 10485760,
          allowed_mime_types = ARRAY['image/jpeg', 'image/png', 'image/gif', 'image/webp'];
    `
  });
  
  if (error) {
    console.error('Error creating bucket:', error);
    console.log('\nTrying alternative approach via direct SQL...');
    
    // Try using the SQL editor approach
    console.log('\nPlease run the migration file manually in Supabase SQL Editor:');
    console.log('supabase/migrations/010_create_product_images_bucket.sql');
    process.exit(1);
  }
  
  console.log('✓ Bucket created successfully');
  
  // Verify
  const { data: newBuckets } = await supabase.storage.listBuckets();
  const newBucket = newBuckets.find(b => b.id === 'product-images');
  
  if (newBucket) {
    console.log('\n✓ Verification successful');
    console.log('  Bucket ID:', newBucket.id);
    console.log('  Bucket Name:', newBucket.name);
    console.log('  Public:', newBucket.public);
  }
}

createBucket().catch(console.error);
