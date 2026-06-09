/**
 * Simple Audit of Products and Categories Tables
 * Uses direct Supabase queries instead of exec_sql
 */

const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error('Missing SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function auditTables() {
  console.log('=== Products and Categories Simple Audit ===\n');

  try {
    // Test products query
    console.log('--- Test Products Query ---');
    const { data: products, error: productsError } = await supabase
      .from('products')
      .select('id, name, category_id, status')
      .limit(5);

    if (productsError) {
      console.error('❌ Products query failed:', productsError);
      console.error('Error code:', productsError.code);
      console.error('Error message:', productsError.message);
      console.error('Error details:', productsError.details);
      console.error('Error hint:', productsError.hint);
    } else {
      console.log('✅ Products query succeeded');
      console.log('Sample products:', JSON.stringify(products, null, 2));
    }

    // Test categories query
    console.log('\n--- Test Categories Query ---');
    const { data: categories, error: categoriesError } = await supabase
      .from('categories')
      .select('id, name, is_active, sort_order')
      .eq('is_active', true)
      .limit(5);

    if (categoriesError) {
      console.error('❌ Categories query failed:', categoriesError);
      console.error('Error code:', categoriesError.code);
      console.error('Error message:', categoriesError.message);
      console.error('Error details:', categoriesError.details);
      console.error('Error hint:', categoriesError.hint);
    } else {
      console.log('✅ Categories query succeeded');
      console.log('Sample categories:', JSON.stringify(categories, null, 2));
    }

    // Test products with categories join
    console.log('\n--- Test Products-Categories Join ---');
    const { data: productsWithCategories, error: joinError } = await supabase
      .from('products')
      .select(`
        id,
        name,
        category_id,
        categories (
          id,
          name,
          slug
        )
      `)
      .limit(3);

    if (joinError) {
      console.error('❌ Join query failed:', joinError);
      console.error('Error code:', joinError.code);
      console.error('Error message:', joinError.message);
      console.error('Error details:', joinError.details);
      console.error('Error hint:', joinError.hint);
    } else {
      console.log('✅ Join query succeeded');
      console.log('Sample data:', JSON.stringify(productsWithCategories, null, 2));
    }

    // Check if category_id column exists in products
    console.log('\n--- Check category_id in products ---');
    if (products && products.length > 0) {
      const hasCategoryId = products[0].hasOwnProperty('category_id');
      console.log('category_id exists:', hasCategoryId);
      if (hasCategoryId) {
        console.log('Sample category_id values:', products.map(p => p.category_id));
      }
    }

    // Test the exact query that's failing
    console.log('\n--- Test Exact Failing Query ---');
    const { data: exactQuery, error: exactError } = await supabase
      .from('products')
      .select('*,categories(id,name,slug)')
      .limit(10);

    if (exactError) {
      console.error('❌ Exact query failed:', exactError);
      console.error('Error code:', exactError.code);
      console.error('Error message:', exactError.message);
      console.error('Error details:', exactError.details);
      console.error('Error hint:', exactError.hint);
    } else {
      console.log('✅ Exact query succeeded');
      console.log('Results count:', exactQuery?.length || 0);
    }

    // Test the exact categories query
    console.log('\n--- Test Exact Categories Query ---');
    const { data: exactCategories, error: exactCategoriesError } = await supabase
      .from('categories')
      .select('*')
      .eq('is_active', true)
      .order('sort_order', { ascending: true });

    if (exactCategoriesError) {
      console.error('❌ Exact categories query failed:', exactCategoriesError);
      console.error('Error code:', exactCategoriesError.code);
      console.error('Error message:', exactCategoriesError.message);
      console.error('Error details:', exactCategoriesError.details);
      console.error('Error hint:', exactCategoriesError.hint);
    } else {
      console.log('✅ Exact categories query succeeded');
      console.log('Results count:', exactCategories?.length || 0);
    }

  } catch (error) {
    console.error('Unexpected error:', error);
  }
}

auditTables().catch(console.error);
