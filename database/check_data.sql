-- Check if tables have data
SELECT 'products' as table_name, COUNT(*) as record_count FROM products
UNION ALL
SELECT 'categories' as table_name, COUNT(*) as record_count FROM categories;

-- Check if RLS is enabled
SELECT schemaname, tablename, rowsecurity 
FROM pg_tables 
WHERE schemaname = 'public' AND tablename IN ('products', 'categories');

-- Check existing policies
SELECT schemaname, tablename, policyname, permissive, roles, cmd, qual 
FROM pg_policies 
WHERE schemaname = 'public' AND tablename IN ('products', 'categories');
