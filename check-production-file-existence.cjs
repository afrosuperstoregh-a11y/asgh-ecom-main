const { createClient } = require('@supabase/supabase-js');

// Production Supabase project (from frontend .env)
const supabaseUrl = 'https://lljxxaejmueoxsaqaowf.supabase.co';
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imxsanh4YWVqbXVlb3hzYXFhb3dmIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzgxMDgyMjEsImV4cCI6MjA5MzY4NDIyMX0.LM2zS7a7utqqtU5DN4ADy7uCzugnshNAfG8a4gPlQfk';

const supabase = createClient(supabaseUrl, supabaseAnonKey);

async function checkProductionFileExistence() {
  console.log('🔍 Checking Production File Existence\n');
  
  try {
    // Test specific files from the error messages
    const testFiles = [
      'placeholder-product.svg',
      'african-spices.jpg',
      'african-coffee.jpg',
      'african-painting.jpg',
      'african-honey.jpg',
      '1780435715508-tr8guwmmc4b.png'
    ];
    
    console.log('Testing file existence via download attempt:\n');
    
    for (const file of testFiles) {
      try {
        const { data, error } = await supabase.storage
          .from('product-images')
          .download(file);
        
        if (error) {
          console.log(`❌ ${file}: ${error.message}`);
        } else {
          console.log(`✅ ${file}: Exists (${data.size} bytes)`);
        }
      } catch (e) {
        console.log(`❌ ${file}: ${e.message}`);
      }
    }
    
    // Check storage bucket policies
    console.log('\n🔍 Checking storage bucket policies...');
    
    // Try to list all files to see what's actually there
    const { data: allFiles, error: listError } = await supabase.storage
      .from('product-images')
      .list('', { limit: 100 });
    
    if (listError) {
      console.log(`❌ Error listing files: ${listError.message}`);
    } else {
      console.log(`✅ Found ${allFiles.length} files in bucket:`);
      allFiles.forEach(file => {
        console.log(`  - ${file.name} (${file.metadata ? 'with metadata' : 'no metadata'})`);
      });
    }
    
  } catch (error) {
    console.error('❌ Error:', error.message);
  }
}

checkProductionFileExistence();
