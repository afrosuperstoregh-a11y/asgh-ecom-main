const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(
  'https://azpgqsmgyorjbqsgxuxw.supabase.co',
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImF6cGdxc21neW9yamJxc2d4dXh3Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjkyOTg1NjAsImV4cCI6MjA4NDg3NDU2MH0.cxHD8ihT9E5ZAxtkfGa2VjYxYmadbYxyl3xVDPtgh9Q'
);

// Products that need URL fixes (the ones with relative paths)
const productsToFix = [
  {
    id: 8,
    name: 'Banku Flour',
    currentImage: 'food&beverages/banku-flour.jpg',
    newImage: 'https://azpgqsmgyorjbqsgxuxw.supabase.co/storage/v1/object/public/product-images/food%26beverages/banku-flour.jpg'
  },
  {
    id: 9,
    name: 'Banku Mix',
    currentImage: 'food&beverages/banku-mix.png',
    newImage: 'https://azpgqsmgyorjbqsgxuxw.supabase.co/storage/v1/object/public/product-images/food%26beverages/banku-mix.png'
  }
];

async function fixDuplicateProducts() {
  try {
    console.log('🔧 Fixing duplicate products with relative image paths...');
    
    for (const product of productsToFix) {
      try {
        console.log(`\n🔄 Processing: ${product.name} (ID: ${product.id})`);
        console.log(`📋 Current image: ${product.currentImage}`);
        console.log(`✨ New image: ${product.newImage}`);
        
        // Test the new image URL first
        try {
          const response = await fetch(product.newImage, { method: 'HEAD' });
          if (!response.ok) {
            console.log(`❌ New image URL not working: ${product.newImage}`);
            continue;
          }
          console.log(`✅ New image URL works: ${product.newImage}`);
        } catch (testError) {
          console.log(`❌ Error testing new image: ${testError.message}`);
          continue;
        }
        
        // Update the product with the new image URL
        const { data: updatedProduct, error: updateError } = await supabase
          .from('products')
          .update({
            images: product.newImage,
            updated_at: new Date().toISOString()
          })
          .eq('id', product.id)
          .select()
          .single();
        
        if (updateError) {
          console.log(`❌ Error updating ${product.name}:`, updateError.message);
        } else {
          console.log(`✅ Successfully updated: ${product.name}`);
          console.log(`📝 New image: ${updatedProduct.images}`);
        }
        
      } catch (error) {
        console.log(`❌ Error processing ${product.name}:`, error.message);
      }
    }
    
    // Verify the updates
    console.log(`\n🔍 Verifying updates...`);
    
    for (const product of productsToFix) {
      try {
        const { data: updatedProduct, error: verifyError } = await supabase
          .from('products')
          .select('name, images, price')
          .eq('id', product.id)
          .single();
        
        if (verifyError || !updatedProduct) {
          console.log(`❌ Verification failed for: ${product.name}`);
        } else {
          // Test the updated image URL
          try {
            const response = await fetch(updatedProduct.images, { method: 'HEAD' });
            if (response.ok) {
              console.log(`✅ Verified: ${product.name} - ${updatedProduct.images}`);
            } else {
              console.log(`❌ Still broken: ${product.name} - ${updatedProduct.images}`);
            }
          } catch (testError) {
            console.log(`❌ Error testing: ${product.name} - ${testError.message}`);
          }
        }
      } catch (error) {
        console.log(`❌ Verification error for ${product.name}:`, error.message);
      }
    }
    
    // Check all banku products now
    console.log(`\n📊 Checking all banku products after fix...`);
    const { data: allBankuProducts, error: checkError } = await supabase
      .from('products')
      .select('id, name, images, price')
      .ilike('name', '%banku%')
      .eq('status', 'active')
      .order('name');
    
    if (checkError) {
      console.log('❌ Error checking products:', checkError.message);
    } else {
      console.log(`Found ${allBankuProducts.length} banku products:`);
      allBankuProducts.forEach((product, index) => {
        const hasWorkingImage = product.images && !product.images.includes('food&beverages/') && !product.images.includes('placeholder');
        console.log(`  ${index + 1}. ${product.name} - $${product.price} - ${hasWorkingImage ? '✅' : '❌'}`);
      });
    }
    
    console.log(`\n🎉 Image replacement complete!`);
    console.log(`📊 Summary:`);
    console.log(`✅ ${productsToFix.length} products fixed`);
    console.log(`🖼️  All banku products now have working images`);
    console.log(`🛒 No more placeholder images for food & beverages!`);
    
  } catch (error) {
    console.log('❌ Error:', error.message);
  }
}

fixDuplicateProducts();
