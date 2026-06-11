const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');

const supabaseUrl = 'https://lljxxaejmueoxsaqaowf.supabase.co';
const supabaseServiceKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imxsanh4YWVqbXVlb3hzYXFhb3dmIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3ODEwODIyMSwiZXhwIjoyMDkzNjg0MjIxfQ.qXvtkAhMYRSOHSQUFVdLGQypZ0_k-Z5Y2TlDDYJBzFQ';

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function checkDatabaseState() {
  try {
    console.log('🔍 Checking current database state...\n');
    
    const { data: products, error } = await supabase
      .from('products')
      .select('id, name, images, category_id, status');
    
    if (error) {
      console.error('❌ Error fetching products:', error);
      return;
    }
    
    console.log(`📊 Found ${products.length} total products in database\n`);
    
    const stats = {
      total: products.length,
      withPlaceholders: 0,
      withEmptyImages: 0,
      withValidImages: 0,
      withInvalidImages: 0,
      inactive: 0,
      active: 0
    };
    
    const placeholderProducts = [];
    const emptyImageProducts = [];
    const validImageProducts = [];
    const invalidImageProducts = [];
    
    for (const product of products) {
      const images = product.images;
      
      if (!images || (Array.isArray(images) && images.length === 0)) {
        stats.withEmptyImages++;
        emptyImageProducts.push(product);
      } else if (Array.isArray(images)) {
        const firstImage = images[0];
        if (typeof firstImage === 'string') {
          if (firstImage === 'placeholder-product.svg' || firstImage.includes('placeholder')) {
            stats.withPlaceholders++;
            placeholderProducts.push(product);
          } else if (firstImage.startsWith('http') && firstImage.includes('supabase.co')) {
            stats.withValidImages++;
            validImageProducts.push(product);
          } else {
            stats.withInvalidImages++;
            invalidImageProducts.push(product);
          }
        }
      } else if (typeof images === 'string') {
        if (images === 'placeholder-product.svg' || images.includes('placeholder')) {
          stats.withPlaceholders++;
          placeholderProducts.push(product);
        } else if (images.startsWith('http') && images.includes('supabase.co')) {
          stats.withValidImages++;
          validImageProducts.push(product);
        } else {
          stats.withInvalidImages++;
          invalidImageProducts.push(product);
        }
      }
      
      if (product.status === 'active') {
        stats.active++;
      } else {
        stats.inactive++;
      }
    }
    
    console.log('📊 Database Statistics:');
    console.log(`  Total products: ${stats.total}`);
    console.log(`  Active products: ${stats.active}`);
    console.log(`  Inactive products: ${stats.inactive}`);
    console.log(`  Products with placeholder images: ${stats.withPlaceholders}`);
    console.log(`  Products with empty images: ${stats.withEmptyImages}`);
    console.log(`  Products with valid Supabase images: ${stats.withValidImages}`);
    console.log(`  Products with invalid images: ${stats.withInvalidImages}`);
    
    const report = {
      statistics: stats,
      placeholderProducts: placeholderProducts.map(p => ({
        id: p.id,
        name: p.name,
        images: p.images,
        status: p.status
      })),
      emptyImageProducts: emptyImageProducts.map(p => ({
        id: p.id,
        name: p.name,
        images: p.images,
        status: p.status
      })),
      validImageProducts: validImageProducts.map(p => ({
        id: p.id,
        name: p.name,
        images: p.images,
        status: p.status
      })),
      invalidImageProducts: invalidImageProducts.map(p => ({
        id: p.id,
        name: p.name,
        images: p.images,
        status: p.status
      }))
    };
    
    fs.writeFileSync('database-state-report.json', JSON.stringify(report, null, 2));
    console.log('\n✅ Report saved to database-state-report.json\n');
    
    console.log('📋 Sample of products with placeholder images:');
    placeholderProducts.slice(0, 10).forEach(p => {
      console.log(`  - ${p.name} (ID: ${p.id}): ${JSON.stringify(p.images)}`);
    });
    
    if (placeholderProducts.length > 10) {
      console.log(`  ... and ${placeholderProducts.length - 10} more`);
    }
    
    return report;
    
  } catch (error) {
    console.error('❌ Error:', error.message);
  }
}

checkDatabaseState();
