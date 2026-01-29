-- AfroSuperStore - Create Missing Tables
-- Run this SQL directly in Supabase SQL Editor

-- Enable UUID extension if not already enabled
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Create admin_users table
CREATE TABLE IF NOT EXISTS admin_users (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    permissions JSONB DEFAULT '{}',
    last_login TIMESTAMP WITH TIME ZONE,
    login_count INTEGER DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(user_id)
);

-- Create payments table
CREATE TABLE IF NOT EXISTS payments (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    order_id INTEGER NOT NULL REFERENCES orders(id) ON DELETE CASCADE,
    amount DECIMAL(10,2) NOT NULL,
    currency VARCHAR(3) DEFAULT 'USD',
    status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'processing', 'succeeded', 'failed', 'cancelled', 'refunded')),
    payment_method TEXT NOT NULL CHECK (payment_method IN ('stripe', 'paypal', 'cash_on_delivery')),
    payment_intent_id VARCHAR(255),
    gateway_response JSONB,
    failure_reason TEXT,
    processed_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create inventory_logs table
CREATE TABLE IF NOT EXISTS inventory_logs (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    product_id INTEGER NOT NULL REFERENCES products(id) ON DELETE CASCADE,
    order_id INTEGER REFERENCES orders(id) ON DELETE SET NULL,
    type TEXT NOT NULL CHECK (type IN ('sale', 'restock', 'adjustment', 'return')),
    quantity_change INTEGER NOT NULL,
    previous_quantity INTEGER NOT NULL,
    new_quantity INTEGER NOT NULL,
    reason TEXT,
    created_by INTEGER REFERENCES users(id) ON DELETE SET NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_admin_users_user_id ON admin_users(user_id);
CREATE INDEX IF NOT EXISTS idx_payments_order ON payments(order_id);
CREATE INDEX IF NOT EXISTS idx_payments_status ON payments(status);
CREATE INDEX IF NOT EXISTS idx_inventory_logs_product ON inventory_logs(product_id);
CREATE INDEX IF NOT EXISTS idx_inventory_logs_order ON inventory_logs(order_id);

-- Create updated_at trigger function if not exists
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Create triggers for new tables
CREATE TRIGGER update_admin_users_updated_at BEFORE UPDATE ON admin_users FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_payments_updated_at BEFORE UPDATE ON payments FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Update existing admin user to have admin_users record
INSERT INTO admin_users (
    user_id,
    permissions,
    login_count
) SELECT 
    u.id,
    '{"canManageProducts": true, "canManageOrders": true, "canManageUsers": true, "canManageSettings": true, "canViewAnalytics": true}'::jsonb,
    0
FROM users u 
WHERE u.email = 'admin@afrosuperstore.ca' AND u.role = 'super_admin'
AND NOT EXISTS (SELECT 1 FROM admin_users WHERE user_id = u.id)
ON CONFLICT (user_id) DO NOTHING;

-- Verify creation
SELECT 
    'admin_users' as table_name, 
    COUNT(*) as record_count 
FROM admin_users
UNION ALL
SELECT 
    'payments' as table_name, 
    COUNT(*) as record_count 
FROM payments
UNION ALL
SELECT 
    'inventory_logs' as table_name, 
    COUNT(*) as record_count 
FROM inventory_logs;
