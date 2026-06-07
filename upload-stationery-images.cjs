// Upload stationery product images to Supabase Storage
const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
const path = require('path');
require('dotenv').config({ path: './frontend/.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('Missing Supabase credentials');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

// Stationery products and their image paths
const stationeryImages = [
  { name: 'notebook-set.jpg', url: 'https://images.unsplash.com/photo-1531346878377-a5be20888e57?w=400&h=400&fit=crop' },
  { name: 'gel-pens.jpg', url: 'https://images.unsplash.com/photo-1585336261022-680e295ce3fe?w=400&h=400&fit=crop' },
  { name: 'desk-organizer.jpg', url: 'https://images.unsplash.com/photo-1506439773649-6e0eb8cfb237?w=400&h=400&fit=crop' },
  { name: 'sticky-notes.jpg', url: 'https://images.unsplash.com/photo-1586075010923-2dd4570fb338?w=400&h=400&fit=crop' },
  { name: 'calculator.jpg', url: 'https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=400&h=400&fit=crop' }
];

async function downloadImage(url, filepath) {
  const response = await fetch(url);
  const arrayBuffer = await response.arrayBuffer();
  const buffer = Buffer.from(arrayBuffer);
  fs.writeFileSync(filepath, buffer);
  return buffer;
}

async function uploadStationeryImages() {
  console.log('🔍 Uploading stationery images to Supabase Storage...\n');

  // Create stationery folder if it doesn't exist
  console.log('📁 Creating stationery folder...');
  const { error: folderError } = await supabase.storage
    .from('product-images')
    .upload('stationery/.empty', Buffer.from(''), { upsert: true });
  
  if (folderError && !folderError.message.includes('already exists')) {
    console.log('Note: Folder may already exist or error is non-critical:', folderError.message);
  } else {
    console.log('✅ Stationery folder ready');
  }

  // Upload each image
  for (const image of stationeryImages) {
    try {
      console.log(`📤 Uploading ${image.name}...`);
      
      // Download image from URL
      const tempPath = path.join(__dirname, 'temp', image.name);
      const tempDir = path.join(__dirname, 'temp');
      
      if (!fs.existsSync(tempDir)) {
        fs.mkdirSync(tempDir, { recursive: true });
      }
      
      await downloadImage(image.url, tempPath);
      
      // Read file
      const fileBuffer = fs.readFileSync(tempPath);
      
      // Upload to Supabase
      const { data, error } = await supabase.storage
        .from('product-images')
        .upload(`stationery/${image.name}`, fileBuffer, {
          upsert: true,
          contentType: 'image/jpeg'
        });
      
      // Clean up temp file
      fs.unlinkSync(tempPath);
      
      if (error) {
        console.error(`❌ Error uploading ${image.name}:`, error.message);
      } else {
        console.log(`✅ Uploaded ${image.name}`);
      }
    } catch (error) {
      console.error(`❌ Error processing ${image.name}:`, error.message);
    }
  }

  console.log('\n✅ Stationery image upload complete');
}

async function verifyUploads() {
  console.log('\n🔍 Verifying uploads...\n');
  
  const { data: files, error } = await supabase.storage
    .from('product-images')
    .list('stationery', { limit: 100 });
  
  if (error) {
    console.error('❌ Error listing stationery folder:', error.message);
  } else {
    console.log(`✅ Found ${files.length} files in stationery folder:`);
    files.forEach(file => {
      console.log(`  - ${file.name}`);
    });
  }
}

async function main() {
  try {
    await uploadStationeryImages();
    await verifyUploads();
    console.log('\n🎉 Stationery images uploaded successfully!');
  } catch (error) {
    console.error('\n❌ Failed to upload stationery images:', error.message);
    process.exit(1);
  }
}

main();
