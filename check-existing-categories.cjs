const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = 'https://lljxxaejmueoxsaqaowf.supabase.co';
const supabaseServiceKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imxsanh4YWVqbXVlb3hzYXFhb3dmIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3ODEwODIyMSwiZXhwIjoyMDkzNjg0MjIxfQ.qXvtkAhMYRSOHSQUFVdLGQypZ0_k-Z5Y2TlDDYJBzFQ';

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function checkCategories() {
  try {
    console.log('🔍 Checking existing categories...\n');
    
    const { data: categories, error } = await supabase
      .from('categories')
      .select('*');
    
    if (error) {
      console.error('❌ Error fetching categories:', error);
      return;
    }
    
    console.log(`📊 Found ${categories.length} categories\n`);
    
    categories.forEach(cat => {
      console.log(`  - ${cat.name} (ID: ${cat.id}, Slug: ${cat.slug})`);
    });
    
  } catch (error) {
    console.error('❌ Error:', error.message);
  }
}

checkCategories();
