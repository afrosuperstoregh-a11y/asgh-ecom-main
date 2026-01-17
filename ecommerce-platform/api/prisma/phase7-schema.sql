-- Phase 7: Advanced Commerce Features - Database Schema Updates
-- This file contains all the additional tables and modifications needed for Phase 7

-- ============================================
-- SUBSCRIPTION FEATURES
-- ============================================

-- Subscription Plans Configuration
CREATE TABLE subscription_plans (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(255) NOT NULL,
    slug VARCHAR(255) UNIQUE NOT NULL,
    description TEXT,
    price DECIMAL(10,2) NOT NULL,
    billing_cycle VARCHAR(20) NOT NULL CHECK (billing_cycle IN ('monthly', 'quarterly', 'annual')),
    trial_days INTEGER DEFAULT 0 CHECK (trial_days >= 0),
    setup_fee DECIMAL(10,2) DEFAULT 0.00 CHECK (setup_fee >= 0),
    is_active BOOLEAN DEFAULT true,
    sort_order INTEGER DEFAULT 0,
    features JSONB DEFAULT '{}', -- Plan features object
    metadata JSONB DEFAULT '{}', -- Additional plan metadata
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW(),
    
    CONSTRAINT subscription_plans_price_positive CHECK (price >= 0)
);

-- Customer Subscriptions
CREATE TABLE customer_subscriptions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    plan_id UUID NOT NULL REFERENCES subscription_plans(id) ON DELETE RESTRICT,
    status VARCHAR(20) NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'active', 'paused', 'cancelled', 'expired', 'past_due')),
    current_period_start TIMESTAMP NOT NULL,
    current_period_end TIMESTAMP NOT NULL,
    trial_start TIMESTAMP,
    trial_end TIMESTAMP,
    cancelled_at TIMESTAMP,
    ends_at TIMESTAMP,
    pause_starts_at TIMESTAMP,
    quantity INTEGER DEFAULT 1 CHECK (quantity > 0),
    stripe_subscription_id VARCHAR(255) UNIQUE,
    stripe_customer_id VARCHAR(255),
    metadata JSONB DEFAULT '{}',
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW(),
    
    CONSTRAINT subscription_period_valid CHECK (current_period_end > current_period_start)
);

-- Subscription Items (products included in subscription)
CREATE TABLE subscription_items (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    subscription_id UUID NOT NULL REFERENCES customer_subscriptions(id) ON DELETE CASCADE,
    product_id UUID NOT NULL REFERENCES products(id) ON DELETE RESTRICT,
    quantity INTEGER NOT NULL DEFAULT 1 CHECK (quantity > 0),
    price DECIMAL(10,2) NOT NULL CHECK (price >= 0),
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW(),
    
    UNIQUE(subscription_id, product_id)
);

-- Subscription Billing History
CREATE TABLE subscription_billing (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    subscription_id UUID NOT NULL REFERENCES customer_subscriptions(id) ON DELETE CASCADE,
    amount DECIMAL(10,2) NOT NULL CHECK (amount >= 0),
    currency VARCHAR(3) DEFAULT 'USD',
    status VARCHAR(20) NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'paid', 'failed', 'refunded', 'void')),
    stripe_invoice_id VARCHAR(255) UNIQUE,
    stripe_charge_id VARCHAR(255),
    billing_period_start TIMESTAMP NOT NULL,
    billing_period_end TIMESTAMP NOT NULL,
    attempt_count INTEGER DEFAULT 0,
    next_attempt_at TIMESTAMP,
    paid_at TIMESTAMP,
    failure_reason TEXT,
    metadata JSONB DEFAULT '{}',
    created_at TIMESTAMP DEFAULT NOW(),
    
    CONSTRAINT billing_period_valid CHECK (billing_period_end > billing_period_start)
);

-- ============================================
-- LOYALTY PROGRAM FEATURES
-- ============================================

