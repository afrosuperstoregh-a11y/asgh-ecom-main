-- Migration: Update orders table schema to match frontend expectations
-- This updates the orders table to use the new field names

-- First, update any RLS policies that depend on old columns
DO $$
BEGIN
    -- Drop existing policies that depend on customer_id
    IF EXISTS (SELECT FROM pg_policies WHERE tablename = 'orders' AND policyname = 'users_view_own_orders') THEN
        DROP POLICY IF EXISTS users_view_own_orders ON orders;
    END IF;
END $$;

-- Now update the table structure
DO $$
BEGIN
    -- Check if old columns exist and update them
    IF EXISTS (SELECT FROM information_schema.columns WHERE table_name = 'orders' AND column_name = 'customer_id') THEN
        -- Add new user_id column if it doesn't exist
        IF NOT EXISTS (SELECT FROM information_schema.columns WHERE table_name = 'orders' AND column_name = 'user_id') THEN
            ALTER TABLE orders ADD COLUMN user_id UUID;
        END IF;
        
        -- Copy data from customer_id to user_id
        UPDATE orders SET user_id = customer_id WHERE user_id IS NULL AND customer_id IS NOT NULL;
        
        -- Drop old customer_id column
        ALTER TABLE orders DROP COLUMN customer_id;
    END IF;
    
    -- Check if email column exists and update to guest_email
    IF EXISTS (SELECT FROM information_schema.columns WHERE table_name = 'orders' AND column_name = 'email') THEN
        -- Add new guest_email column if it doesn't exist
        IF NOT EXISTS (SELECT FROM information_schema.columns WHERE table_name = 'orders' AND column_name = 'guest_email') THEN
            ALTER TABLE orders ADD COLUMN guest_email TEXT;
        END IF;
        
        -- Copy data from email to guest_email
        UPDATE orders SET guest_email = email WHERE guest_email IS NULL AND email IS NOT NULL;
        
        -- Drop old email column
        ALTER TABLE orders DROP COLUMN email;
    END IF;
    
    -- Check if total_amount column exists and update to total
    IF EXISTS (SELECT FROM information_schema.columns WHERE table_name = 'orders' AND column_name = 'total_amount') THEN
        -- Add new total column if it doesn't exist
        IF NOT EXISTS (SELECT FROM information_schema.columns WHERE table_name = 'orders' AND column_name = 'total') THEN
            ALTER TABLE orders ADD COLUMN total DECIMAL(10,2);
        END IF;
        
        -- Copy data from total_amount to total
        UPDATE orders SET total = total_amount WHERE total IS NULL AND total_amount IS NOT NULL;
        
        -- Drop old total_amount column
        ALTER TABLE orders DROP COLUMN total_amount;
    END IF;
    
    -- Add foreign key constraint for user_id if it doesn't exist
    IF NOT EXISTS (SELECT FROM information_schema.table_constraints WHERE table_name = 'orders' AND constraint_name = 'orders_user_id_fkey') THEN
        -- Try to add constraint to profiles table first, fallback to users if profiles doesn't exist
        BEGIN
            ALTER TABLE orders ADD CONSTRAINT orders_user_id_fkey FOREIGN KEY (user_id) REFERENCES profiles(id) ON DELETE RESTRICT;
        EXCEPTION WHEN foreign_key_violation THEN
            -- Fallback to users table if profiles doesn't exist
            ALTER TABLE orders ADD CONSTRAINT orders_user_id_fkey FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE RESTRICT;
        END;
    END IF;
    
    -- Drop discount_amount column if it exists (no longer needed)
    IF EXISTS (SELECT FROM information_schema.columns WHERE table_name = 'orders' AND column_name = 'discount_amount') THEN
        ALTER TABLE orders DROP COLUMN discount_amount;
    END IF;
END $$;

