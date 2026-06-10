const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = 'https://azpgqsmgyorjbqsgxuxw.supabase.co';
const supabaseServiceKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImF6cGdxc21neW9yamJxc2d4dXh3Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2OTI5ODU2MCwiZXhwIjoyMDg0ODc0NTYwfQ.A-gUiUyjt9XWxwB2mCfWScOGDCbSGmm-zXt2G5Xseh0';

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function listAllFiles(bucket, path = '', depth = 0) {
  const indent = '  '.repeat(depth);
  console.log(`${indent}📂 Scanning: ${path || '(root)'}`);
  
  const { data, error } = await supabase.storage
    .from(bucket)
    .list(path, {
      limit: 1000,
      offset: 0
    });
  
  if (error) {
    console.log(`${indent}❌ Error:`, error.message);
    return { files: [], folders: [] };
  }
  
  const files = [];
  const folders = [];
  
  for (const item of data) {
    if (item.name.includes('/') && !item.name.endsWith('/')) {
      // It's a file in a subdirectory
      files.push({
        name: item.name,
        size: item.metadata?.size || 0,
        contentType: item.metadata?.contentType || 'unknown',
        path: path ? `${path}/${item.name}` : item.name
      });
    } else if (!item.name.includes('.')) {
      // It's a folder
      folders.push(item.name);
      // Recursively scan the folder
      const subResult = await listAllFiles(bucket, item.name, depth + 1);
      files.push(...subResult.files);
      folders.push(...subResult.folders);
    } else {
      // It's a file in current directory
      files.push({
        name: item.name,
        size: item.metadata?.size || 0,
        contentType: item.metadata?.contentType || 'unknown',
        path: path ? `${path}/${item.name}` : item.name
      });
    }
  }
  
  console.log(`${indent}✅ Found ${files.length} files, ${folders.length} subfolders`);
  
  return { files, folders };
}

async function scanStorageBuckets() {
  console.log('🔍 Recursively Scanning Supabase Storage Buckets...\n');
  
  const buckets = ['product-images', 'products', 'category-images', 'user-avatars'];
  const bucketContents = {};
  
  for (const bucket of buckets) {
    console.log(`\n📦 Bucket: ${bucket}`);
    console.log('='.repeat(60));
    
    try {
      const result = await listAllFiles(bucket);
      bucketContents[bucket] = result;
      
      console.log(`\n📊 Summary for ${bucket}:`);
      console.log(`  - Total files: ${result.files.length}`);
      console.log(`  - Total folders: ${result.folders.length}`);
      
      if (result.files.length > 0) {
        console.log(`\n📄 Files:`);
        result.files.forEach((file, idx) => {
          console.log(`  ${idx + 1}. ${file.path} (${formatBytes(file.size)})`);
        });
      }
      
      if (result.folders.length > 0) {
        console.log(`\n📂 Folders:`);
        result.folders.forEach((folder, idx) => {
          console.log(`  ${idx + 1}. ${folder}`);
        });
      }
      
    } catch (error) {
      console.log(`❌ Exception:`, error.message);
      bucketContents[bucket] = { files: [], folders: [], error: error.message };
    }
  }
  
  return bucketContents;
}

function formatBytes(bytes) {
  if (bytes === 0) return '0 Bytes';
  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return Math.round(bytes / Math.pow(k, i) * 100) / 100 + ' ' + sizes[i];
}

async function main() {
  try {
    const bucketContents = await scanStorageBuckets();
    
    // Save detailed report
    const fs = require('fs');
    fs.writeFileSync(
      'storage-recursive-report.json',
      JSON.stringify(bucketContents, null, 2)
    );
    
    console.log('\n\n✅ Detailed report saved to storage-recursive-report.json');
    
    // Generate summary
    let totalFiles = 0;
    let totalFolders = 0;
    
    console.log('\n\n📊 OVERALL SUMMARY:');
    console.log('='.repeat(60));
    
    for (const [bucket, contents] of Object.entries(bucketContents)) {
      if (!contents.error) {
        totalFiles += contents.files.length;
        totalFolders += contents.folders.length;
        console.log(`\n${bucket}:`);
        console.log(`  Files: ${contents.files.length}`);
        console.log(`  Folders: ${contents.folders.length}`);
      }
    }
    
    console.log(`\n📈 TOTAL: ${totalFiles} files across ${totalFolders} folders`);
    
  } catch (error) {
    console.error('\n❌ Fatal error:', error);
    process.exit(1);
  }
}

main();
