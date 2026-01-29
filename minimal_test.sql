-- Minimal test to isolate the issue
-- Test 1: Check if we can create any table with UUID
CREATE TABLE test_uuid_table (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT
);

-- Test 2: Check if we can create a simple customer_profiles table
DROP TABLE IF EXISTS test_uuid_table;

CREATE TABLE customer_profiles (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id INTEGER NOT NULL
);

-- Test 3: Verify the table structure
SELECT 'Table created successfully' as status;
SELECT column_name, data_type FROM information_schema.columns 
WHERE table_name = 'customer_profiles' ORDER BY ordinal_position;

-- Test 4: Try to create a simple reference
CREATE TABLE test_reference (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    customer_id UUID REFERENCES customer_profiles(id)
);

SELECT 'Reference created successfully' as status;
