/**
 * Audit Products and Categories Tables Schema
 * This script checks the actual schema of products and categories tables
 * and verifies foreign key relationships
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

async function auditTablesSchema() {
  console.log('=== Products and Categories Schema Audit ===\n');

  try {
    // Check products table schema
    console.log('--- Products Table Schema ---');
    const { data: productsColumns, error: productsError } = await supabase
      .rpc('exec_sql', {
        sql: `
          SELECT 
            column_name,
            data_type,
            is_nullable,
            column_default
          FROM information_schema.columns
          WHERE table_name = 'products'
          AND table_schema = 'public'
          ORDER BY ordinal_position
        `
      });

    if (productsError) {
      console.error('Error fetching products schema:', productsError);
    } else {
      console.log('Products columns:');
      console.log(JSON.stringify(productsColumns, null, 2));
    }

    // Check categories table schema
    console.log('\n--- Categories Table Schema ---');
    const { data: categoriesColumns, error: categoriesError } = await supabase
      .rpc('exec_sql', {
        sql: `
          SELECT 
            column_name,
            data_type,
            is_nullable,
            column_default
          FROM information_schema.columns
          WHERE table_name = 'categories'
          AND table_schema = 'public'
          ORDER BY ordinal_position
        `
      });

    if (categoriesError) {
      console.error('Error fetching categories schema:', categoriesError);
    } else {
      console.log('Categories columns:');
      console.log(JSON.stringify(categoriesColumns, null, 2));
    }

    // Check foreign key relationships
    console.log('\n--- Foreign Key Relationships ---');
    const { data: foreignKeys, error: fkError } = await supabase
      .rpc('exec_sql', {
        sql: `
          SELECT
            tc.table_name,
            kcu.column_name,
            ccu.table_name AS foreign_table_name,
            ccu.column_name AS foreign_column_name,
            tc.constraint_name
          FROM information_schema.table_constraints AS tc
          JOIN information_schema.key_column_usage AS kcu
            ON tc.constraint_name = kcu.constraint_name
            AND tc.table_schema = kcu.table_schema
          JOIN information_schema.constraint_column_usage AS ccu
            ON ccu.constraint_name = tc.constraint_name
            AND ccu.table_schema = tc.table_schema
          WHERE tc.constraint_type = 'FOREIGN KEY'
          AND tc.table_schema = 'public'
          AND tc.table_name IN ('products', 'categories')
          ORDER BY tc.table_name, kcu.column_name
        `
      });

    if (fkError) {
      console.error('Error fetching foreign keys:', fkError);
    } else {
      console.log('Foreign key relationships:');
      console.log(JSON.stringify(foreignKeys, null, 2));
    }

    // Check if products.category_id exists
    console.log('\n--- Verify products.category_id exists ---');
    const { data: categoryIdCheck, error: categoryIdError } = await supabase
      .rpc('exec_sql', {
        sql: `
          SELECT 
            column_name,
            data_type,
            is_nullable
          FROM information_schema.columns
          WHERE table_name = 'products'
          AND table_schema = 'public'
          AND column_name = 'category_id'
        `
      });

    if (categoryIdError) {
      console.error('Error checking category_id:', categoryIdError);
    } else if (categoryIdCheck && categoryIdCheck.length > 0) {
      console.log('✅ products.category_id exists:', categoryIdCheck[0]);
    } else {
      console.log('❌ products.category_id does NOT exist - needs to be added');
    }

    // Test the join query
    console.log('\n--- Test Products-Categories Join ---');
    const { data: joinTest, error: joinError } = await supabase
      .from('products')
      .select(`
        *,
        categories (id, name, slug)
      `)
      .limit(1);

    if (joinError) {
      console.error('❌ Join query failed:', joinError);
      console.error('Error details:', {
        code: joinError.code,
        message: joinError.message,
        details: joinError.details,
        hint: joinError.hint
      });
    } else {
      console.log('✅ Join query succeeded');
      console.log('Sample data:', JSON.stringify(joinTest, null, 2));
    }

    // Check RLS policies on products
    console.log('\n--- Products RLS Policies ---');
    const { data: productsPolicies, error: productsPoliciesError } = await supabase
      .rpc('exec_sql', {
        sql: `
          SELECT 
            schemaname,
            tablename,
            policyname,
            permissive,
            roles,
            cmd,
            qual,
            with_check
          FROM pg_policies
          WHERE tablename = 'products'
          AND schemaname = 'public'
          ORDER BY policyname
        `
      });

    if (productsPoliciesError) {
      console.error('Error fetching products policies:', productsPoliciesError);
    } else {
      console.log('Products RLS policies:');
      console.log(JSON.stringify(productsPolicies, null, 2));
    }

    // Check RLS policies on categories
    console.log('\n--- Categories RLS Policies ---');
    const { data: categoriesPolicies, error: categoriesPoliciesError } = await supabase
      .rpc('exec_sql', {
        sql: `
          SELECT 
            schemaname,
            tablename,
            policyname,
            permissive,
            roles,
            cmd,
            qual,
            with_check
          FROM pg_policies
          WHERE tablename = 'categories'
          AND schemaname = 'public'
          ORDER BY policyname
        `
      });

    if (categoriesPoliciesError) {
      console.error('Error fetching categories policies:', categoriesPoliciesError);
    } else {
      console.log('Categories RLS policies:');
      console.log(JSON.stringify(categoriesPolicies, null, 2));
    }

    // Test public read access to products
    console.log('\n--- Test Public Read Access to Products ---');
    const { data: publicProductsTest, error: publicProductsError } = await supabase
      .from('products')
      .select('id, name')
      .limit(1);

    if (publicProductsError) {
      console.error('❌ Public read to products failed:', publicProductsError);
    } else {
      console.log('✅ Public read to products succeeded');
    }

    // Test public read access to categories
    console.log('\n--- Test Public Read Access to Categories ---');
    const { data: publicCategoriesTest, error: publicCategoriesError } = await supabase
      .from('categories')
      .select('id, name')
      .eq('is_active', true)
      .limit(1);

    if (publicCategoriesError) {
      console.error('❌ Public read to categories failed:', publicCategoriesError);
    } else {
      console.log('✅ Public read to categories succeeded');
    }

  } catch (error) {
    console.error('Unexpected error:', error);
  }
}

auditTablesSchema().catch(console.error);
