-- Check what's actually in the database
-- List all tables
SELECT table_name FROM information_schema.tables 
WHERE table_schema = 'public' AND table_name LIKE 'customer_%' 
ORDER BY table_name;

-- Check if customer_profiles exists and its structure
SELECT column_name, data_type, is_nullable, column_default 
FROM information_schema.columns 
WHERE table_name = 'customer_profiles' 
ORDER BY ordinal_position;

-- Check if there are any constraints on customer_profiles
SELECT constraint_name, constraint_type 
FROM information_schema.table_constraints 
WHERE table_name = 'customer_profiles';
