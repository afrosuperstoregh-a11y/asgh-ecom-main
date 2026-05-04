const { createClient } = require('@supabase/supabase-js');

// Supabase configuration
const supabaseUrl = 'https://azpgqsmgyorjbqsgxuxw.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImF6cGdxc21neW9yamJxc2d4dXh3Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjkyOTg1NjAsImV4cCI6MjA4NDg3NDU2MH0.cxHD8ihT9E5ZAxtkfGa2VjYxYmadbYxyl3xVDPtgh9Q';

const supabase = createClient(supabaseUrl, supabaseKey);

async function checkStorageFiles() {
  try {
    console.log('🔍 Checking files in product-images storage...');
    
    // List files in the root of product-images bucket
    const { data: files, error } = await supabase.storage
      .from('product-images')
      .list('', {
        limit: 100,
        offset: 0
      });
    
    if (error) {
      console.error('❌ Error listing files:', error);
      return;
    }
    
    console.log(`📁 Found ${files.length} files in root of product-images bucket:`);
    
    // Look for dashiki files
    const dashikiFiles = files.filter(file => 
      file.name.toLowerCase().includes('dashiki')
    );
    
    console.log('\n🎯 Dashiki files found:');
    if (dashikiFiles.length === 0) {
      console.log('❌ No dashiki files found in root');
    } else {
      dashikiFiles.forEach(file => {
        console.log(`   📄 ${file.name} (${file.id})`);
      });
    }
    
    // Check if there are subdirectories
    const subdirs = files.filter(file => !file.name.includes('.'));
    console.log('\n📂 Subdirectories found:');
    if (subdirs.length === 0) {
      console.log('❌ No subdirectories found');
    } else {
      subdirs.forEach(dir => {
        console.log(`   📁 ${dir.name}`);
      });
    }
    
    // Try to list files in food&beverages subdirectory
    try {
      console.log('\n🔍 Checking food&beverages subdirectory...');
      const { data: fbFiles, error: fbError } = await supabase.storage
        .from('product-images')
        .list('food&beverages', {
          limit: 50
        });
      
      if (fbError) {
        console.error('❌ Error listing food&beverages:', fbError);
      } else {
        console.log(`📁 Found ${fbFiles.length} files in food&beverages:`);
        fbFiles.forEach(file => {
          console.log(`   📄 ${file.name}`);
        });
      }
    } catch (err) {
      console.error('❌ Exception checking food&beverages:', err);
    }
    
  } catch (error) {
    console.error('❌ Unexpected error:', error);
  }
}

checkStorageFiles();
