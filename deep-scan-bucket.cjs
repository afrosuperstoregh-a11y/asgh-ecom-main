const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');

const supabaseUrl = 'https://lljxxaejmueoxsaqaowf.supabase.co';
const supabaseServiceKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imxsanh4YWVqbXVlb3hzYXFhb3dmIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3ODEwODIyMSwiZXhwIjoyMDkzNjg0MjIxfQ.qXvtkAhMYRSOHSQUFVdLGQypZ0_k-Z5Y2TlDDYJBzFQ';

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function listAllFiles(path = '', files = []) {
  const { data: items, error } = await supabase
    .storage
    .from('product-images')
    .list(path, { limit: 1000 });
  
  if (error) {
    console.error(`❌ Error listing ${path}:`, error.message);
    return files;
  }
  
  for (const item of items) {
    if (item.name === '.emptyFolderPlaceholder' || item.name.includes('.emptyFolderPlaceholder')) {
      continue;
    }
    
    if (item.metadata?.mimetype) {
      // It's a file
      const extension = item.name.split('.').pop().toLowerCase();
      if (['jpg', 'jpeg', 'png', 'webp', 'JPG', 'JPEG', 'PNG', 'WEBP'].includes(extension)) {
        const fullPath = path ? `${path}/${item.name}` : item.name;
        files.push({
          path: fullPath,
          folder: path || 'root',
          filename: item.name,
          size: item.metadata.size || 0
        });
      }
    } else {
      // It's a folder, recurse
      const folderPath = path ? `${path}/${item.name}` : item.name;
      await listAllFiles(folderPath, files);
    }
  }
  
  return files;
}

async function deepScanBucket() {
  try {
    console.log('🔍 Deep scanning product-images bucket (recursive)...\n');
    
    const allFiles = await listAllFiles();
    
    console.log(`📊 Total image files found: ${allFiles.length}\n`);
    
    // Group by folder
    const folderCounts = {};
    allFiles.forEach(file => {
      const folder = file.folder || 'root';
      folderCounts[folder] = (folderCounts[folder] || 0) + 1;
    });
    
    console.log('📁 Folder Summary:');
    Object.keys(folderCounts).sort().forEach(folder => {
      console.log(`  ${folder}: ${folderCounts[folder]} images`);
    });
    
    console.log('\n📋 All files:');
    allFiles.forEach(file => {
      console.log(`  ${file.path}`);
    });
    
    // Save to file
    fs.writeFileSync('deep-scan-report.json', JSON.stringify({
      totalImages: allFiles.length,
      folders: folderCounts,
      files: allFiles
    }, null, 2));
    
    console.log('\n✅ Report saved to deep-scan-report.json');
    
    return { totalImages: allFiles.length, folders: folderCounts, files: allFiles };
    
  } catch (error) {
    console.error('❌ Error:', error.message);
  }
}

deepScanBucket();
