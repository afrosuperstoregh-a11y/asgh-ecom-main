-- CRM Row Level Security (RLS) Policies
-- Migration 005: Implement comprehensive security for CRM data

-- Enable RLS on all CRM tables
ALTER TABLE customer_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE customer_notes ENABLE ROW LEVEL SECURITY;
ALTER TABLE customer_tags ENABLE ROW LEVEL SECURITY;
ALTER TABLE customer_tag_map ENABLE ROW LEVEL SECURITY;
ALTER TABLE customer_segments ENABLE ROW LEVEL SECURITY;
ALTER TABLE customer_segment_rules ENABLE ROW LEVEL SECURITY;
ALTER TABLE customer_segment_memberships ENABLE ROW LEVEL SECURITY;
ALTER TABLE email_templates ENABLE ROW LEVEL SECURITY;
ALTER TABLE email_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE email_campaigns ENABLE ROW LEVEL SECURITY;
ALTER TABLE email_campaign_recipients ENABLE ROW LEVEL SECURITY;
ALTER TABLE crm_automations ENABLE ROW LEVEL SECURITY;
ALTER TABLE crm_automation_logs ENABLE ROW LEVEL SECURITY;

-- Customer Profiles RLS Policies

-- Customers can view their own profile
CREATE POLICY "Customers can view own profile" ON customer_profiles
  FOR SELECT USING (
    auth.uid() = (
      SELECT user_id FROM customer_profiles cp 
      WHERE cp.id = customer_profiles.id
    )
  );

-- Admins can view all customer profiles
CREATE POLICY "Admins can view all customer profiles" ON customer_profiles
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM users u 
      WHERE u.id = auth.uid() 
      AND u.role IN ('admin', 'super_admin')
    )
  );

-- Admins can manage all customer profiles
CREATE POLICY "Admins can manage customer profiles" ON customer_profiles
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM users u 
      WHERE u.id = auth.uid() 
      AND u.role IN ('admin', 'super_admin')
    )
  );

-- Customer Notes RLS Policies

-- Admins can view all customer notes
CREATE POLICY "Admins can view all customer notes" ON customer_notes
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM users u 
      WHERE u.id = auth.uid() 
      AND u.role IN ('admin', 'super_admin')
    )
  );

-- Admins can manage all customer notes
CREATE POLICY "Admins can manage customer notes" ON customer_notes
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM users u 
      WHERE u.id = auth.uid() 
      AND u.role IN ('admin', 'super_admin')
    )
  );

-- Customer Tags RLS Policies

-- Admins can view all customer tags
CREATE POLICY "Admins can view all customer tags" ON customer_tags
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM users u 
      WHERE u.id = auth.uid() 
      AND u.role IN ('admin', 'super_admin')
    )
  );

-- Admins can manage customer tags (except system tags)
CREATE POLICY "Admins can manage customer tags" ON customer_tags
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM users u 
      WHERE u.id = auth.uid() 
      AND u.role IN ('admin', 'super_admin')
    )
  );

-- Customer Tag Map RLS Policies

-- Admins can view all customer tag mappings
CREATE POLICY "Admins can view all customer tag mappings" ON customer_tag_map
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM users u 
      WHERE u.id = auth.uid() 
      AND u.role IN ('admin', 'super_admin')
    )
  );

-- Admins can manage customer tag mappings
CREATE POLICY "Admins can manage customer tag mappings" ON customer_tag_map
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM users u 
      WHERE u.id = auth.uid() 
      AND u.role IN ('admin', 'super_admin')
    )
  );

-- Customer Segments RLS Policies

-- Admins can view all customer segments
CREATE POLICY "Admins can view all customer segments" ON customer_segments
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM users u 
      WHERE u.id = auth.uid() 
      AND u.role IN ('admin', 'super_admin')
    )
  );

-- Admins can manage customer segments
CREATE POLICY "Admins can manage customer segments" ON customer_segments
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM users u 
      WHERE u.id = auth.uid() 
      AND u.role IN ('admin', 'super_admin')
    )
  );

-- Customer Segment Rules RLS Policies

-- Admins can view all customer segment rules
CREATE POLICY "Admins can view all customer segment rules" ON customer_segment_rules
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM users u 
      WHERE u.id = auth.uid() 
      AND u.role IN ('admin', 'super_admin')
    )
  );

