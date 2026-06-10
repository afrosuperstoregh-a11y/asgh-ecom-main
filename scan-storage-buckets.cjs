const { createClient } = require('@supabase/supabase-js');

// Use service role key for full access
const supabaseUrl = 'https://azpgqsmgyorjbqsgxuxw.supabase.co';
const supabaseServiceKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImF6cGdxc21neW9yamJxc2d4dXh3Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2OTI5ODU2MCwiZXhwIjoyMDg0ODc0NTYwfQ.A-gUiUyjt9XWxwB2mCfWScOGDCbSGmm-zXt2G5Xseh0';

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function scanStorageBuckets() {
  console.log('🔍 Scanning Supabase Storage Buckets...\n');
  
  const buckets = ['product-images', 'products', 'category-images', 'user-avatars'];
  const bucketContents = {};
  
  for (const bucket of buckets) {
    console.log(`\n📦 Scanning bucket: ${bucket}`);
    try {
      const { data, error } = await supabase.storage
        .from(bucket)
        .list('', {
          limit: 1000,
          offset: 0
        });
      
      if (error) {
        console.log(`❌ Error accessing ${bucket}:`, error.message);
        bucketContents[bucket] = { error: error.message, files: [], folders: [] };
        continue;
      }
      
      const files = data.filter(item => !item.name.includes('/'));
      const folders = data.filter(item => item.name.includes('/') && !item.name.endsWith('/'));
      
      console.log(`✅ Found ${files.length} files and ${folders.length} folders in root`);
      
      // Scan each folder
      const folderContents = {};
      for (const folder of folders) {
        const folderName = folder.name;
        console.log(`  📂 Scanning folder: ${folderName}`);
        
        const { data: folderData, error: folderError } = await supabase.storage
          .from(bucket)
          .list(folderName, {
            limit: 1000
          });
        
        if (folderError) {
          console.log(`    ❌ Error:`, folderError.message);
          folderContents[folderName] = { error: folderError.message, files: [] };
        } else {
          console.log(`    ✅ Found ${folderData.length} files`);
          folderContents[folderName] = {
            files: folderData.map(f => ({
              name: f.name,
              size: f.metadata?.size || 0,
              contentType: f.metadata?.contentType || 'unknown',
              path: `${folderName}/${f.name}`
            }))
          };
        }
      }
      
      bucketContents[bucket] = {
        files: files.map(f => ({
          name: f.name,
          size: f.metadata?.size || 0,
          contentType: f.metadata?.contentType || 'unknown'
        })),
        folders: folderContents
      };
      
    } catch (error) {
      console.log(`❌ Exception accessing ${bucket}:`, error.message);
      bucketContents[bucket] = { error: error.message, files: [], folders: {} };
    }
  }
  
  return bucketContents;
}

async function analyzeDatabase() {
  console.log('\n\n🔍 Analyzing Database Schema...\n');
  
  try {
    // Get categories
    const { data: categories, error: catError } = await supabase
      .from('categories')
      .select('*')
      .order('name');
    
    if (catError) {
      console.log('❌ Error fetching categories:', catError.message);
    } else {
      console.log(`✅ Found ${categories.length} categories`);
    }
    
    // Get products
    const { data: products, error: prodError } = await supabase
      .from('products')
      .select('id, name, slug, sku, category_id, status, images, inventory_quantity')
      .order('name');
    
    if (prodError) {
      console.log('❌ Error fetching products:', prodError.message);
    } else {
      console.log(`✅ Found ${products.length} products`);
      
      const activeProducts = products.filter(p => p.status === 'active');
      const withImages = products.filter(p => p.images && p.images.length > 0);
      const withCategory = products.filter(p => p.category_id);
      
      console.log(`   - Active: ${activeProducts.length}`);
      console.log(`   - With images: ${withImages.length}`);
      console.log(`   - With category: ${withCategory.length}`);
      console.log(`   - Uncategorized: ${products.length - withCategory.length}`);
    }
    
    // Get product images
    const { data: productImages, error: imgError } = await supabase
      .from('product_images')
      .select('*');
    
    if (imgError) {
      console.log('❌ Error fetching product_images:', imgError.message);
    } else {
      console.log(`✅ Found ${productImages.length} product_images records`);
    }
    
    return { categories, products, productImages };
    
  } catch (error) {
    console.log('❌ Exception analyzing database:', error.message);
    return { categories: [], products: [], productImages: [] };
  }
}

