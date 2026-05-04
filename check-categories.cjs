const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(
  'https://azpgqsmgyorjbqsgxuxw.supabase.co',
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImF6cGdxc21neW9yamJxc2d4dXh3Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2OTI5ODU2MCwiZXhwIjoyMDg0ODc0NTYwfQ.Y7JqFwXhYqTjlG8hBmYJt2gJJKqGqY5rKgHhN9G3E'
);

async function checkCategories() {
  try {
    const { data: categories, error: catError } = await supabase
      .from('categories')
      .select('*')
      .order('name');
    
    if (catError) throw catError;
    
    console.log('=== CATEGORIES FOUND ===');
    categories.forEach(cat => {
      console.log(`ID: ${cat.id}, Name: ${cat.name}, Slug: ${cat.slug}, Active: ${cat.is_active}`);
    });
    
    const { data: products, error: prodError } = await supabase
      .from('products')
      .select('id, name, category_id, status')
      .eq('status', 'active');
    
    if (prodError) throw prodError;
    
    console.log('\n=== PRODUCTS BY CATEGORY ===');
    const categoryMap = {};
    
    categories.forEach(cat => {
      categoryMap[cat.id] = cat.name;
      const catProducts = products.filter(p => p.category_id === cat.id);
      console.log(`\n${cat.name} (${catProducts.length} products):`);
      catProducts.forEach(product => {
        console.log(`  - ${product.name} (ID: ${product.id})`);
      });
    });
    
    const uncategorized = products.filter(p => !p.category_id);
    if (uncategorized.length > 0) {
      console.log(`\nUNCATEGORIZED (${uncategorized.length} products):`);
      uncategorized.forEach(product => {
        console.log(`  - ${product.name} (ID: ${product.id})`);
      });
    }
    
  } catch (error) {
    console.error('Error:', error.message);
  }
}

checkCategories();
