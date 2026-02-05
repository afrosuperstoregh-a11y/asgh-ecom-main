const { createClient } = require('@supabase/supabase-js');

// Supabase configuration
const supabaseUrl = 'https://azpgqsmgyorjbqsgxuxw.supabase.co';
const supabaseServiceKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImF6cGdxc21neW9yamJxc2d4dXh3Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTczNzY4MDYzNCwiZXhwIjoyMDUzMjU2NjM0fQ.NP56NYRxQlqpy9TrVFPAUw_6ixe9gP9';

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function addVideosColumn() {
  try {
    console.log('🔧 Checking if videos column exists...');
    
    // Try to update a product with videos to test if column exists
    const { data, error } = await supabase
      .from('products')
      .update({ videos: [] })
      .eq('slug', 'girls-dashiki')
      .select('id, name, videos')
      .single();
    
    if (error) {
      if (error.message.includes('column "videos" does not exist')) {
        console.log('❌ Videos column does not exist.');
        console.log('📝 Please run this SQL manually in your Supabase SQL Editor:');
        console.log('');
        console.log('ALTER TABLE products ADD COLUMN videos JSONB DEFAULT \'[]\';');
        console.log('');
        console.log('You can run this in:');
        console.log('1. Supabase Dashboard → Database → SQL Editor');
        console.log('2. Select your project and run the SQL above');
      } else {
        console.log('⚠️ Other error:', error.message);
      }
    } else {
      console.log('✅ Videos column exists! Product updated:', data);
    }
    
  } catch (error) {
    console.error('❌ Unexpected error:', error.message);
  }
}

addVideosColumn();
