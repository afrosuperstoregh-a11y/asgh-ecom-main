const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = 'https://lljxxaejmueoxsaqaowf.supabase.co';
const supabaseServiceKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imxsanh4YWVqbXVlb3hzYXFhb3dmIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3ODEwODIyMSwiZXhwIjoyMDkzNjg0MjIxfQ.qXvtkAhMYRSOHSQUFVdLGQypZ0_k-Z5Y2TlDDYJBzFQ';

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function listSupabaseImages() {
  try {
    console.log('🔍 Listing all files in product-images bucket...\n');
    
    // List all files in the bucket
    const { data: files, error } = await supabase
      .storage
      .from('product-images')
      .list('', { limit: 1000 });
    
    if (error) {
      console.error('❌ Error listing files:', error);
      return;
    }
    
    console.log(`📊 Found ${files.length} items in product-images bucket\n`);
    
    // Filter out empty folder placeholders
    const actualItems = files.filter(file => 
      file.name !== '.emptyFolderPlaceholder' && 
      !file.name.includes('.emptyFolderPlaceholder')
    );
    
    const allFiles = [];
    
    // For each folder, list its contents
    for (const item of actualItems) {
      // Check if it's a folder (no mimetype) or a file (has mimetype)
      if (item.metadata?.mimetype) {
        // It's a file
        allFiles.push(item.name);
      } else {
        // It's a folder, list its contents
        console.log(`📁 Listing contents of ${item.name}/...`);
        const { data: folderFiles, error: folderError } = await supabase
          .storage
          .from('product-images')
          .list(item.name, { limit: 1000 });
        
        if (folderError) {
          console.error(`   ❌ Error listing ${item.name}:`, folderError.message);
        } else if (folderFiles) {
          const actualFolderFiles = folderFiles.filter(f => 
            f.name !== '.emptyFolderPlaceholder' && 
            !f.name.includes('.emptyFolderPlaceholder')
          );
          console.log(`   Found ${actualFolderFiles.length} files`);
          actualFolderFiles.forEach(f => {
            allFiles.push(`${item.name}/${f.name}`);
          });
        }
      }
    }
    
    console.log(`\n📊 Total image files found: ${allFiles.length}\n`);
    
    // Group by folder
    const folders = {};
    allFiles.forEach(file => {
      const folder = file.includes('/') ? file.split('/')[0] : 'root';
      if (!folders[folder]) folders[folder] = [];
      folders[folder].push(file);
    });
    
    console.log('📁 Files by folder:\n');
    Object.keys(folders).sort().forEach(folder => {
      console.log(`${folder}/ (${folders[folder].length} files)`);
      folders[folder].forEach(file => {
        console.log(`  - ${file}`);
      });
      console.log('');
    });
    
    // Generate public URLs
    console.log('🔗 Public URLs:\n');
    allFiles.forEach(file => {
      const publicUrl = `${supabaseUrl}/storage/v1/object/public/product-images/${file}`;
      console.log(`${file}`);
      console.log(`  ${publicUrl}`);
      console.log('');
    });
    
  } catch (error) {
    console.error('❌ Error:', error.message);
  }
}

listSupabaseImages();
