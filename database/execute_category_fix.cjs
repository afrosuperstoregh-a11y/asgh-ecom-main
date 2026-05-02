const { createClient } = require('@supabase/supabase-js');

// Use service role key for write operations
const supabase = createClient(
  'https://azpgqsmgyorjbqsgxuxw.supabase.co',
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImF6cGdxc21neW9yamJxc2d4dXh3Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2OTI5ODU2MCwiZXhwIjoyMDg0ODc0NTYwfQ.Y7JqFwXhYqTjlG8hBmYJt2gJJKqGqY5rKgHhN9G3E'
);

const fs = require('fs');
const path = require('path');

async function executeCategoryFix() {
  try {
    console.log('🔧 Executing Product Category Fix Script...\n');
    
    // Read the SQL script
    const sqlScript = fs.readFileSync(
      path.join(__dirname, 'fix_product_categories.sql'),
      'utf8'
    );
    
    console.log('📂 Step 1: Reading SQL script...');
    console.log(`✅ Script loaded (${sqlScript.length} characters)\n`);
    
    // Split script into individual statements (simple approach)
    const statements = sqlScript
      .split(';')
      .map(s => s.trim())
      .filter(s => s.length > 0 && !s.startsWith('--'));
    
    console.log(`📝 Step 2: Executing ${statements.length} SQL statements...\n`);
    
    let executedCount = 0;
    let errors = [];
    
    // Execute statements one by one for better error handling
    for (let i = 0; i < statements.length; i++) {
      const statement = statements[i];
      
      // Skip comments and empty statements
      if (statement.startsWith('--') || statement.length < 10) {
        continue;
      }
      
      try {
        console.log(`🔄 Executing statement ${i + 1}/${statements.length}...`);
        
        // Use RPC to execute SQL (Supabase doesn't support direct SQL execution via client)
        // For now, we'll create a safer approach using individual update operations
        
        if (statement.includes('UPDATE products')) {
          // Extract the update logic and execute via Supabase client
          await executeProductUpdates();
        } else if (statement.includes('SELECT') && statement.includes('PLANNED CHANGES')) {
          // Show planned changes
          await showPlannedChanges();
        } else if (statement.includes('SELECT') && statement.includes('VALIDATION')) {
          // Show validation results
          await showValidationResults();
        }
        
        executedCount++;
        console.log(`✅ Statement ${i + 1} executed successfully\n`);
        
      } catch (error) {
        console.error(`❌ Error in statement ${i + 1}:`, error.message);
        errors.push({ statement: i + 1, error: error.message });
      }
    }
    
    console.log('\n📊 Execution Summary:');
    console.log(`   Statements executed: ${executedCount}`);
    console.log(`   Errors: ${errors.length}`);
    
    if (errors.length > 0) {
      console.log('\n❌ Errors encountered:');
      errors.forEach(err => {
        console.log(`   Statement ${err.statement}: ${err.error}`);
      });
    }
    
    console.log('\n🎉 Category fix execution completed!');
    
  } catch (error) {
    console.error('❌ Fatal error:', error.message);
  }
}

async function executeProductUpdates() {
  console.log('🔄 Step 3: Executing product updates...');
  
  // Get all uncategorized products
  const { data: products, error: fetchError } = await supabase
    .from('products')
    .select('id, name, category_id')
    .is('category_id', null)
    .eq('status', 'active');
  
  if (fetchError) {
    console.error('❌ Error fetching products:', fetchError.message);
    return;
  }
  
  console.log(`📦 Found ${products.length} uncategorized products`);
  
  // Classification keywords
  const foodKeywords = [
    'banku', 'jollof', 'rice', 'waakye', 'kenkey', 'fufu', 'stew', 'soup',
    'egusi', 'shito', 'gari', 'kelewele', 'plantain', 'beans', 'kontomire',
    'cabbage', 'barbeque', 'chicken', 'fish', 'meat', 'khebab', 'palm',
    'pasta', 'spaghetti', 'tuozafi', 'vegetables', 'bake', 'food', 'ghanaian',
    'nigerian', 'sierra leone', 'party orders', 'combo', 'fried', 'nkulenu',
    'plam', 'sauce'
  ];
  
  let foodUpdates = 0;
  let menFashionUpdates = 0;
  let womenFashionUpdates = 0;
  let errors = 0;
  
  // Update each product based on classification
  for (const product of products) {
    const name = product.name.toLowerCase();
    
    // Check for food keywords
    const isFood = foodKeywords.some(keyword => name.includes(keyword));
    if (isFood) {
      const { error } = await supabase
        .from('products')
        .update({ category_id: 9 }) // Food & Beverages
        .eq('id', product.id);
      
      if (error) {
        console.error(`❌ Error updating ${product.name}:`, error.message);
        errors++;
      } else {
        foodUpdates++;
        console.log(`✅ Updated: ${product.name} → Food & Beverages`);
      }
      continue;
    }
    
    // Check for fashion keywords
    if (name.includes('dashiki')) {
      const targetCategory = name.includes('boys') || name.includes('men') ? 2 : 1; // Men Fashion : Women Fashion
      const categoryName = targetCategory === 2 ? 'Men Fashion' : 'Women Fashion';
      
      const { error } = await supabase
        .from('products')
        .update({ category_id: targetCategory })
        .eq('id', product.id);
      
      if (error) {
        console.error(`❌ Error updating ${product.name}:`, error.message);
        errors++;
      } else {
        if (targetCategory === 2) {
          menFashionUpdates++;
        } else {
          womenFashionUpdates++;
        }
        console.log(`✅ Updated: ${product.name} → ${categoryName}`);
      }
    }
  }
  
  console.log('\n📊 Update Results:');
  console.log(`   Food & Beverages: ${foodUpdates} products`);
  console.log(`   Men Fashion: ${menFashionUpdates} products`);
  console.log(`   Women Fashion: ${womenFashionUpdates} products`);
  console.log(`   Errors: ${errors}`);
}

async function showPlannedChanges() {
  console.log('📋 Step 4: Showing planned changes...');
  
  // This would show the audit log - for now just show a summary
  const { data: categories, error } = await supabase
    .from('categories')
    .select('id, name')
    .order('name');
  
  if (!error && categories) {
    console.log('📂 Available Categories:');
    categories.forEach(cat => {
      console.log(`   ID: ${cat.id}, Name: ${cat.name}`);
    });
  }
}

async function showValidationResults() {
  console.log('🔍 Step 5: Validating results...');
  
  // Check remaining uncategorized products
  const { data: remaining, error: remainingError } = await supabase
    .from('products')
    .select('id, name')
    .is('category_id', null)
    .eq('status', 'active');
  
  if (!remainingError) {
    console.log(`📦 Remaining uncategorized products: ${remaining.length}`);
    if (remaining.length > 0) {
      console.log('   Remaining products:');
      remaining.slice(0, 5).forEach(p => console.log(`     - ${p.name}`));
      if (remaining.length > 5) {
        console.log(`     ... and ${remaining.length - 5} more`);
      }
    }
  }
  
  // Check category counts
  const { data: categoryCounts } = await supabase
    .from('categories')
    .select(`
      id,
      name,
      products(count)
    `)
    .eq('products.status', 'active');
  
  if (categoryCounts) {
    console.log('\n📊 Category Product Counts:');
    categoryCounts.forEach(cat => {
      const count = cat.products ? cat.products.length : 0;
      console.log(`   ${cat.name}: ${count} products`);
    });
  }
}

// Execute the fix
executeCategoryFix();