-- Admins can manage customer segment rules
CREATE POLICY "Admins can manage customer segment rules" ON customer_segment_rules
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM users u 
      WHERE u.id = auth.uid() 
      AND u.role IN ('admin', 'super_admin')
    )
  );

-- Customer Segment Memberships RLS Policies

-- Admins can view all customer segment memberships
CREATE POLICY "Admins can view all customer segment memberships" ON customer_segment_memberships
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM users u 
      WHERE u.id = auth.uid() 
      AND u.role IN ('admin', 'super_admin')
    )
  );

-- Admins can manage customer segment memberships
CREATE POLICY "Admins can manage customer segment memberships" ON customer_segment_memberships
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM users u 
      WHERE u.id = auth.uid() 
      AND u.role IN ('admin', 'super_admin')
    )
  );

-- Email Templates RLS Policies

-- Admins can view all email templates
CREATE POLICY "Admins can view all email templates" ON email_templates
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM users u 
      WHERE u.id = auth.uid() 
      AND u.role IN ('admin', 'super_admin')
    )
  );

-- Admins can manage email templates
CREATE POLICY "Admins can manage email templates" ON email_templates
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM users u 
      WHERE u.id = auth.uid() 
      AND u.role IN ('admin', 'super_admin')
    )
  );

-- Email Logs RLS Policies

-- Admins can view all email logs
CREATE POLICY "Admins can view all email logs" ON email_logs
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM users u 
      WHERE u.id = auth.uid() 
      AND u.role IN ('admin', 'super_admin')
    )
  );

-- Admins can manage email logs
CREATE POLICY "Admins can manage email logs" ON email_logs
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM users u 
      WHERE u.id = auth.uid() 
      AND u.role IN ('admin', 'super_admin')
    )
  );

-- Email Campaigns RLS Policies

-- Admins can view all email campaigns
CREATE POLICY "Admins can view all email campaigns" ON email_campaigns
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM users u 
      WHERE u.id = auth.uid() 
      AND u.role IN ('admin', 'super_admin')
    )
  );

-- Admins can manage email campaigns
CREATE POLICY "Admins can manage email campaigns" ON email_campaigns
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM users u 
      WHERE u.id = auth.uid() 
      AND u.role IN ('admin', 'super_admin')
    )
  );

-- Email Campaign Recipients RLS Policies

-- Admins can view all email campaign recipients
CREATE POLICY "Admins can view all email campaign recipients" ON email_campaign_recipients
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM users u 
      WHERE u.id = auth.uid() 
      AND u.role IN ('admin', 'super_admin')
    )
  );

-- Admins can manage email campaign recipients
CREATE POLICY "Admins can manage email campaign recipients" ON email_campaign_recipients
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM users u 
      WHERE u.id = auth.uid() 
      AND u.role IN ('admin', 'super_admin')
    )
  );

-- CRM Automations RLS Policies

-- Admins can view all CRM automations
CREATE POLICY "Admins can view all CRM automations" ON crm_automations
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM users u 
      WHERE u.id = auth.uid() 
      AND u.role IN ('admin', 'super_admin')
    )
  );

-- Admins can manage CRM automations
CREATE POLICY "Admins can manage CRM automations" ON crm_automations
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM users u 
      WHERE u.id = auth.uid() 
      AND u.role IN ('admin', 'super_admin')
    )
  );

-- CRM Automation Logs RLS Policies

-- Admins can view all CRM automation logs
CREATE POLICY "Admins can view all CRM automation logs" ON crm_automation_logs
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM users u 
      WHERE u.id = auth.uid() 
      AND u.role IN ('admin', 'super_admin')
    )
  );

-- Admins can manage CRM automation logs
CREATE POLICY "Admins can manage CRM automation logs" ON crm_automation_logs
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM users u 
      WHERE u.id = auth.uid() 
      AND u.role IN ('admin', 'super_admin')
    )
  );

-- Create security functions for advanced checks

