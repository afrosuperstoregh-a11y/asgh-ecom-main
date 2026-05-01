const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
const path = require('path');

// Initialize Supabase client with service role key for admin operations
const supabaseUrl = 'https://azpgqsmgyorjbqsgxuxw.supabase.co';
const supabaseServiceKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImF6cGdxc21neW9yamJxc2d4dXh3Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2OTI5ODU2MCwiZXhwIjoyMDg0ODc0NTYwfQ.Cq7h8M0N4v1XnYgLj9XW8xk2tYbGh3nKd8fLqZpR2sE';

const supabase = createClient(supabaseUrl, supabaseServiceKey);

// List of all 55 food & beverage images that should exist
const requiredImages = [
  'all-ghanaian-foods-party-orders-1.jpg',
  'all-ghanaian-foods-party-orders-2.jpg',
  'all-ghanaian-foods-party-orders-3.jpg',
  'all-ghanaian-foods-party-orders-4.jpg',
  'all-ghanaian-foods-party-orders-5.jpg',
  'all-ghanaian-foods-party-orders-6.jpg',
  'all-ghanaian-foods-party-orders-7.jpg',
  'all-ghanaian-foods-party-orders-8.jpg',
  'all-ghanaian-foods-party-orders-9.jpg',
  'all-ghanaian-foods-party-orders-10.jpg',
  'jollof-rice-special-1.jpg',
  'jollof-rice-special-2.jpg',
  'jollof-rice-special-3.jpg',
  'banku-and-okro-soup-1.jpg',
  'banku-and-okro-soup-2.jpg',
  'fufu-and-palm-nut-soup-1.jpg',
  'fufu-and-palm-nut-soup-2.jpg',
  'kenkey-and-fish-1.jpg',
  'kenkey-and-fish-2.jpg',
  'waakye-1.jpg',
  'waakye-2.jpg',
  'shito-1.jpg',
  'shito-2.jpg',
  'gari-1.jpg',
  'gari-2.jpg',
  'kelewele-1.jpg',
  'kelewele-2.jpg',
  'fried-plantain-1.jpg',
  'fried-plantain-2.jpg',
  'fried-rice-1.jpg',
  'fried-rice-2.jpg',
  'jollof-rice-1.jpg',
  'jollof-rice-2.jpg',
  'waakye-with-stew-1.jpg',
  'waakye-with-stew-2.jpg',
  'red-red-1.jpg',
  'red-red-2.jpg',
  'palava-sauce-1.jpg',
  'palava-sauce-2.jpg',
  'groundnut-soup-1.jpg',
  'groundnut-soup-2.jpg',
  'light-soup-1.jpg',
  'light-soup-2.jpg',
  'banga-soup-1.jpg',
  'banga-soup-2.jpg',
  'egusi-soup-1.jpg',
  'egusi-soup-2.jpg',
  'okro-soup-1.jpg',
  'okro-soup-2.jpg',
  'kontomire-soup-1.jpg',
  'kontomire-soup-2.jpg',
  'african-salad-1.jpg',
  'african-salad-2.jpg',
  'fruit-juice-mix-1.jpg',
  'fruit-juice-mix-2.jpg',
  'sobolo-1.jpg',
  'sobolo-2.jpg',
  'zobo-1.jpg',
  'zobo-2.jpg'
];

async function checkExistingImages() {
  console.log('🔍 Checking existing images in Supabase storage...\n');
  
  const existingImages = [];
  const missingImages = [];
  
  for (const imageName of requiredImages) {
    try {
      const { data, error } = await supabase.storage
        .from('product-images')
        .getPublicUrl(`food&beverages/${imageName}`);
      
      if (error) {
        missingImages.push(imageName);
        continue;
      }
      
      // Test if the URL is accessible
      const response = await fetch(data.publicUrl, { method: 'HEAD' });
      if (response.ok) {
        existingImages.push(imageName);
        console.log(`✅ EXISTS: ${imageName}`);
      } else {
        missingImages.push(imageName);
        console.log(`❌ MISSING: ${imageName}`);
      }
    } catch (error) {
      missingImages.push(imageName);
      console.log(`❌ ERROR: ${imageName} - ${error.message}`);
    }
  }
  
  console.log(`\n📊 SUMMARY:`);
  console.log(`✅ Existing images: ${existingImages.length}`);
  console.log(`❌ Missing images: ${missingImages.length}`);
  
  if (missingImages.length > 0) {
    console.log(`\n🚨 MISSING IMAGES:`);
    missingImages.forEach(img => console.log(`  - ${img}`));
  }
  
  return { existingImages, missingImages };
}

async function uploadPlaceholderImages() {
  console.log('\n🎨 Creating and uploading placeholder images for missing items...\n');
  
  const { missingImages } = await checkExistingImages();
  
  if (missingImages.length === 0) {
    console.log('✅ All images already exist!');
    return;
  }
  
  for (const imageName of missingImages) {
    try {
      // Generate a simple placeholder SVG
      const productName = imageName.replace(/\.(jpg|jpeg|png)$/i, '').replace(/-/g, ' ').replace(/\b\w/g, l => l.toUpperCase());
      
      const svgContent = `
        <svg width="400" height="400" viewBox="0 0 400 400" fill="none" xmlns="http://www.w3.org/2000/svg">
          <rect width="400" height="400" fill="#F9FAFB"/>
          <rect width="400" height="400" fill="#F3F4F6"/>
          <rect x="50" y="50" width="300" height="300" fill="#E5E7EB" rx="8"/>
          <path d="M150 120H250V200H150V120Z" fill="#9CA3AF"/>
          <circle cx="200" cy="155" r="20" fill="#6B7280"/>
          <path d="M180 175H220V190H180V175Z" fill="#6B7280"/>
          <path d="M120 220L150 240L250 220L280 240V320H120V220Z" fill="#D1D5DB"/>
          <text x="200" y="360" text-anchor="middle" fill="#374151" font-family="Arial, sans-serif" font-size="14" font-weight="bold">${productName}</text>
        </svg>
      `;
      
      // Convert SVG to Buffer
      const svgBuffer = Buffer.from(svgContent);
      
      // Upload to Supabase
      const { data, error } = await supabase.storage
        .from('product-images')
        .upload(`food&beverages/${imageName}`, svgBuffer, {
          contentType: 'image/svg+xml',
          upsert: true
        });
      
      if (error) {
        console.log(`❌ Failed to upload ${imageName}: ${error.message}`);
      } else {
        console.log(`✅ Uploaded placeholder: ${imageName}`);
      }
    } catch (error) {
      console.log(`❌ Error uploading ${imageName}: ${error.message}`);
    }
  }
  
  console.log('\n🎉 Placeholder upload process completed!');
  console.log('📝 Note: These are SVG placeholders. Replace with real product images for best results.');
}

async function main() {
  console.log('🍽️  Food & Beverages Image Management Tool\n');
  console.log('Choose an option:');
  console.log('1. Check existing images');
  console.log('2. Upload placeholder images for missing items');
  console.log('3. Both (check + upload placeholders)');
  
  const args = process.argv.slice(2);
  const option = args[0] || '3';
  
  switch (option) {
    case '1':
      await checkExistingImages();
      break;
    case '2':
      await uploadPlaceholderImages();
      break;
    case '3':
    default:
      await checkExistingImages();
      await uploadPlaceholderImages();
      break;
  }
}

main().catch(console.error);