-- Update order_items table if needed
DO $$
BEGIN
    -- Check if unit_price column exists and update to price
    IF EXISTS (SELECT FROM information_schema.columns WHERE table_name = 'order_items' AND column_name = 'unit_price') THEN
        -- Add new price column if it doesn't exist
        IF NOT EXISTS (SELECT FROM information_schema.columns WHERE table_name = 'order_items' AND column_name = 'price') THEN
            ALTER TABLE order_items ADD COLUMN price DECIMAL(10,2);
        END IF;
        
        -- Copy data from unit_price to price
        UPDATE order_items SET price = unit_price WHERE price IS NULL AND unit_price IS NOT NULL;
        
        -- Drop old unit_price column
        ALTER TABLE order_items DROP COLUMN unit_price;
    END IF;
    
    -- Check if total_price column exists and update to total
    IF EXISTS (SELECT FROM information_schema.columns WHERE table_name = 'order_items' AND column_name = 'total_price') THEN
        -- Add new total column if it doesn't exist
        IF NOT EXISTS (SELECT FROM information_schema.columns WHERE table_name = 'order_items' AND column_name = 'total') THEN
            ALTER TABLE order_items ADD COLUMN total DECIMAL(10,2);
        END IF;
        
        -- Copy data from total_price to total
        UPDATE order_items SET total = total_price WHERE total IS NULL AND total_price IS NOT NULL;
        
        -- Drop old total_price column
        ALTER TABLE order_items DROP COLUMN total_price;
    END IF;
    
    -- Drop product_name and product_sku columns if they exist
    IF EXISTS (SELECT FROM information_schema.columns WHERE table_name = 'order_items' AND column_name = 'product_name') THEN
        ALTER TABLE order_items DROP COLUMN product_name;
    END IF;
    
    IF EXISTS (SELECT FROM information_schema.columns WHERE table_name = 'order_items' AND column_name = 'product_sku') THEN
        ALTER TABLE order_items DROP COLUMN product_sku;
    END IF;
END $$;

-- Update payments table if needed
DO $$
BEGIN
    -- Check if payment_method column exists and update to provider
    IF EXISTS (SELECT FROM information_schema.columns WHERE table_name = 'payments' AND column_name = 'payment_method') THEN
        -- Add new provider column if it doesn't exist
        IF NOT EXISTS (SELECT FROM information_schema.columns WHERE table_name = 'payments' AND column_name = 'provider') THEN
            ALTER TABLE payments ADD COLUMN provider TEXT;
        END IF;
        
        -- Copy data from payment_method to provider
        UPDATE payments SET provider = payment_method WHERE provider IS NULL AND payment_method IS NOT NULL;
        
        -- Drop old payment_method column
        ALTER TABLE payments DROP COLUMN payment_method;
    END IF;
    
    -- Check if payment_intent_id column exists and update to provider_id
    IF EXISTS (SELECT FROM information_schema.columns WHERE table_name = 'payments' AND column_name = 'payment_intent_id') THEN
        -- Add new provider_id column if it doesn't exist
        IF NOT EXISTS (SELECT FROM information_schema.columns WHERE table_name = 'payments' AND column_name = 'provider_id') THEN
            ALTER TABLE payments ADD COLUMN provider_id TEXT;
        END IF;
        
        -- Copy data from payment_intent_id to provider_id
        UPDATE payments SET provider_id = payment_intent_id WHERE provider_id IS NULL AND payment_intent_id IS NOT NULL;
        
        -- Drop old payment_intent_id column
        ALTER TABLE payments DROP COLUMN payment_intent_id;
    END IF;
END $$;

-- Recreate RLS policies with new column names
DO $$
BEGIN
    -- Create new policy for users to view their own orders
    IF EXISTS (SELECT FROM information_schema.tables WHERE table_name = 'orders') THEN
        CREATE POLICY users_view_own_orders ON orders
            FOR ALL
            USING (auth.uid() = user_id)
            WITH CHECK (auth.uid() = user_id);
    END IF;
END $$;
