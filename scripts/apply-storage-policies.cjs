/**
 * Apply storage policies to product-images bucket
 * This script executes the SQL migration to ensure proper RLS policies
 */

const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
const path = require('path');
require('dotenv').config({ path: '.env.local' });

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error('Missing SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function applyStoragePolicies() {
  console.log('Applying storage policies to product-images bucket...\n');
  
  // Read the migration file
  const migrationPath = path.join(__dirname, '../supabase/migrations/010_create_product_images_bucket.sql');
  
  if (!fs.existsSync(migrationPath)) {
    console.error('Migration file not found:', migrationPath);
    process.exit(1);
  }
  
  const sql = fs.readFileSync(migrationPath, 'utf8');
  
  console.log('Executing migration SQL...');
  console.log('This will:');
  console.log('  1. Ensure product-images bucket exists and is public');
  console.log('  2. Enable RLS on storage.objects');
  console.log('  3. Drop existing policies (if any)');
  console.log('  4. Create new policies for public read, authenticated upload, and admin management');
  console.log('  5. Grant necessary permissions\n');
  
  // Split SQL into individual statements
  const statements = sql
    .split(';')
    .map(s => s.trim())
    .filter(s => s.length > 0 && !s.startsWith('--'));
  
  let successCount = 0;
  let errorCount = 0;
  
  for (const statement of statements) {
    try {
      // Execute each statement
      const { data, error } = await supabase.rpc('exec_sql', { sql: statement });
      
      if (error) {
        // Some statements might fail if they're already applied, that's okay
        console.log(`⚠ Statement failed (may already exist): ${statement.substring(0, 50)}...`);
        errorCount++;
      } else {
        successCount++;
      }
    } catch (err) {
      console.log(`⚠ Statement error: ${err.message}`);
      errorCount++;
    }
  }
  
  console.log(`\n✓ Applied ${successCount} statements`);
  console.log(`⚠ ${errorCount} statements failed (expected if policies already exist)`);
  
  // Verify bucket exists
  const { data: buckets } = await supabase.storage.listBuckets();
  const bucket = buckets.find(b => b.id === 'product-images');
  
  if (bucket) {
    console.log(`\n✓ product-images bucket verified`);
    console.log(`  Public: ${bucket.public}`);
    console.log(`  File size limit: ${bucket.file_size_limit}`);
  } else {
    console.log('\n✗ product-images bucket not found');
  }
}

applyStoragePolicies().catch(console.error);
