-- Step 1: Test basic table creation
-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Drop existing table
DROP TABLE IF EXISTS customer_profiles CASCADE;

-- Create minimal table
CREATE TABLE customer_profiles (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id INTEGER NOT NULL
);

-- Verify table was created
SELECT 'customer_profiles table created successfully' as status;
SELECT column_name, data_type FROM information_schema.columns 
WHERE table_name = 'customer_profiles' ORDER BY ordinal_position;
