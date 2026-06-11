const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = 'https://lljxxaejmueoxsaqaowf.supabase.co';
const supabaseServiceKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imxsanh4YWVqbXVlb3hzYXFhb3dmIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3ODEwODIyMSwiZXhwIjoyMDkzNjg0MjIxfQ.qXvtkAhMYRSOHSQUFVdLGQypZ0_k-Z5Y2TlDDYJBzFQ';

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function mapProductsToImages() {
  try {
    console.log('🔍 Mapping products to Supabase images...\n');
    
    // Get all products
    const { data: products, error: productsError } = await supabase
      .from('products')
      .select('id, name');
    
    if (productsError) {
      console.error('❌ Error fetching products:', productsError);
      return;
    }
    
    console.log(`📊 Found ${products.length} products\n`);
    
    // Get all files from product-images bucket
    const allFiles = [];
    const { data: rootItems, error: listError } = await supabase
      .storage
      .from('product-images')
      .list('', { limit: 1000 });
    
    if (listError) {
      console.error('❌ Error listing bucket:', listError);
      return;
    }
    
    const actualItems = rootItems.filter(file => 
      file.name !== '.emptyFolderPlaceholder' && 
      !file.name.includes('.emptyFolderPlaceholder')
    );
    
    for (const item of actualItems) {
      if (item.metadata?.mimetype) {
        allFiles.push(item.name);
      } else {
        const { data: folderFiles } = await supabase
          .storage
          .from('product-images')
          .list(item.name, { limit: 1000 });
        
        if (folderFiles) {
          const actualFolderFiles = folderFiles.filter(f => 
            f.name !== '.emptyFolderPlaceholder' && 
            !f.name.includes('.emptyFolderPlaceholder')
          );
          actualFolderFiles.forEach(f => {
            allFiles.push(`${item.name}/${f.name}`);
          });
        }
      }
    }
    
    console.log(`📊 Found ${allFiles.length} image files in bucket\n`);
    
    // Map products to images
    const updates = [];
    
    for (const product of products) {
      console.log(`📦 ${product.name} (ID: ${product.id})`);
      
      // Try to find matching images based on product name
      const productNameLower = product.name.toLowerCase().replace(/[^a-z0-9]/g, '');
      
      // Find images that match the product name
      const matchingImages = allFiles.filter(file => {
        const fileName = file.split('/').pop().toLowerCase().replace(/[^a-z0-9]/g, '');
        return fileName.includes(productNameLower.substring(0, 10));
      });
      
      if (matchingImages.length > 0) {
        // Use the first matching image
        const imageUrl = `${supabaseUrl}/storage/v1/object/public/product-images/${matchingImages[0]}`;
        console.log(`   ✅ Found matching image: ${matchingImages[0]}`);
        updates.push({ id: product.id, name: product.name, images: [imageUrl] });
      } else {
        // Try to find any image from a relevant category
        const categoryKeywords = {
          'dashiki': 'menfashion',
          'kente': 'menfashion',
          'ankara': 'womenfashion',
          'basket': 'home&living',
          'bracelet': 'jewelry&accessories',
          'wrap': 'womenfashion',
          'mask': 'home&living',
          'honey': 'food&stationeries',
          'spices': 'food&stationeries',
          'coffee': 'food&stationeries',
          'painting': 'home&living'
        };
        
        let foundCategoryImage = false;
        for (const [keyword, category] of Object.entries(categoryKeywords)) {
          if (productNameLower.includes(keyword)) {
            const categoryImages = allFiles.filter(file => file.startsWith(category));
            if (categoryImages.length > 0) {
              const imageUrl = `${supabaseUrl}/storage/v1/object/public/product-images/${categoryImages[0]}`;
              console.log(`   ✅ Found category image: ${categoryImages[0]}`);
              updates.push({ id: product.id, name: product.name, images: [imageUrl] });
              foundCategoryImage = true;
              break;
            }
          }
        }
        
        if (!foundCategoryImage) {
          // Use a random image from books&stationeries as fallback
          const fallbackImages = allFiles.filter(file => file.startsWith('books&stationeries'));
          if (fallbackImages.length > 0) {
            const randomIndex = Math.floor(Math.random() * fallbackImages.length);
            const imageUrl = `${supabaseUrl}/storage/v1/object/public/product-images/${fallbackImages[randomIndex]}`;
            console.log(`   ⚠️  Using fallback image: ${fallbackImages[randomIndex]}`);
            updates.push({ id: product.id, name: product.name, images: [imageUrl] });
          } else {
            console.log(`   ❌ No matching image found, keeping placeholder`);
          }
        }
      }
    }
    
    console.log(`\n📊 Prepared ${updates.length} product updates\n`);
    
    // Apply updates
    let successCount = 0;
    for (const update of updates) {
      const { error: updateError } = await supabase
        .from('products')
        .update({ images: update.images })
        .eq('id', update.id);
      
      if (updateError) {
        console.error(`❌ Failed to update ${update.name}: ${updateError.message}`);
      } else {
        console.log(`✅ Updated ${update.name}`);
        successCount++;
      }
    }
    
    console.log(`\n✅ Successfully updated ${successCount} products`);
    
  } catch (error) {
    console.error('❌ Error:', error.message);
  }
}

mapProductsToImages();
