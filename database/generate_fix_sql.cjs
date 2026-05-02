const { createClient } = require('@supabase/supabase-js');

// Use anon key for read operations (we know this works)
const supabase = createClient(
  'https://azpgqsmgyorjbqsgxuxw.supabase.co',
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImF6cGdxc21neW9yamJxc2d4dXh3Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjkyOTg1NjAsImV4cCI6MjA4NDg3NDU2MH0.cxHD8ihT9E5ZAxtkfGa2VjYxYmadbYxyl3xVDPtgh9Q'
);

async function generateFixSQL() {
  try {
    console.log('🔧 Generating SQL Fix Script...\n');
    
    // Step 1: Get categories
    console.log('📂 Step 1: Fetching categories...');
    const { data: categories, error: categoriesError } = await supabase
      .from('categories')
      .select('id, name, slug')
      .order('name');
    
    if (categoriesError) {
      console.error('❌ Error fetching categories:', categoriesError.message);
      return;
    }
    
    console.log(`✅ Found ${categories.length} categories`);
    
    // Step 2: Get uncategorized products
    console.log('\n📦 Step 2: Fetching uncategorized products...');
    const { data: products, error: productsError } = await supabase
      .from('products')
      .select('id, name, price, category_id, status')
      .is('category_id', null)
      .eq('status', 'active')
      .order('name');
    
    if (productsError) {
      console.error('❌ Error fetching products:', productsError.message);
      return;
    }
    
    console.log(`✅ Found ${products.length} uncategorized products`);
    
    // Step 3: Generate SQL statements
    console.log('\n🎯 Step 3: Generating SQL statements...');
    
    const foodKeywords = [
      'banku', 'jollof', 'rice', 'waakye', 'kenkey', 'fufu', 'stew', 'soup',
      'egusi', 'shito', 'gari', 'kelewele', 'plantain', 'beans', 'kontomire',
      'cabbage', 'barbeque', 'chicken', 'fish', 'meat', 'khebab', 'palm',
      'pasta', 'spaghetti', 'tuozafi', 'vegetables', 'bake', 'food', 'ghanaian',
      'nigerian', 'sierra leone', 'party orders', 'combo', 'fried', 'nkulenu',
      'plam', 'sauce'
    ];
    
    let foodUpdates = [];
    let menFashionUpdates = [];
    let womenFashionUpdates = [];
    let defaultFoodUpdates = [];
    
    for (const product of products) {
      const name = product.name.toLowerCase();
      
      // Check for food keywords
      const isFood = foodKeywords.some(keyword => name.includes(keyword));
      if (isFood) {
        foodUpdates.push(product);
        continue;
      }
      
      // Check for fashion keywords
      if (name.includes('dashiki')) {
        if (name.includes('boys') || name.includes('men')) {
          menFashionUpdates.push(product);
        } else {
          womenFashionUpdates.push(product);
        }
        continue;
      }
      
      // Default to food for remaining items
      defaultFoodUpdates.push(product);
    }
    
    // Generate SQL file
    let sql = `-- =====================================================
-- PRODUCT CATEGORY FIX - GENERATED SQL
-- =====================================================
-- Generated on: ${new Date().toISOString()}
-- Total products to update: ${products.length}

-- Start transaction
BEGIN;

-- Create audit table
CREATE TEMPORARY TABLE IF NOT EXISTS category_fix_audit (
    product_id INT,
    product_name TEXT,
    old_category_id INT,
    new_category_id INT,
    category_name TEXT,
    update_time TIMESTAMP DEFAULT NOW()
);

`;
    
    // Add Food & Beverages updates
    sql += `-- =====================================================
-- FOOD & BEVERAGES UPDATES (${foodUpdates.length + defaultFoodUpdates.length} products)
-- =====================================================

`;
    
    [...foodUpdates, ...defaultFoodUpdates].forEach(product => {
      sql += `-- Update: ${product.name}
INSERT INTO category_fix_audit (product_id, product_name, old_category_id, new_category_id, category_name)
VALUES (${product.id}, '${product.name.replace(/'/g, "''")}', NULL, 9, 'Food & Beverages');

UPDATE products 
SET category_id = 9 
WHERE id = ${product.id};

`;
    });
    
    // Add Men Fashion updates
    sql += `-- =====================================================
-- MEN FASHION UPDATES (${menFashionUpdates.length} products)
-- =====================================================

`;
    
    menFashionUpdates.forEach(product => {
      sql += `-- Update: ${product.name}
INSERT INTO category_fix_audit (product_id, product_name, old_category_id, new_category_id, category_name)
VALUES (${product.id}, '${product.name.replace(/'/g, "''")}', NULL, 2, 'Men Fashion');

UPDATE products 
SET category_id = 2 
WHERE id = ${product.id};

`;
    });
    
    // Add Women Fashion updates
    sql += `-- =====================================================
-- WOMEN FASHION UPDATES (${womenFashionUpdates.length} products)
-- =====================================================

`;
    
    womenFashionUpdates.forEach(product => {
      sql += `-- Update: ${product.name}
INSERT INTO category_fix_audit (product_id, product_name, old_category_id, new_category_id, category_name)
VALUES (${product.id}, '${product.name.replace(/'/g, "''")}', NULL, 1, 'Women Fashion');

UPDATE products 
SET category_id = 1 
WHERE id = ${product.id};

`;
    });
    
    // Add validation queries
    sql += `-- =====================================================
-- VALIDATION QUERIES
-- =====================================================

-- Show audit log
SELECT 
    category_name,
    COUNT(*) as updated_count,
    STRING_AGG(product_name, ', ' ORDER BY product_name) as products
FROM category_fix_audit 
GROUP BY category_name
ORDER BY updated_count DESC;

-- Show remaining uncategorized products
SELECT 
    'UNCATEGORIZED REMAINING' as status,
    COUNT(*) as count
FROM products 
WHERE category_id IS NULL 
AND status = 'active';

-- Show updated category counts
SELECT 
    c.name as category_name,
    c.id as category_id,
    COUNT(p.id) as product_count
FROM categories c
LEFT JOIN products p ON c.id = p.category_id AND p.status = 'active'
GROUP BY c.id, c.name
ORDER BY c.name;

-- Commit transaction
COMMIT;

-- =====================================================
-- EXECUTION INSTRUCTIONS
-- =====================================================
-- 1. Run this SQL script in Supabase SQL Editor
-- 2. Review the audit log output
-- 3. Verify all products are categorized
-- 4. If issues occur, run rollback script below

-- =====================================================
-- ROLLBACK SCRIPT (IF NEEDED)
-- =====================================================
/*
BEGIN;

-- Restore all updated products to uncategorized
UPDATE products 
SET category_id = NULL 
WHERE id IN (
    SELECT DISTINCT product_id 
    FROM category_fix_audit
);

-- Verify rollback
SELECT COUNT(*) as rolled_back_count
FROM products 
WHERE category_id IS NULL 
AND status = 'active'
AND id IN (
    SELECT DISTINCT product_id 
    FROM category_fix_audit
);

COMMIT;
*/
`;
    
    // Save SQL file
    const fs = require('fs');
    const path = require('path');
    const sqlFile = path.join(__dirname, 'execute_product_category_fix.sql');
    fs.writeFileSync(sqlFile, sql);
    
    console.log(`✅ SQL script generated: ${sqlFile}`);
    
    // Summary
    console.log('\n📊 Update Summary:');
    console.log(`   Food & Beverages: ${foodUpdates.length + defaultFoodUpdates.length} products`);
    console.log(`   Men Fashion: ${menFashionUpdates.length} products`);
    console.log(`   Women Fashion: ${womenFashionUpdates.length} products`);
    console.log(`   Total: ${products.length} products`);
    
    // Show sample products for each category
    console.log('\n📋 Sample Products by Category:');
    
    if (foodUpdates.length > 0) {
      console.log(`\n🍽️ Food & Beverages (${foodUpdates.length} products):`);
      foodUpdates.slice(0, 5).forEach(p => console.log(`   - ${p.name}`));
      if (foodUpdates.length > 5) console.log(`   ... and ${foodUpdates.length - 5} more`);
    }
    
    if (menFashionUpdates.length > 0) {
      console.log(`\n👔 Men Fashion (${menFashionUpdates.length} products):`);
      menFashionUpdates.slice(0, 5).forEach(p => console.log(`   - ${p.name}`));
      if (menFashionUpdates.length > 5) console.log(`   ... and ${menFashionUpdates.length - 5} more`);
    }
    
    if (womenFashionUpdates.length > 0) {
      console.log(`\n👗 Women Fashion (${womenFashionUpdates.length} products):`);
      womenFashionUpdates.slice(0, 5).forEach(p => console.log(`   - ${p.name}`));
      if (womenFashionUpdates.length > 5) console.log(`   ... and ${womenFashionUpdates.length - 5} more`);
    }
    
    if (defaultFoodUpdates.length > 0) {
      console.log(`\n🍽️ Default to Food & Beverages (${defaultFoodUpdates.length} products):`);
      defaultFoodUpdates.slice(0, 5).forEach(p => console.log(`   - ${p.name}`));
      if (defaultFoodUpdates.length > 5) console.log(`   ... and ${defaultFoodUpdates.length - 5} more`);
    }
    
    console.log('\n🎯 Next Steps:');
    console.log('1. Open Supabase SQL Editor');
    console.log('2. Copy and paste the generated SQL script');
    console.log('3. Execute the script');
    console.log('4. Review the audit log output');
    console.log('5. Verify all products are properly categorized');
    
    console.log('\n🎉 SQL script generation completed!');
    
  } catch (error) {
    console.error('❌ Fatal error:', error.message);
  }
}

// Generate the SQL fix script
generateFixSQL();
