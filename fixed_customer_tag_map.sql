-- Fixed version of customer_tag_map table
-- This will work once customer_profiles is properly created

-- First, ensure customer_tags exists
CREATE TABLE IF NOT EXISTS customer_tags (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    name TEXT NOT NULL UNIQUE,
    color TEXT DEFAULT '#6B7280',
    description TEXT,
    is_system BOOLEAN DEFAULT false,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Then create customer_tag_map with proper references
CREATE TABLE IF NOT EXISTS customer_tag_map (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    customer_id UUID NOT NULL REFERENCES customer_profiles(id) ON DELETE CASCADE,
    tag_id UUID NOT NULL REFERENCES customer_tags(id) ON DELETE CASCADE,
    assigned_by INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    assigned_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(customer_id, tag_id)
);

-- Alternative: If customer_profiles still doesn't have id column, use this version:
/*
CREATE TABLE IF NOT EXISTS customer_tag_map (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    customer_id UUID NOT NULL,
    tag_id UUID NOT NULL REFERENCES customer_tags(id) ON DELETE CASCADE,
    assigned_by INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    assigned_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(customer_id, tag_id)
);

-- Add foreign key constraint later when customer_profiles is fixed
-- ALTER TABLE customer_tag_map ADD CONSTRAINT fk_customer_tag_map_customer_id 
--     FOREIGN KEY (customer_id) REFERENCES customer_profiles(id) ON DELETE CASCADE;
*/