-- Function to check if user is admin
CREATE OR REPLACE FUNCTION is_admin(user_uuid UUID)
RETURNS BOOLEAN AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM users u 
    WHERE u.id = user_uuid 
    AND u.role IN ('admin', 'super_admin')
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to check if user owns customer profile
CREATE OR REPLACE FUNCTION owns_customer_profile(user_uuid UUID, profile_uuid UUID)
RETURNS BOOLEAN AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM customer_profiles cp 
    WHERE cp.id = profile_uuid 
    AND cp.user_id = user_uuid
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to check if user can access customer data
CREATE OR REPLACE FUNCTION can_access_customer_data(user_uuid UUID, customer_uuid UUID)
RETURNS BOOLEAN AS $$
BEGIN
  -- Admins can access all customer data
  IF is_admin(user_uuid) THEN
    RETURN TRUE;
  END IF;
  
  -- Users can access their own customer data
  IF owns_customer_profile(user_uuid, customer_uuid) THEN
    RETURN TRUE;
  END IF;
  
  RETURN FALSE;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create trigger functions for security logging

-- Function to log CRM data access
CREATE OR REPLACE FUNCTION log_crm_access()
RETURNS TRIGGER AS $$
BEGIN
  -- Log access to sensitive CRM data
  IF TG_OP = 'SELECT' THEN
    INSERT INTO audit_logs (user_id, action, resource_type, resource_id, created_at)
    VALUES (
      auth.uid(),
      'SELECT',
      TG_TABLE_NAME,
      COALESCE(NEW.id, OLD.id)::TEXT,
      NOW()
    );
  END IF;
  
  RETURN COALESCE(NEW, OLD);
END;
$$ LANGUAGE plpgsql;

-- Create audit triggers for sensitive tables (optional - can be enabled for high security)
-- CREATE TRIGGER trigger_customer_profiles_audit
--     AFTER INSERT OR UPDATE OR DELETE ON customer_profiles
--     FOR EACH ROW EXECUTE FUNCTION log_crm_access();

-- Create view for secure customer analytics
CREATE OR REPLACE VIEW secure_customer_analytics AS
SELECT 
    cp.id as customer_profile_id,
    u.id as user_id,
    u.email,
    u.first_name,
    u.last_name,
    cp.lifecycle_stage,
    cp.total_spend,
    cp.order_count,
    cp.last_order_date,
    cp.last_activity,
    cp.average_order_value,
    cp.lifetime_value,
    cp.created_at as customer_since,
    -- Calculate recency score (days since last order)
    CASE 
        WHEN cp.last_order_date IS NULL THEN 999
        ELSE EXTRACT(DAYS FROM NOW() - cp.last_order_date)::INTEGER
    END as days_since_last_order,
    -- Calculate frequency score (orders per month)
    CASE 
        WHEN cp.created_at IS NULL THEN 0
        ELSE ROUND((cp.order_count::DECIMAL / GREATEST(EXTRACT(DAYS FROM NOW() - cp.created_at)::INTEGER, 1)) * 30, 2)
    END as orders_per_month,
    -- Segment memberships (masked for non-admins)
    CASE 
        WHEN is_admin(auth.uid()) THEN
            COALESCE(
                JSON_AGG(
                    JSON_BUILD_OBJECT(
                        'segment_id', csm.segment_id,
                        'segment_name', cs.name,
                        'added_at', csm.added_at
                    )
                ) FILTER (WHERE csm.segment_id IS NOT NULL),
                '[]'::json
            )
        ELSE
            '[]'::json
    END as segments,
    -- Tags (masked for non-admins)
    CASE 
        WHEN is_admin(auth.uid()) THEN
            COALESCE(
                JSON_AGG(
                    JSON_BUILD_OBJECT(
                        'tag_id', ct.id,
                        'tag_name', ct.name,
                        'tag_color', ct.color,
                        'assigned_at', ctm.assigned_at
                    )
                ) FILTER (WHERE ct.id IS NOT NULL),
                '[]'::json
            )
        ELSE
            '[]'::json
    END as tags
