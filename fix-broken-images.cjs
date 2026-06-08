const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env' });

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('Missing required environment variables');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

const supabaseStorageUrl = `${supabaseUrl}/storage/v1/object/public/product-images/`;

// Mapping of broken images to their corrected URLs
const imageFixes = {
  // Food & beverages - fix relative paths
  'Banku Flour': `${supabaseStorageUrl}food%26beverages/banku-flour.jpg`,
  'Barbeque': `${supabaseStorageUrl}food%26beverages/barbeque.png`,
  'Banku Mix': `${supabaseStorageUrl}food%26beverages/banku-mix.png`,
  
  // Books & media - fix relative paths
  'B&Mproduct1': `${supabaseStorageUrl}books%26media/b%26mproduct1.jpg`,
  'B&Mproduct2': `${supabaseStorageUrl}books%26media/b%26mproduct2.jpg`,
  'B&Mproduct3': `${supabaseStorageUrl}books%26media/b%26mproduct3.jpg`,
  
  // Stationery - fix relative paths
  'Premium Notebook Set': `${supabaseStorageUrl}stationery/notebook-set.jpg`,
  'Gel Pen Collection': `${supabaseStorageUrl}stationery/gel-pens.jpg`,
  'Desk Organizer': `${supabaseStorageUrl}stationery/desk-organizer.jpg`,
  'Sticky Notes Pack': `${supabaseStorageUrl}stationery/sticky-notes.jpg`,
  'Professional Calculator': `${supabaseStorageUrl}stationery/calculator.jpg`,
  
  // Replace picsum.photos placeholders with real images
  'Ankara Print Dress': `${supabaseStorageUrl}clothing/ankara-print-dress.jpg`,
  'Handwoven Basket': `${supabaseStorageUrl}accessories/handwoven-basket.jpg`,
  'Shea Butter Cream': `${supabaseStorageUrl}beauty/shea-butter-cream.jpg`,
  'African Dashiki Shirt': `${supabaseStorageUrl}clothing/african-dashiki-shirt.jpg`,
  
  // Dashiki images - keep existing URLs but they might need RLS fix
  'Girls Dashiki': 'https://azpgqsmgyorjbqsgxuxw.supabase.co/storage/v1/object/public/product-images/girls-dashiki.jpg',
  'Boys Dashiki': 'https://azpgqsmgyorjbqsgxuxw.supabase.co/storage/v1/object/public/product-images/boys-dashiki.jpg'
};

async function fixBrokenImages() {
  try {
    console.log('🔧 Fixing broken images...');
    
    const productNames = Object.keys(imageFixes);
    let successCount = 0;
    let failCount = 0;
    
    for (const productName of productNames) {
      try {
        console.log(`\n🔄 Processing: ${productName}`);
        
        // Find the product in database
        const { data: product, error: findError } = await supabase
          .from('products')
          .select('id, name, images')
          .eq('name', productName)
          .single();
        
        if (findError || !product) {
          console.log(`❌ Product not found: ${productName}`);
          failCount++;
          continue;
        }
        
        console.log(`📋 Current image: ${product.images}`);
        console.log(`✨ New image: ${imageFixes[productName]}`);
        
        // Update the product with the corrected image URL
        const { data: updatedProduct, error: updateError } = await supabase
          .from('products')
          .update({
            images: imageFixes[productName],
            updated_at: new Date().toISOString()
          })
          .eq('id', product.id)
          .select()
          .single();
        
        if (updateError) {
          console.log(`❌ Error updating ${productName}:`, updateError.message);
          failCount++;
        } else {
          console.log(`✅ Successfully updated: ${productName}`);
          console.log(`📝 New image: ${updatedProduct.images}`);
          successCount++;
        }
        
      } catch (error) {
        console.log(`❌ Error processing ${productName}:`, error.message);
        failCount++;
      }
    }
    
    console.log(`\n🎉 Image fix complete!`);
    console.log(`📊 Summary:`);
    console.log(`✅ Successfully updated: ${successCount}`);
    console.log(`❌ Failed: ${failCount}`);
    console.log(`📝 Total processed: ${productNames.length}`);
    
  } catch (error) {
    console.log('❌ Error:', error.message);
  }
}

fixBrokenImages();
