const { createClient } = require('@supabase/supabase-js');

// Production Supabase project (from frontend .env)
const supabaseUrl = 'https://lljxxaejmueoxsaqaowf.supabase.co';
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imxsanh4YWVqbXVlb3hzYXFhb3dmIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzgxMDgyMjEsImV4cCI6MjA5MzY4NDIyMX0.LM2zS7a7utqqtU5DN4ADy7uCzugnshNAfG8a4gPlQfk';

const supabase = createClient(supabaseUrl, supabaseAnonKey);

async function checkProductionFolders() {
  console.log('🔍 Checking Production Storage Folder Contents\n');
  
  try {
    // List all folders in the bucket
    const { data: folders, error: listError } = await supabase.storage
      .from('product-images')
      .list('', { limit: 100 });
    
    if (listError) {
      console.log(`❌ Error listing folders: ${listError.message}`);
      return;
    }
    
    console.log(`Found ${folders.length} items in bucket:\n`);
    
    for (const folder of folders) {
      if (folder.metadata === null) {
        // It's a folder
        console.log(`📁 ${folder.name}:`);
        
        try {
          const { data: files, error: filesError } = await supabase.storage
            .from('product-images')
            .list(folder.name, { limit: 10 });
          
          if (filesError) {
            console.log(`   ❌ Error: ${filesError.message}`);
          } else {
            console.log(`   Found ${files.length} files:`);
            files.forEach(file => {
              console.log(`     - ${file.name}`);
            });
          }
        } catch (e) {
          console.log(`   ❌ Error: ${e.message}`);
        }
        
        console.log('');
      } else {
        // It's a file
        console.log(`📄 ${folder.name} (${folder.metadata ? 'with metadata' : 'no metadata'})`);
      }
    }
    
  } catch (error) {
    console.error('❌ Error:', error.message);
  }
}

checkProductionFolders();