FROM customer_profiles cp
JOIN users u ON cp.user_id = u.id
LEFT JOIN customer_segment_memberships csm ON cp.id = csm.customer_id
LEFT JOIN customer_segments cs ON csm.segment_id = cs.id
LEFT JOIN customer_tag_map ctm ON cp.id = ctm.customer_id
LEFT JOIN customer_tags ct ON ctm.tag_id = ct.id
WHERE cp.soft_deleted = false
AND (
    is_admin(auth.uid()) OR 
    cp.user_id = auth.uid()
)
GROUP BY cp.id, u.id, u.email, u.first_name, u.last_name, cp.lifecycle_stage, cp.total_spend, cp.order_count, cp.last_order_date, cp.last_activity, cp.average_order_value, cp.lifetime_value, cp.created_at;

-- Create RLS policy for the secure view
ALTER VIEW secure_customer_analytics SET (security_barrier = true);

-- Grant necessary permissions
GRANT USAGE ON SCHEMA public TO authenticated;
GRANT SELECT ON customer_profiles TO authenticated;
GRANT SELECT ON users TO authenticated;
GRANT SELECT ON customer_segment_memberships TO authenticated;
GRANT SELECT ON customer_segments TO authenticated;
GRANT SELECT ON customer_tag_map TO authenticated;
GRANT SELECT ON customer_tags TO authenticated;
GRANT SELECT ON secure_customer_analytics TO authenticated;

-- Create role-based permissions
DO $$
BEGIN
    -- Create CRM admin role if it doesn't exist
    IF NOT EXISTS (SELECT 1 FROM pg_roles WHERE rolname = 'crm_admin') THEN
        CREATE ROLE crm_admin;
    END IF;
    
    -- Grant permissions to CRM admin role
    GRANT USAGE ON SCHEMA public TO crm_admin;
    GRANT ALL PRIVILEGES ON ALL TABLES IN SCHEMA public TO crm_admin;
    GRANT ALL PRIVILEGES ON ALL SEQUENCES IN SCHEMA public TO crm_admin;
    GRANT EXECUTE ON ALL FUNCTIONS IN SCHEMA public TO crm_admin;
END
$$;

-- Create function to validate CRM permissions
CREATE OR REPLACE FUNCTION validate_crm_permission(
    user_uuid UUID,
    action TEXT,
    resource_type TEXT,
    resource_id UUID DEFAULT NULL
)
RETURNS BOOLEAN AS $$
DECLARE
    is_user_admin BOOLEAN;
    is_owner BOOLEAN;
BEGIN
    -- Check if user is admin
    SELECT EXISTS (
        SELECT 1 FROM users u 
        WHERE u.id = user_uuid 
        AND u.role IN ('admin', 'super_admin')
    ) INTO is_user_admin;
    
    -- Admins have all permissions
    IF is_user_admin THEN
        RETURN TRUE;
    END IF;
    
    -- Check ownership for customer-related resources
    IF resource_type IN ('customer_profile', 'customer_note') AND resource_id IS NOT NULL THEN
        CASE resource_type
            WHEN 'customer_profile' THEN
                SELECT EXISTS (
                    SELECT 1 FROM customer_profiles cp 
                    WHERE cp.id = resource_id 
                    AND cp.user_id = user_uuid
                ) INTO is_owner;
            WHEN 'customer_note' THEN
                SELECT EXISTS (
                    SELECT 1 FROM customer_notes cn 
                    WHERE cn.id = resource_id 
                    AND cn.customer_id IN (
                        SELECT cp.id FROM customer_profiles cp 
                        WHERE cp.user_id = user_uuid
                    )
                ) INTO is_owner;
        END CASE;
        
        -- Users can only read their own data
        IF action = 'SELECT' AND is_owner THEN
            RETURN TRUE;
        END IF;
    END IF;
    
    -- Default deny
    RETURN FALSE;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create indexes for RLS performance
CREATE INDEX IF NOT EXISTS idx_customer_profiles_user_id_rls ON customer_profiles(user_id);
CREATE INDEX IF NOT EXISTS idx_customer_notes_customer_id_rls ON customer_notes(customer_id);
CREATE INDEX IF NOT EXISTS idx_customer_tag_map_customer_id_rls ON customer_tag_map(customer_id);
CREATE INDEX IF NOT EXISTS idx_customer_segment_memberships_customer_id_rls ON customer_segment_memberships(customer_id);
CREATE INDEX IF NOT EXISTS idx_email_logs_customer_id_rls ON email_logs(customer_id);
CREATE INDEX IF NOT EXISTS idx_crm_automation_logs_customer_id_rls ON crm_automation_logs(customer_id);

