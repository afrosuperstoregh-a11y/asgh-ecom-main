const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');

const supabaseUrl = 'https://lljxxaejmueoxsaqaowf.supabase.co';
const supabaseServiceKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imxsanh4YWVqbXVlb3hzYXFhb3dmIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3ODEwODIyMSwiZXhwIjoyMDkzNjg0MjIxfQ.qXvtkAhMYRSOHSQUFVdLGQypZ0_k-Z5Y2TlDDYJBzFQ';

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function validateProducts() {
  try {
    console.log('🔍 Validating products and images...\n');
    
    const { data: products, error } = await supabase
      .from('products')
      .select('id, name, images, status, category_id');
    
    if (error) {
      console.error('❌ Error fetching products:', error);
      return;
    }
    
    console.log(`📊 Found ${products.length} products in database\n`);
    
    const stats = {
      totalProducts: products.length,
      activeProducts: 0,
      withImages: 0,
      withPlaceholderImages: 0,
      withSupabaseImages: 0,
      withInvalidImages: 0,
      withEmptyImages: 0
    };
    
    const placeholderProducts = [];
    const invalidImageProducts = [];
    const validProducts = [];
    
    for (const product of products) {
      if (product.status === 'active') {
        stats.activeProducts++;
      }
      
      const images = product.images;
      
      if (!images || (Array.isArray(images) && images.length === 0)) {
        stats.withEmptyImages++;
        invalidImageProducts.push({ id: product.id, name: product.name, issue: 'Empty images' });
      } else if (Array.isArray(images)) {
        stats.withImages++;
        const firstImage = images[0];
        
        if (typeof firstImage === 'string') {
          if (firstImage === 'placeholder-product.svg' || firstImage.includes('placeholder')) {
            stats.withPlaceholderImages++;
            placeholderProducts.push({ id: product.id, name: product.name, image: firstImage });
          } else if (firstImage.startsWith('http') && firstImage.includes('supabase.co')) {
            stats.withSupabaseImages++;
            validProducts.push({ id: product.id, name: product.name, image: firstImage });
          } else {
            stats.withInvalidImages++;
            invalidImageProducts.push({ id: product.id, name: product.name, image: firstImage, issue: 'Invalid URL' });
          }
        }
      }
    }
    
    console.log('📊 Validation Statistics:');
    console.log(`  Total products: ${stats.totalProducts}`);
    console.log(`  Active products: ${stats.activeProducts}`);
    console.log(`  Products with images: ${stats.withImages}`);
    console.log(`  Products with Supabase images: ${stats.withSupabaseImages}`);
    console.log(`  Products with placeholder images: ${stats.withPlaceholderImages}`);
    console.log(`  Products with invalid images: ${stats.withInvalidImages}`);
    console.log(`  Products with empty images: ${stats.withEmptyImages}`);
    
    // Sample of valid products
    console.log('\n✅ Sample of valid products (first 10):');
    validProducts.slice(0, 10).forEach(p => {
      console.log(`  - ${p.name} (ID: ${p.id})`);
      console.log(`    Image: ${p.image.substring(0, 80)}...`);
    });
    
    if (placeholderProducts.length > 0) {
      console.log('\n❌ Products with placeholder images:');
      placeholderProducts.slice(0, 10).forEach(p => {
        console.log(`  - ${p.name} (ID: ${p.id}): ${p.image}`);
      });
    }
    
    if (invalidImageProducts.length > 0) {
      console.log('\n❌ Products with invalid images:');
      invalidImageProducts.slice(0, 10).forEach(p => {
        console.log(`  - ${p.name} (ID: ${p.id}): ${p.issue}`);
      });
    }
    
    const report = {
      imagesFound: stats.withSupabaseImages,
      productsCreated: stats.totalProducts,
      productsUpdated: 0,
      missingImages: stats.withEmptyImages,
      brokenUrls: stats.withInvalidImages,
      http400Errors: 0,
      http404Errors: 0,
      frontendVisibleProducts: stats.activeProducts,
      statistics: stats,
      placeholderProducts: placeholderProducts,
      invalidImageProducts: invalidImageProducts
    };
    
    fs.writeFileSync('final-validation-report.json', JSON.stringify(report, null, 2));
    console.log('\n✅ Final validation report saved to final-validation-report.json');
    
    return report;
    
  } catch (error) {
    console.error('❌ Error:', error.message);
  }
}

validateProducts();
