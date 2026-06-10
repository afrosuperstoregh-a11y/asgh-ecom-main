const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = 'https://azpgqsmgyorjbqsgxuxw.supabase.co';
const supabaseServiceKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImF6cGdxc21neW9yamJxc2d4dXh3Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2OTI5ODU2MCwiZXhwIjoyMDg0ODc0NTYwfQ.A-gUiUyjt9XWxwB2mCfWScOGDCbSGmm-zXt2G5Xseh0';

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function verifySyncResults() {
  console.log('🔍 Verifying Synchronization Results\n');
  
  try {
    // Get total product count
    const { count: totalProducts, error: countError } = await supabase
      .from('products')
      .select('*', { count: 'exact', head: true });
    
    if (countError) throw countError;
    console.log(`📊 Total Products: ${totalProducts}`);
    
    // Get products with images
    const { data: products, error: productsError } = await supabase
      .from('products')
      .select('id, name, images, category_id, status')
      .order('name');
    
    if (productsError) throw productsError;
    
    const productsWithImages = products.filter(p => p.images && Array.isArray(p.images) && p.images.length > 0);
    const productsWithoutImages = products.filter(p => !p.images || !Array.isArray(p.images) || p.images.length === 0);
    const activeProducts = products.filter(p => p.status === 'active');
    
    console.log(`✅ Products with Images: ${productsWithImages.length}`);
    console.log(`❌ Products without Images: ${productsWithoutImages.length}`);
    console.log(`⚡ Active Products: ${activeProducts.length}`);
    
    // Count total images
    let totalImages = 0;
    productsWithImages.forEach(p => {
      if (Array.isArray(p.images)) {
        totalImages += p.images.length;
      }
    });
    console.log(`🖼️  Total Image Links: ${totalImages}`);
    
    // Get categories
    const { data: categories, error: catError } = await supabase
      .from('categories')
      .select('*')
      .order('name');
    
    if (catError) throw catError;
    console.log(`📂 Total Categories: ${categories.length}`);
    
    // Show category breakdown
    console.log('\n📦 Products by Category:');
    const categoryMap = {};
    products.forEach(p => {
      if (p.category_id) {
        const cat = categories.find(c => c.id === p.category_id);
        const catName = cat ? cat.name : 'Unknown';
        if (!categoryMap[catName]) {
          categoryMap[catName] = 0;
        }
        categoryMap[catName]++;
      }
    });
    
    Object.entries(categoryMap).forEach(([name, count]) => {
      console.log(`  ${name}: ${count} products`);
    });
    
    // Show recent products
    console.log('\n📝 Recently Created Products (last 10):');
    const recentProducts = [...products].reverse().slice(0, 10);
    recentProducts.forEach(p => {
      const imageCount = Array.isArray(p.images) ? p.images.length : 0;
      console.log(`  ✅ ${p.name} (${imageCount} images)`);
    });
    
    // Check for any data issues
    console.log('\n🔍 Data Quality Check:');
    const issues = [];
    
    products.forEach(p => {
      if (p.images && !Array.isArray(p.images)) {
        issues.push(`Product "${p.name}" has non-array images field`);
      }
      if (!p.slug) {
        issues.push(`Product "${p.name}" is missing slug`);
      }
      if (!p.sku) {
        issues.push(`Product "${p.name}" is missing sku`);
      }
    });
    
    if (issues.length > 0) {
      console.log(`⚠️  Found ${issues.length} issues:`);
      issues.slice(0, 10).forEach(issue => console.log(`  - ${issue}`));
    } else {
      console.log('✅ No data quality issues found');
    }
    
  } catch (error) {
    console.error('❌ Error:', error.message);
  }
}

verifySyncResults();