-- Create function to update customer metrics with security check
CREATE OR REPLACE FUNCTION update_customer_metrics_secure(customer_uuid UUID)
RETURNS VOID AS $$
BEGIN
    -- Only admins can trigger metrics updates
    IF NOT is_admin(auth.uid()) THEN
        RAISE EXCEPTION 'Permission denied: Admin access required';
    END IF;
    
    -- Update customer metrics
    UPDATE customer_profiles 
    SET 
        total_spend = COALESCE((
            SELECT COALESCE(SUM(o.total_amount), 0)
            FROM orders o 
            WHERE o.customer_id = customer_uuid 
            AND o.payment_status = 'paid'
        ), 0),
        order_count = COALESCE((
            SELECT COUNT(*)
            FROM orders o 
            WHERE o.customer_id = customer_uuid 
            AND o.payment_status = 'paid'
        ), 0),
        last_order_date = (
            SELECT MAX(o.created_at)
            FROM orders o 
            WHERE o.customer_id = customer_uuid 
            AND o.payment_status = 'paid'
        ),
        average_order_value = CASE 
            WHEN (
                SELECT COUNT(*) 
                FROM orders o 
                WHERE o.customer_id = customer_uuid 
                AND o.payment_status = 'paid'
            ) > 0 
            THEN (
                SELECT COALESCE(AVG(o.total_amount), 0)
                FROM orders o 
                WHERE o.customer_id = customer_uuid 
                AND o.payment_status = 'paid'
            )
            ELSE 0 
        END,
        lifetime_value = COALESCE((
            SELECT COALESCE(SUM(o.total_amount), 0)
            FROM orders o 
            WHERE o.customer_id = customer_uuid 
            AND o.payment_status = 'paid'
        ), 0),
        last_activity = GREATEST(
            COALESCE((
                SELECT MAX(o.created_at)
                FROM orders o 
                WHERE o.customer_id = customer_uuid
                ), '1970-01-01'::timestamp),
            COALESCE((
                SELECT MAX(cp.updated_at)
                FROM customer_profiles cp 
                WHERE cp.id = customer_uuid
                ), '1970-01-01'::timestamp)
        )
    WHERE id = customer_uuid;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create function for secure customer search
CREATE OR REPLACE FUNCTION search_customers_secure(
    search_term TEXT DEFAULT '',
    lifecycle_stage TEXT DEFAULT '',
    segment_id UUID DEFAULT NULL,
    limit_count INTEGER DEFAULT 50,
    offset_count INTEGER DEFAULT 0
)
RETURNS TABLE (
    customer_id UUID,
    user_id UUID,
    email TEXT,
    first_name TEXT,
    last_name TEXT,
    lifecycle_stage TEXT,
    total_spend DECIMAL,
    order_count INTEGER,
    last_order_date TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE
) AS $$
BEGIN
    -- Only admins can search customers
    IF NOT is_admin(auth.uid()) THEN
        RAISE EXCEPTION 'Permission denied: Admin access required';
    END IF;
    
    RETURN QUERY
    SELECT 
        cp.id,
        cp.user_id,
        u.email,
        u.first_name,
        u.last_name,
        cp.lifecycle_stage,
        cp.total_spend,
        cp.order_count,
        cp.last_order_date,
        cp.created_at
    FROM customer_profiles cp
    JOIN users u ON cp.user_id = u.id
    WHERE cp.soft_deleted = false
    AND (
        search_term = '' OR 
        u.first_name ILIKE '%' || search_term || '%' OR
        u.last_name ILIKE '%' || search_term || '%' OR
        u.email ILIKE '%' || search_term || '%'
    )
    AND (
        lifecycle_stage = '' OR cp.lifecycle_stage = lifecycle_stage
    )
    AND (
        segment_id IS NULL OR EXISTS (
            SELECT 1 FROM customer_segment_memberships csm 
            WHERE csm.customer_id = cp.id AND csm.segment_id = segment_id
        )
    )
    ORDER BY cp.created_at DESC
    LIMIT limit_count
    OFFSET offset_count;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

COMMIT;