-- Loyalty Program Configuration
CREATE TABLE loyalty_program (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(255) NOT NULL DEFAULT 'Default Loyalty Program',
    points_per_dollar DECIMAL(5,2) DEFAULT 1.00 CHECK (points_per_dollar >= 0),
    points_expiration_days INTEGER DEFAULT 365 CHECK (points_expiration_days >= 0),
    minimum_purchase_amount DECIMAL(10,2) DEFAULT 1.00 CHECK (minimum_purchase_amount >= 0),
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

-- Loyalty Tiers
CREATE TABLE loyalty_tiers (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(255) NOT NULL,
    slug VARCHAR(255) UNIQUE NOT NULL,
    min_spending DECIMAL(10,2) NOT NULL CHECK (min_spending >= 0),
    min_points INTEGER NOT NULL CHECK (min_points >= 0),
    points_multiplier DECIMAL(3,2) DEFAULT 1.00 CHECK (points_multiplier >= 0),
    discount_percent DECIMAL(5,2) DEFAULT 0.00 CHECK (discount_percent >= 0 AND discount_percent <= 100),
    free_shipping BOOLEAN DEFAULT false,
    free_shipping_min_order DECIMAL(10,2) DEFAULT 0.00,
    exclusive_access BOOLEAN DEFAULT false,
    birthday_bonus_points INTEGER DEFAULT 0,
    anniversary_bonus_points INTEGER DEFAULT 0,
    benefits JSONB DEFAULT '{}', -- Detailed benefits object
    color VARCHAR(7) DEFAULT '#6B7280', -- Hex color for UI
    icon VARCHAR(50), -- Icon name for UI
    sort_order INTEGER NOT NULL,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

-- Customer Loyalty Status
CREATE TABLE customer_loyalty (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID UNIQUE NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    tier_id UUID NOT NULL REFERENCES loyalty_tiers(id) ON DELETE RESTRICT,
    points_balance INTEGER DEFAULT 0 CHECK (points_balance >= 0),
    lifetime_points INTEGER DEFAULT 0 CHECK (lifetime_points >= 0),
    total_spending DECIMAL(10,2) DEFAULT 0.00 CHECK (total_spending >= 0),
    tier_advancement_at TIMESTAMP,
    last_activity_at TIMESTAMP DEFAULT NOW(),
    birthday DATE,
    anniversary DATE, -- Customer anniversary date
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

-- Points Transactions
CREATE TABLE points_transactions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    points INTEGER NOT NULL, -- Positive for earned, negative for redeemed
    type VARCHAR(50) NOT NULL CHECK (type IN ('purchase', 'redemption', 'referral', 'bonus', 'expiration', 'adjustment', 'signup', 'birthday', 'review')),
    reference_id UUID, -- Reference to order, affiliate, reward, etc.
    reference_type VARCHAR(50), -- Type of reference (order, affiliate, reward, etc.)
    description TEXT,
    expires_at TIMESTAMP,
    metadata JSONB DEFAULT '{}',
    created_at TIMESTAMP DEFAULT NOW(),
    
    CONSTRAINT points_not_zero CHECK (points != 0)
);

-- Loyalty Rewards Catalog
CREATE TABLE loyalty_rewards (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(255) NOT NULL,
    description TEXT,
    type VARCHAR(50) NOT NULL CHECK (type IN ('discount', 'free_product', 'free_shipping', 'exclusive_access', 'voucher')),
    points_cost INTEGER NOT NULL CHECK (points_cost >= 0),
    value DECIMAL(10,2), -- Discount amount or product value
    discount_type VARCHAR(20) CHECK (discount_type IN ('fixed', 'percentage')),
    product_id UUID REFERENCES products(id), -- For free_product rewards
    inventory INTEGER DEFAULT -1 CHECK (inventory >= -1), -- -1 for unlimited
    min_tier_id UUID REFERENCES loyalty_tiers(id), -- Minimum tier required
    is_active BOOLEAN DEFAULT true,
    starts_at TIMESTAMP DEFAULT NOW(),
    ends_at TIMESTAMP,
    image_url VARCHAR(500),
    terms_conditions TEXT,
    metadata JSONB DEFAULT '{}',
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW(),
    
    CONSTRAINT reward_dates_valid CHECK (ends_at IS NULL OR ends_at > starts_at)
);

-- Points Redemptions
CREATE TABLE points_redemptions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    reward_id UUID NOT NULL REFERENCES loyalty_rewards(id) ON DELETE RESTRICT,
    points_used INTEGER NOT NULL CHECK (points_used > 0),
    status VARCHAR(20) DEFAULT 'pending' CHECK (status IN ('pending', 'confirmed', 'used', 'expired', 'cancelled')),
    order_id UUID REFERENCES orders(id), -- If applied to an order
    voucher_code VARCHAR(255) UNIQUE, -- Generated voucher code
    used_at TIMESTAMP,
    expires_at TIMESTAMP NOT NULL,
    metadata JSONB DEFAULT '{}',
    created_at TIMESTAMP DEFAULT NOW(),
    
    CONSTRAINT redemption_expires_future CHECK (expires_at > created_at)
);

-- ============================================
-- AFFILIATE PROGRAM FEATURES
-- ============================================

-- Affiliate Profiles
CREATE TABLE affiliates (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID UNIQUE NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    company_name VARCHAR(255),
    website_url VARCHAR(500),
    bio TEXT,
    status VARCHAR(20) DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected', 'suspended')),
    commission_tier_id UUID REFERENCES affiliate_commission_tiers(id),
    stripe_account_id VARCHAR(255) UNIQUE,
    tax_info JSONB DEFAULT '{}', -- Tax information object
    marketing_methods JSONB DEFAULT '[]', -- Array of marketing methods
    target_audience TEXT,
    approval_notes TEXT,
    rejection_reason TEXT,
    approved_at TIMESTAMP,
    suspended_at TIMESTAMP,
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

-- Affiliate Commission Tiers
CREATE TABLE affiliate_commission_tiers (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(255) NOT NULL,
    slug VARCHAR(255) UNIQUE NOT NULL,
    min_sales DECIMAL(10,2) NOT NULL CHECK (min_sales >= 0),
    min_orders INTEGER DEFAULT 0 CHECK (min_orders >= 0),
    commission_rate DECIMAL(5,2) NOT NULL CHECK (commission_rate >= 0 AND commission_rate <= 100),
    recurring_rate DECIMAL(5,2) DEFAULT 0.00 CHECK (recurring_rate >= 0 AND recurring_rate <= 100),
    bonus_rate DECIMAL(5,2) DEFAULT 0.00 CHECK (bonus_rate >= 0),
    cookie_duration INTEGER DEFAULT 30 CHECK (cookie_duration > 0), -- Days
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

-- Affiliate Links
CREATE TABLE affiliate_links (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    affiliate_id UUID NOT NULL REFERENCES affiliates(id) ON DELETE CASCADE,
    name VARCHAR(255) NOT NULL,
    url VARCHAR(1000) NOT NULL,
    slug VARCHAR(255) UNIQUE NOT NULL,
    product_id UUID REFERENCES products(id),
    category_id UUID REFERENCES categories(id),
    campaign_name VARCHAR(255),
    is_active BOOLEAN DEFAULT true,
    track_conversions BOOLEAN DEFAULT true,
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

-- Affiliate Clicks Tracking
CREATE TABLE affiliate_clicks (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    affiliate_id UUID NOT NULL REFERENCES affiliates(id) ON DELETE CASCADE,
    link_id UUID NOT NULL REFERENCES affiliate_links(id) ON DELETE CASCADE,
    ip_address INET,
    user_agent TEXT,
    referrer VARCHAR(1000),
    landing_page VARCHAR(1000),
    country_code VARCHAR(2),
    device_type VARCHAR(20),
    browser VARCHAR(50),
    converted BOOLEAN DEFAULT false,
    conversion_value DECIMAL(10,2),
    conversion_date TIMESTAMP,
    order_id UUID REFERENCES orders(id),
    created_at TIMESTAMP DEFAULT NOW()
);

-- Affiliate Commissions
CREATE TABLE affiliate_commissions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    affiliate_id UUID NOT NULL REFERENCES affiliates(id) ON DELETE CASCADE,
    order_id UUID REFERENCES orders(id) ON DELETE SET NULL,
    click_id UUID REFERENCES affiliate_clicks(id) ON DELETE SET NULL,
    amount DECIMAL(10,2) NOT NULL CHECK (amount >= 0),
    commission_rate DECIMAL(5,2) NOT NULL CHECK (commission_rate >= 0),
    commission_amount DECIMAL(10,2) NOT NULL CHECK (commission_amount >= 0),
    type VARCHAR(20) DEFAULT 'standard' CHECK (type IN ('standard', 'recurring', 'bonus', 'tier_bonus')),
    status VARCHAR(20) DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'paid', 'reversed', 'void')),
    payout_id UUID REFERENCES affiliate_payouts(id),
    approved_at TIMESTAMP,
    paid_at TIMESTAMP,
    reversed_at TIMESTAMP,
    notes TEXT,
    metadata JSONB DEFAULT '{}',
    created_at TIMESTAMP DEFAULT NOW()
);

-- Affiliate Payouts
CREATE TABLE affiliate_payouts (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    affiliate_id UUID NOT NULL REFERENCES affiliates(id) ON DELETE CASCADE,
    total_amount DECIMAL(10,2) NOT NULL CHECK (total_amount > 0),
    commission_count INTEGER NOT NULL CHECK (commission_count > 0),
    status VARCHAR(20) DEFAULT 'pending' CHECK (status IN ('pending', 'processing', 'paid', 'failed', 'cancelled')),
    stripe_transfer_id VARCHAR(255) UNIQUE,
    payment_method VARCHAR(50) DEFAULT 'stripe',
    processing_fee DECIMAL(10,2) DEFAULT 0.00 CHECK (processing_fee >= 0),
    net_amount DECIMAL(10,2) NOT NULL CHECK (net_amount >= 0),
    currency VARCHAR(3) DEFAULT 'USD',
    paid_at TIMESTAMP,
    failed_at TIMESTAMP,
    failure_reason TEXT,
    notes TEXT,
    created_at TIMESTAMP DEFAULT NOW(),
    
    CONSTRAINT payout_net_amount_valid CHECK (net_amount <= total_amount)
);

-- ============================================
-- INDEXES FOR PERFORMANCE
-- ============================================

-- Subscription Indexes
CREATE INDEX idx_customer_subscriptions_user_id ON customer_subscriptions(user_id);
CREATE INDEX idx_customer_subscriptions_status ON customer_subscriptions(status);
CREATE INDEX idx_customer_subscriptions_stripe_id ON customer_subscriptions(stripe_subscription_id);
CREATE INDEX idx_subscription_billing_subscription_id ON subscription_billing(subscription_id);
CREATE INDEX idx_subscription_billing_status ON subscription_billing(status);

-- Loyalty Program Indexes
CREATE INDEX idx_customer_loyalty_user_id ON customer_loyalty(user_id);
CREATE INDEX idx_customer_loyalty_tier_id ON customer_loyalty(tier_id);
CREATE INDEX idx_points_transactions_user_id ON points_transactions(user_id);
CREATE INDEX idx_points_transactions_type ON points_transactions(type);
CREATE INDEX idx_points_transactions_expires_at ON points_transactions(expires_at);
CREATE INDEX idx_loyalty_rewards_is_active ON loyalty_rewards(is_active);
CREATE INDEX idx_points_redemptions_user_id ON points_redemptions(user_id);
CREATE INDEX idx_points_redemptions_status ON points_redemptions(status);

-- Affiliate Program Indexes
CREATE INDEX idx_affiliates_user_id ON affiliates(user_id);
CREATE INDEX idx_affiliates_status ON affiliates(status);
CREATE INDEX idx_affiliate_links_affiliate_id ON affiliate_links(affiliate_id);
CREATE INDEX idx_affiliate_links_slug ON affiliate_links(slug);
CREATE INDEX idx_affiliate_clicks_affiliate_id ON affiliate_clicks(affiliate_id);
CREATE INDEX idx_affiliate_clicks_link_id ON affiliate_clicks(link_id);
CREATE INDEX idx_affiliate_clicks_converted ON affiliate_clicks(converted);
CREATE INDEX idx_affiliate_clicks_created_at ON affiliate_clicks(created_at);
CREATE INDEX idx_affiliate_commissions_affiliate_id ON affiliate_commissions(affiliate_id);
CREATE INDEX idx_affiliate_commissions_status ON affiliate_commissions(status);
CREATE INDEX idx_affiliate_payouts_affiliate_id ON affiliate_payouts(affiliate_id);
CREATE INDEX idx_affiliate_payouts_status ON affiliate_payouts(status);

-- ============================================
-- TRIGGERS AND CONSTRAINTS
-- ============================================

-- Update customer loyalty points balance
CREATE OR REPLACE FUNCTION update_loyalty_points_balance()
RETURNS TRIGGER AS $$
BEGIN
    IF TG_OP = 'INSERT' THEN
        UPDATE customer_loyalty 
        SET 
            points_balance = points_balance + NEW.points,
            lifetime_points = lifetime_points + CASE WHEN NEW.points > 0 THEN NEW.points ELSE 0 END,
            updated_at = NOW()
        WHERE user_id = NEW.user_id;
        RETURN NEW;
    ELSIF TG_OP = 'UPDATE' THEN
        UPDATE customer_loyalty 
        SET 
            points_balance = points_balance + (NEW.points - OLD.points),
            lifetime_points = lifetime_points + CASE WHEN NEW.points > 0 AND OLD.points <= 0 THEN NEW.points 
                                                   WHEN NEW.points <= 0 AND OLD.points > 0 THEN -OLD.points 
                                                   ELSE 0 END,
            updated_at = NOW()
        WHERE user_id = NEW.user_id;
        RETURN NEW;
    ELSIF TG_OP = 'DELETE' THEN
        UPDATE customer_loyalty 
        SET 
            points_balance = points_balance - OLD.points,
            lifetime_points = lifetime_points - CASE WHEN OLD.points > 0 THEN OLD.points ELSE 0 END,
            updated_at = NOW()
        WHERE user_id = OLD.user_id;
        RETURN OLD;
    END IF;
    RETURN NULL;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_update_loyalty_points_balance
    AFTER INSERT OR UPDATE OR DELETE ON points_transactions
    FOR EACH ROW EXECUTE FUNCTION update_loyalty_points_balance();

-- Update subscription timestamps
CREATE OR REPLACE FUNCTION update_subscription_timestamp()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_update_subscription_timestamp
    BEFORE UPDATE ON customer_subscriptions
    FOR EACH ROW EXECUTE FUNCTION update_subscription_timestamp();

-- ============================================
-- INITIAL DATA SEEDING
-- ============================================

-- Insert default loyalty program
INSERT INTO loyalty_program (name, points_per_dollar, points_expiration_days) 
VALUES ('Default Loyalty Program', 1.0, 365);

-- Insert default loyalty tiers
INSERT INTO loyalty_tiers (name, slug, min_spending, min_points, points_multiplier, discount_percent, free_shipping, color, icon, sort_order) VALUES
('Bronze', 'bronze', 0, 0, 1.0, 0.00, false, '#CD7F32', 'medal', 1),
('Silver', 'silver', 500, 500, 1.25, 5.00, false, '#C0C0C0', 'award', 2),
('Gold', 'gold', 1500, 1500, 1.5, 10.00, true, '#FFD700', 'trophy', 3),
('Platinum', 'platinum', 5000, 5000, 2.0, 15.00, true, '#E5E4E2', 'crown', 4);

-- Insert default affiliate commission tiers
INSERT INTO affiliate_commission_tiers (name, slug, min_sales, min_orders, commission_rate, recurring_rate, cookie_duration) VALUES
('Starter', 'starter', 0, 0, 5.00, 2.50, 30),
('Pro', 'pro', 1000, 50, 10.00, 5.00, 45),
('Elite', 'elite', 5000, 200, 15.00, 7.50, 60);

-- Insert sample subscription plans
INSERT INTO subscription_plans (name, slug, description, price, billing_cycle, trial_days, features, sort_order) VALUES
('Basic', 'basic', 'Perfect for getting started with our premium features', 9.99, 'monthly', 14, '{"free_shipping": true, "early_access": false, "exclusive_content": false}', 1),
('Premium', 'premium', 'Our most popular plan with all essential features', 19.99, 'monthly', 14, '{"free_shipping": true, "early_access": true, "exclusive_content": true, "priority_support": true}', 2),
('Business', 'business', 'Complete solution for power users and businesses', 49.99, 'monthly', 30, '{"free_shipping": true, "early_access": true, "exclusive_content": true, "priority_support": true, "api_access": true, "custom_branding": true}', 3);

-- ============================================
-- VIEWS FOR REPORTING
-- ============================================

-- Subscription Analytics View
CREATE VIEW subscription_analytics AS
SELECT 
    DATE_TRUNC('month', cs.created_at) as month,
    COUNT(*) as new_subscriptions,
    SUM(cs.price) as mrr,
    COUNT(CASE WHEN cs.status = 'active' THEN 1 END) as active_subscriptions,
    COUNT(CASE WHEN cs.status = 'cancelled' THEN 1 END) as cancelled_subscriptions,
    AVG(cs.price) as avg_subscription_value
FROM customer_subscriptions cs
GROUP BY DATE_TRUNC('month', cs.created_at)
ORDER BY month DESC;

-- Loyalty Program Analytics View
CREATE VIEW loyalty_analytics AS
SELECT 
    DATE_TRUNC('month', cl.created_at) as month,
    COUNT(*) as new_members,
    SUM(cl.points_balance) as total_points_balance,
    SUM(cl.lifetime_points) as total_lifetime_points,
    AVG(cl.total_spending) as avg_customer_spending,
    COUNT(CASE WHEN lt.name = 'Gold' THEN 1 END) as gold_members,
    COUNT(CASE WHEN lt.name = 'Platinum' THEN 1 END) as platinum_members
FROM customer_loyalty cl
JOIN loyalty_tiers lt ON cl.tier_id = lt.id
GROUP BY DATE_TRUNC('month', cl.created_at)
ORDER BY month DESC;

-- Affiliate Performance View
CREATE VIEW affiliate_performance AS
SELECT 
    a.id,
    u.email,
    a.company_name,
    a.status,
    COUNT(ac.id) as total_commissions,
    COALESCE(SUM(ac.commission_amount), 0) as total_earnings,
    COUNT(DISTINCT ac.order_id) as referred_orders,
    COALESCE(SUM(o.total), 0) as referred_revenue,
    COUNT(DISTINCT DATE(ac.created_at)) as active_days
FROM affiliates a
JOIN users u ON a.user_id = u.id
LEFT JOIN affiliate_commissions ac ON a.id = ac.affiliate_id AND ac.status IN ('approved', 'paid')
LEFT JOIN orders o ON ac.order_id = o.id
GROUP BY a.id, u.email, a.company_name, a.status
ORDER BY total_earnings DESC;
