-- Migration 005: Setup Row Level Security (RLS) Policies
-- This migration sets up comprehensive RLS policies for all tables

-- Enable RLS on all user-related tables
ALTER TABLE IF EXISTS profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS products ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS categories ENABLE ROW LEVEL SECURITY;

-- Drop existing policies to avoid conflicts
DROP POLICY IF EXISTS "Users can view own profile" ON profiles;
DROP POLICY IF EXISTS "Users can update own profile" ON profiles;
DROP POLICY IF EXISTS "Users can insert own profile" ON profiles;
DROP POLICY IF EXISTS "Admins can view all profiles" ON profiles;
DROP POLICY IF EXISTS "Admins can update all profiles" ON profiles;

-- Profiles Table Policies
CREATE POLICY "Users can view own profile" ON profiles
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can update own profile" ON profiles
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own profile" ON profiles
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Admins can view all profiles" ON profiles
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM profiles 
      WHERE user_id = auth.uid() 
      AND role IN ('admin', 'super_admin')
    )
  );

CREATE POLICY "Admins can update all profiles" ON profiles
  FOR UPDATE USING (
    EXISTS (
      SELECT 1 FROM profiles 
      WHERE user_id = auth.uid() 
      AND role IN ('admin', 'super_admin')
    )
  );

CREATE POLICY "Admins can delete all profiles" ON profiles
  FOR DELETE USING (
    EXISTS (
      SELECT 1 FROM profiles 
      WHERE user_id = auth.uid() 
      AND role IN ('admin', 'super_admin')
    )
  );

-- Orders Table Policies
DROP POLICY IF EXISTS "Users can view own orders" ON orders;
DROP POLICY IF EXISTS "Admins can view all orders" ON orders;
DROP POLICY IF EXISTS "Users can create own orders" ON orders;
DROP POLICY IF EXISTS "Admins can update all orders" ON orders;

CREATE POLICY "Users can view own orders" ON orders
  FOR SELECT USING (customer_id = auth.uid());

CREATE POLICY "Admins can view all orders" ON orders
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM profiles 
      WHERE user_id = auth.uid() 
      AND role IN ('admin', 'super_admin')
    )
  );

CREATE POLICY "Users can create own orders" ON orders
  FOR INSERT WITH CHECK (customer_id = auth.uid());

CREATE POLICY "Admins can update all orders" ON orders
  FOR UPDATE USING (
    EXISTS (
      SELECT 1 FROM profiles 
      WHERE user_id = auth.uid() 
      AND role IN ('admin', 'super_admin')
    )
  );

CREATE POLICY "Admins can delete all orders" ON orders
  FOR DELETE USING (
    EXISTS (
      SELECT 1 FROM profiles 
      WHERE user_id = auth.uid() 
      AND role IN ('admin', 'super_admin')
    )
  );

-- Products Table Policies (public read, admin write)
DROP POLICY IF EXISTS "Public can view products" ON products;
DROP POLICY IF EXISTS "Admins can manage products" ON products;

CREATE POLICY "Public can view products" ON products
  FOR SELECT USING (true);

CREATE POLICY "Admins can manage products" ON products
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM profiles 
      WHERE user_id = auth.uid() 
      AND role IN ('admin', 'super_admin')
    )
  );

-- Categories Table Policies (public read, admin write)
DROP POLICY IF EXISTS "Public can view categories" ON categories;
DROP POLICY IF EXISTS "Admins can manage categories" ON categories;

CREATE POLICY "Public can view categories" ON categories
  FOR SELECT USING (true);

CREATE POLICY "Admins can manage categories" ON categories
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM profiles 
      WHERE user_id = auth.uid() 
      AND role IN ('admin', 'super_admin')
    )
  );

