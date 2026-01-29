-- Test script to isolate the issue
-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Drop existing table
DROP TABLE IF EXISTS customer_profiles CASCADE;

-- Create customer_profiles table with minimal structure
CREATE TABLE customer_profiles (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    user_id INTEGER NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Test if table was created successfully
SELECT column_name, data_type 
FROM information_schema.columns 
WHERE table_name = 'customer_profiles' 
ORDER BY ordinal_position;