async function generateReport(bucketContents, dbData) {
  console.log('\n\n📊 ANALYSIS REPORT\n');
  console.log('=' .repeat(80));
  
  // Storage Summary
  console.log('\n📦 STORAGE BUCKETS SUMMARY:');
  let totalStorageFiles = 0;
  
  for (const [bucket, contents] of Object.entries(bucketContents)) {
    if (contents.error) {
      console.log(`\n${bucket}: ❌ ${contents.error}`);
      continue;
    }
    
    const fileCount = contents.files.length;
    const folderCount = Object.keys(contents.folders).length;
    let folderFileCount = 0;
    
    for (const [folderName, folderData] of Object.entries(contents.folders)) {
      if (!folderData.error) {
        folderFileCount += folderData.files.length;
      }
    }
    
    totalStorageFiles += fileCount + folderFileCount;
    console.log(`\n${bucket}:`);
    console.log(`  - Root files: ${fileCount}`);
    console.log(`  - Folders: ${folderCount}`);
    console.log(`  - Files in folders: ${folderFileCount}`);
    console.log(`  - Total files: ${fileCount + folderFileCount}`);
    
    if (folderCount > 0) {
      console.log(`  - Folder breakdown:`);
      for (const [folderName, folderData] of Object.entries(contents.folders)) {
        if (!folderData.error) {
          console.log(`    * ${folderName}: ${folderData.files.length} files`);
        }
      }
    }
  }
  
  console.log(`\n📈 TOTAL STORAGE FILES: ${totalStorageFiles}`);
  
  // Database Summary
  console.log('\n\n💾 DATABASE SUMMARY:');
  console.log(`  - Categories: ${dbData.categories?.length || 0}`);
  console.log(`  - Products: ${dbData.products?.length || 0}`);
  console.log(`  - Product Images: ${dbData.productImages?.length || 0}`);
  
  if (dbData.products) {
    const activeProducts = dbData.products.filter(p => p.status === 'active');
    const withImages = dbData.products.filter(p => p.images && p.images.length > 0);
    const withCategory = dbData.products.filter(p => p.category_id);
    
    console.log(`  - Active Products: ${activeProducts.length}`);
    console.log(`  - Products with images: ${withImages.length}`);
    console.log(`  - Products with category: ${withCategory.length}`);
    console.log(`  - Uncategorized products: ${dbData.products.length - withCategory.length}`);
  }
  
  // Gap Analysis
  console.log('\n\n🔍 GAP ANALYSIS:');
  const productsWithoutImages = dbData.products?.filter(p => !p.images || p.images.length === 0).length || 0;
  console.log(`  - Products without images: ${productsWithoutImages}`);
  console.log(`  - Potential products from storage: ${totalStorageFiles}`);
  
  // Save detailed report
  const report = {
    timestamp: new Date().toISOString(),
    storage: bucketContents,
    database: {
      categories: dbData.categories?.length || 0,
      products: dbData.products?.length || 0,
      productImages: dbData.productImages?.length || 0
    },
    summary: {
      totalStorageFiles,
      productsWithoutImages,
      gap: totalStorageFiles - productsWithoutImages
    }
  };
  
  return report;
}

async function main() {
  try {
    const bucketContents = await scanStorageBuckets();
    const dbData = await analyzeDatabase();
    const report = await generateReport(bucketContents, dbData);
    
    // Save report to file
    const fs = require('fs');
    fs.writeFileSync(
      'storage-analysis-report.json',
      JSON.stringify(report, null, 2)
    );
    
    console.log('\n\n✅ Report saved to storage-analysis-report.json');
    console.log('\n' + '='.repeat(80));
    console.log('ANYSIS COMPLETE');
    console.log('='.repeat(80));
    
  } catch (error) {
    console.error('\n❌ Fatal error:', error);
    process.exit(1);
  }
}

main();
