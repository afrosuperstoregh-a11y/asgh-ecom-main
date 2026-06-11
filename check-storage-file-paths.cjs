const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = 'https://azpgqsmgyorjbqsgxuxw.supabase.co';
const supabaseServiceKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImF6cGdxc21neW9yamJxc2d4dXh3Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2OTI5ODU2MCwiZXhwIjoyMDg0ODc0NTYwfQ.A-gUiUyjt9XWxwB2mCfWScOGDCbSGmm-zXt2G5Xseh0';

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function checkStorageFilePaths() {
  console.log('🔍 Checking Storage File Paths\n');
  
  try {
    // List files in food&beverages folder
    const { data, error } = await supabase.storage
      .from('product-images')
      .list('food&beverages', {
        limit: 10
      });
    
    if (error) {
      console.log('❌ Error listing food&beverages:', error.message);
      
      // Try with encoded path
      console.log('\n🔄 Trying with encoded path...');
      const { data: data2, error: error2 } = await supabase.storage
        .from('product-images')
        .list('food%26beverages', {
          limit: 10
        });
      
      if (error2) {
        console.log('❌ Error with encoded path:', error2.message);
      } else {
        console.log('✅ Encoded path works!');
        console.log(`Found ${data2.length} files`);
        data2.forEach(file => {
          console.log(`  - ${file.name}`);
        });
      }
    } else {
      console.log('✅ Unencoded path works!');
      console.log(`Found ${data.length} files`);
      data.forEach(file => {
        console.log(`  - ${file.name}`);
      });
    }
    
    // Try to get a public URL for a specific file
    console.log('\n🔗 Testing public URL generation...');
    
    const { data: publicUrlData, error: urlError } = supabase.storage
      .from('product-images')
      .getPublicUrl('food&beverages/banku-mix.png');
    
    console.log(`Unencoded path URL: ${publicUrlData.publicUrl}`);
    
    const { data: publicUrlData2, error: urlError2 } = supabase.storage
      .from('product-images')
      .getPublicUrl('food%26beverages/banku-mix.png');
    
    console.log(`Encoded path URL: ${publicUrlData2.publicUrl}`);
    
  } catch (error) {
    console.error('❌ Error:', error.message);
  }
}

checkStorageFilePaths();
