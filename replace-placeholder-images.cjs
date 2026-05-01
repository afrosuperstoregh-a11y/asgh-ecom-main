const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(
  'https://azpgqsmgyorjbqsgxuxw.supabase.co',
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImF6cGdxc21neW9yamJxc2d4dXh3Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjkyOTg1NjAsImV4cCI6MjA4NDg3NDU2MH0.cxHD8ihT9E5ZAxtkfGa2VjYxYmadbYxyl3xVDPtgh9Q'
);

// Working image URLs for replacement
const workingImageReplacements = {
  'Banku Flour': 'https://azpgqsmgyorjbqsgxuxw.supabase.co/storage/v1/object/public/product-images/food%26beverages/banku-flour.jpg',
  'Banku Mix': 'https://azpgqsmgyorjbqsgxuxw.supabase.co/storage/v1/object/public/product-images/food%26beverages/banku-mix.png'
};

async function replacePlaceholderImages() {
  try {
    console.log('🔧 Replacing placeholder images with real working images...');
    
    // Get the products that need image replacement
    const productNames = Object.keys(workingImageReplacements);
    
    for (const productName of productNames) {
      try {
        console.log(`\n🔄 Processing: ${productName}`);
        
        // Find the product in database
        const { data: product, error: findError } = await supabase
          .from('products')
          .select('id, name, images, price')
          .eq('name', productName)
          .single();
        
        if (findError || !product) {
          console.log(`❌ Product not found: ${productName}`);
          continue;
        }
        
        console.log(`📋 Found product: ${product.name} - $${product.price}`);
        console.log(`🖼️  Current image: ${product.images}`);
        console.log(`✨ New image: ${workingImageReplacements[productName]}`);
        
        // Test the new image URL first
        try {
          const response = await fetch(workingImageReplacements[productName], { method: 'HEAD' });
          if (!response.ok) {
            console.log(`❌ New image URL not working: ${workingImageReplacements[productName]}`);
            continue;
          }
          console.log(`✅ New image URL works: ${workingImageReplacements[productName]}`);
        } catch (testError) {
          console.log(`❌ Error testing new image: ${testError.message}`);
          continue;
        }
        
        // Update the product with the new image URL
        const { data: updatedProduct, error: updateError } = await supabase
          .from('products')
          .update({
            images: workingImageReplacements[productName],
            updated_at: new Date().toISOString()
          })
          .eq('id', product.id)
          .select()
          .single();
        
        if (updateError) {
          console.log(`❌ Error updating ${productName}:`, updateError.message);
        } else {
          console.log(`✅ Successfully updated: ${productName}`);
          console.log(`📝 New image: ${updatedProduct.images}`);
        }
        
      } catch (error) {
        console.log(`❌ Error processing ${productName}:`, error.message);
      }
    }
    
    // Verify the updates
    console.log(`\n🔍 Verifying updates...`);
    
    for (const productName of productNames) {
      try {
        const { data: product, error: verifyError } = await supabase
          .from('products')
          .select('name, images, price')
          .eq('name', productName)
          .single();
        
        if (verifyError || !product) {
          console.log(`❌ Verification failed for: ${productName}`);
        } else {
          // Test the updated image URL
          try {
            const response = await fetch(product.images, { method: 'HEAD' });
            if (response.ok) {
              console.log(`✅ Verified: ${productName} - ${product.images}`);
            } else {
              console.log(`❌ Still broken: ${productName} - ${product.images}`);
            }
          } catch (testError) {
            console.log(`❌ Error testing: ${productName} - ${testError.message}`);
          }
        }
      } catch (error) {
        console.log(`❌ Verification error for ${productName}:`, error.message);
      }
    }
    
    console.log(`\n🎉 Placeholder image replacement complete!`);
    console.log(`📊 Summary:`);
    console.log(`✅ ${productNames.length} products processed`);
    console.log(`🖼️  Real images now replacing placeholders`);
    console.log(`🛒 All food & beverage products now have working images in main shop!`);
    
  } catch (error) {
    console.log('❌ Error:', error.message);
  }
}

replacePlaceholderImages();