-- Create function to check admin status
CREATE OR REPLACE FUNCTION is_admin(user_id UUID)
RETURNS BOOLEAN AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM profiles 
    WHERE profiles.user_id = is_admin.user_id 
    AND profiles.role IN ('admin', 'super_admin')
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create function to check super admin status
CREATE OR REPLACE FUNCTION is_super_admin(user_id UUID)
RETURNS BOOLEAN AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM profiles 
    WHERE profiles.user_id = is_super_admin.user_id 
    AND profiles.role = 'super_admin'
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create function to check resource ownership
CREATE OR REPLACE FUNCTION owns_resource(resource_user_id UUID)
RETURNS BOOLEAN AS $$
BEGIN
  RETURN auth.uid() = owns_resource.resource_user_id OR is_admin(auth.uid());
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Grant execute permissions on functions
GRANT EXECUTE ON FUNCTION is_admin(UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION is_super_admin(UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION owns_resource(UUID) TO authenticated;

-- Create view for user orders with profile information
CREATE OR REPLACE VIEW user_orders AS
SELECT 
  o.*,
  p.first_name,
  p.last_name,
  p.email
FROM orders o
LEFT JOIN profiles p ON o.customer_id = p.user_id;

-- Grant permissions on view
GRANT SELECT ON user_orders TO authenticated;
GRANT SELECT ON user_orders TO anon;

-- Add comments for documentation
COMMENT ON POLICY "Users can view own profile" ON profiles IS 'Users can only see their own profile data';
COMMENT ON POLICY "Admins can view all profiles" ON profiles IS 'Administrators can view all user profiles';
COMMENT ON POLICY "Users can view own orders" ON orders IS 'Users can only see their own orders';
COMMENT ON POLICY "Public can view products" ON products IS 'All users (including anonymous) can view products';
COMMENT ON FUNCTION is_admin(UUID) IS 'Helper function to check if user has admin privileges';
COMMENT ON FUNCTION owns_resource(UUID) IS 'Helper function to check if user owns a resource or is admin';

-- Create audit log table for admin actions
CREATE TABLE IF NOT EXISTS admin_audit_log (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  admin_user_id UUID NOT NULL REFERENCES auth.users(id),
  action VARCHAR(50) NOT NULL,
  table_name VARCHAR(50),
  record_id UUID,
  old_values JSONB,
  new_values JSONB,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Enable RLS on audit log
ALTER TABLE admin_audit_log ENABLE ROW LEVEL SECURITY;

-- Only admins can view audit logs
CREATE POLICY "Admins can view audit log" ON admin_audit_log
  FOR SELECT USING (is_admin(auth.uid()));

-- Only the system and admins can insert audit logs
CREATE POLICY "System can insert audit log" ON admin_audit_log
  FOR INSERT WITH CHECK (is_admin(auth.uid()));

-- Grant permissions
GRANT ALL ON admin_audit_log TO authenticated;
GRANT SELECT ON admin_audit_log TO authenticated;

-- Create trigger function for auditing
CREATE OR REPLACE FUNCTION audit_admin_changes()
RETURNS TRIGGER AS $$
BEGIN
  -- Only audit if the user is an admin
  IF is_admin(auth.uid()) THEN
    INSERT INTO admin_audit_log (
      admin_user_id,
      action,
      table_name,
      record_id,
      old_values,
      new_values
    ) VALUES (
      auth.uid(),
      TG_OP,
      TG_TABLE_NAME,
      COALESCE(NEW.id, OLD.id),
      CASE WHEN TG_OP = 'DELETE' THEN row_to_json(OLD) ELSE NULL END,
      CASE WHEN TG_OP IN ('INSERT', 'UPDATE') THEN row_to_json(NEW) ELSE NULL END
    );
  END IF;
  
  RETURN COALESCE(NEW, OLD);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Add audit triggers to sensitive tables
DROP TRIGGER IF EXISTS audit_profiles_changes ON profiles;
CREATE TRIGGER audit_profiles_changes
  AFTER INSERT OR UPDATE OR DELETE ON profiles
  FOR EACH ROW EXECUTE FUNCTION audit_admin_changes();

DROP TRIGGER IF EXISTS audit_orders_changes ON orders;
CREATE TRIGGER audit_orders_changes
  AFTER INSERT OR UPDATE OR DELETE ON orders
  FOR EACH ROW EXECUTE FUNCTION audit_admin_changes();

-- Create migration log entry
INSERT INTO migration_log (migration_file, executed_at, status) 
VALUES ('005_setup_rls_policies.sql', CURRENT_TIMESTAMP, 'completed')
ON CONFLICT (migration_file) DO UPDATE SET 
executed_at = CURRENT_TIMESTAMP, 
status = 'completed';

-- Add comments for documentation
COMMENT ON TABLE admin_audit_log IS 'Audit log for all admin actions on sensitive data';
COMMENT ON COLUMN admin_audit_log.admin_user_id IS 'The admin who performed the action';
COMMENT ON COLUMN admin_audit_log.action IS 'The type of action (INSERT, UPDATE, DELETE)';
COMMENT ON COLUMN admin_audit_log.old_values IS 'JSON representation of the record before the change';
COMMENT ON COLUMN admin_audit_log.new_values IS 'JSON representation of the record after the change';
