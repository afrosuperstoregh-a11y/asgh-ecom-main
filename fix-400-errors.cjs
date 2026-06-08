const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env' });

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

const supabase = createClient(supabaseUrl, supabaseServiceKey);

const supabaseStorageUrl = `${supabaseUrl}/storage/v1/object/public/product-images/`;

// Replace 400 error images with working alternatives
const imageReplacements = {
  'Girls Dashiki': `${supabaseStorageUrl}womem-fashion/dashiki-ladies1.jpg`,
  'Boys Dashiki': `${supabaseStorageUrl}men-fashion/dashiki-shirt-1.jpeg`,
  'Ankara Print Dress': `${supabaseStorageUrl}womem-fashion/dashiki-ladies2.jpg`,
  'African Dashiki Shirt': `${supabaseStorageUrl}men-fashion/dashiki-shirt-2.jpeg`,
  'Handwoven Basket': `${supabaseStorageUrl}men-fashion/dashiki-shirt-3.jpeg`,
  'Shea Butter Cream': `${supabaseStorageUrl}men-fashion/dashiki-shirt-4.jpeg`
};

async function fix400Errors() {
  try {
    console.log('🔧 Fixing products with 400 errors...');
    
    const productNames = Object.keys(imageReplacements);
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
          .eq('status', 'active')
          .single();
        
        if (findError || !product) {
          console.log(`❌ Product not found: ${productName}`);
          failCount++;
          continue;
        }
        
        console.log(`📋 Current image: ${JSON.stringify(product.images)}`);
        console.log(`✨ New image: ${imageReplacements[productName]}`);
        
        // Test the new image URL first
        try {
          const response = await fetch(imageReplacements[productName], { method: 'HEAD' });
          if (!response.ok) {
            console.log(`❌ New image URL not working: ${imageReplacements[productName]}`);
            failCount++;
            continue;
          }
          console.log(`✅ New image URL works: ${imageReplacements[productName]}`);
        } catch (testError) {
          console.log(`❌ Error testing new image: ${testError.message}`);
          failCount++;
          continue;
        }
        
        // Update the product with the new image URL (as array)
        const { error: updateError } = await supabase
          .from('products')
          .update({
            images: [imageReplacements[productName]],
            updated_at: new Date().toISOString()
          })
          .eq('id', product.id);
        
        if (updateError) {
          console.log(`❌ Error updating ${productName}:`, updateError.message);
          failCount++;
        } else {
          console.log(`✅ Successfully updated: ${productName}`);
          successCount++;
        }
        
      } catch (error) {
        console.log(`❌ Error processing ${productName}:`, error.message);
        failCount++;
      }
    }
    
    console.log(`\n🎉 400 error fix complete!`);
    console.log(`📊 Summary:`);
    console.log(`✅ Successfully updated: ${successCount}`);
    console.log(`❌ Failed: ${failCount}`);
    console.log(`📝 Total processed: ${productNames.length}`);
    
  } catch (error) {
    console.log('❌ Error:', error.message);
  }
}

fix400Errors();
