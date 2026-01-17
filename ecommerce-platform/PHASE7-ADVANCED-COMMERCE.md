# Phase 7 – Advanced Commerce Features Implementation

## Overview
Phase 7 introduces sophisticated commerce capabilities including subscription products, loyalty programs, rewards systems, and affiliate programs. This phase transforms the platform into a comprehensive commerce ecosystem with recurring revenue models and customer retention mechanisms.

## Objectives
- Implement subscription-based products and billing cycles
- Create comprehensive loyalty and rewards program
- Build affiliate marketing system with commission tracking
- Enable recurring revenue management
- Provide advanced customer engagement tools
- Ensure seamless integration with existing payment and notification systems

## 1. Features Breakdown

### 1.1 Subscription Products Features

#### Core Subscription Management
- **Subscription Plans Creation**: Multiple tiers, billing cycles (monthly, quarterly, annual)
- **Product Subscription Configuration**: Convert regular products to subscription offerings
- **Subscription Tiers**: Basic, Standard, Premium with different benefits
- **Billing Cycle Management**: Flexible billing periods and proration calculations
- **Subscription Modifications**: Upgrade, downgrade, pause, and cancel subscriptions
- **Trial Periods**: Free or discounted trial periods for new subscribers
- **Dunning Management**: Automated failed payment recovery processes

#### Subscription Benefits & Features
- **Exclusive Content Access**: Premium content for subscribers
- **Member-Only Products**: Products available only to subscribers
- **Early Access Benefits**: Early access to new products and sales
- **Free Shipping**: Free shipping for subscribers (configurable tiers)
- **Discount Levels**: Tier-based discount percentages on products
- **Reward Points Multiplier**: Enhanced points earning for subscribers

#### Subscription Analytics
- **MRR/ARR Tracking**: Monthly/Annual Recurring Revenue metrics
- **Churn Analysis**: Subscription cancellation analytics
- **Lifetime Value**: Customer lifetime value calculations
- **Subscription Health**: Overall subscription program performance metrics

### 1.2 Loyalty Program Features

#### Points System
- **Points Earning**: Purchase-based points, referral points, activity points
- **Points Redemption**: Redeem points for discounts, free products, exclusive items
- **Point Expiration**: Configurable point expiration policies
- **Point Tiers**: Different earning rates based on customer tier
- **Bonus Points Events**: Double points, special promotions, birthday bonuses

#### Customer Tiers
- **Tier Levels**: Bronze, Silver, Gold, Platinum with progressive benefits
- **Tier Advancement**: Automatic tier upgrades based on spending/activity
- **Tier Benefits**: Increasing benefits with higher tiers (discounts, free shipping, exclusive access)
- **Tier Maintenance**: Minimum activity requirements to maintain tier status
- **Tier Anniversary Benefits**: Special rewards on tier anniversary dates

#### Loyalty Rewards
- **Welcome Rewards**: Initial points for program enrollment
- **Milestone Rewards**: Rewards for reaching spending milestones
- **Birthday Rewards**: Special birthday bonuses and offers
- **Referral Rewards**: Points for successful customer referrals
- **Activity Rewards**: Points for reviews, social sharing, profile completion

### 1.3 Affiliate Program Features

#### Affiliate Management
- **Affiliate Registration**: Application and approval process for affiliates
- **Affiliate Tiers**: Different commission rates based on performance tiers
- **Custom Affiliate Links**: Unique tracking links and coupon codes
- **Affiliate Dashboard**: Real-time performance metrics and earnings
- **Marketing Materials**: Pre-approved banners, links, and promotional content

#### Commission System
- **Commission Tiers**: Percentage-based commissions by product category
- **Recurring Commissions**: Ongoing commissions for subscription referrals
- **Performance Bonuses**: Additional bonuses for reaching sales targets
- **Multi-level Commissions**: Optional 2-tier affiliate system
- **Commission Payouts**: Automated payout processing via Stripe Connect

#### Tracking & Analytics
- **Click Tracking**: Comprehensive click and conversion tracking
- **Conversion Attribution**: First-click, last-click, and linear attribution models
- **Cookie Duration**: Configurable tracking cookie duration
- **Fraud Detection**: Automated detection of fraudulent affiliate activities
- **Performance Reports**: Detailed affiliate performance analytics

## 2. User Stories & Acceptance Criteria

### 2.1 Subscription Products

#### User Story 1: Plan Creation
**As a** store administrator  
**I want to** create multiple subscription plans with different pricing tiers  
**So that** I can offer flexible subscription options to customers

**Acceptance Criteria:**
- Create subscription plans with name, description, price, and billing cycle
- Configure trial periods and promotional pricing
- Set up plan benefits and included features
- Define upgrade/downgrade paths between plans
- Preview subscription checkout flow
- Test subscription creation and billing

#### User Story 2: Customer Subscription
**As a** customer  
**I want to** subscribe to a product plan with automatic billing  
**So that** I can receive products regularly without manual reordering

**Acceptance Criteria:**
- Browse available subscription plans
- Select billing cycle (monthly/quarterly/annual)
- Start free trial if available
- Manage subscription (upgrade, downgrade, pause, cancel)
- View subscription history and upcoming charges
- Update payment methods for subscriptions

#### User Story 3: Subscription Management
**As a** customer  
**I want to** manage my active subscriptions  
**So that** I can control my recurring purchases and billing

**Acceptance Criteria:**
- View all active subscriptions in dashboard
- Modify subscription quantity or frequency
- Pause subscription for specified period
- Cancel subscription with effective date
- Update shipping address for subscriptions
- View upcoming renewal dates and amounts

### 2.2 Loyalty Program

#### User Story 4: Points Earning
**As a** customer  
**I want to** earn points on purchases and activities  
**So that** I can get rewards for my loyalty

**Acceptance Criteria:**
- Earn points on every purchase based on amount spent
- Receive bonus points for specific activities (reviews, referrals)
- See points breakdown in order confirmation
- Track points balance in customer dashboard
- Receive notifications for points earned
- View points expiration dates

#### User Story 5: Tier Advancement
**As a** customer  
**I want to** advance through loyalty tiers  
**So that** I can unlock better benefits and rewards

**Acceptance Criteria:**
- View current tier and progress to next tier
- See benefits of current and next tiers
- Receive automatic tier upgrades
- Get notified of tier advancements
- Access tier-exclusive benefits and offers
- Maintain tier status with minimum activity

#### User Story 6: Points Redemption
**As a** customer  
**I want to** redeem points for discounts and rewards  
**So that** I can get value from my loyalty participation

**Acceptance Criteria:**
- Browse available redemption options
- Apply points discount at checkout
- Redeem points for free products
- Use points for exclusive experiences
- See points value in real-time
- Receive confirmation of points redemption

### 2.3 Affiliate Program

#### User Story 7: Affiliate Registration
**As a** potential affiliate  
**I want to** register for the affiliate program  
**So that** I can earn commissions by promoting products

**Acceptance Criteria:**
- Complete affiliate application form
- Submit required documentation and tax information
- Receive approval notification
- Access affiliate dashboard
- Generate unique affiliate links
- Access marketing materials and resources

#### User Story 8: Commission Tracking
**As an** affiliate  
**I want to** track my clicks, conversions, and earnings  
**So that** I can optimize my promotional efforts

**Acceptance Criteria:**
- View real-time click statistics
- Track conversion rates and sales
- Monitor commission earnings
- See pending and paid commissions
- Access performance analytics
- Export commission reports

#### User Story 9: Payout Management
**As an** affiliate  
**I want to** receive my commission payments reliably  
**So that** I can trust the affiliate program

**Acceptance Criteria:**
- Set up payment method for commissions
- View payout schedule and history
- Receive notifications for payments
- Track payment status
- Access tax documents
- Manage payout preferences

## 3. API Endpoints / Services

### 3.1 Subscription API Endpoints

#### Subscription Plans Management
```
GET    /api/subscriptions/plans              - List all subscription plans
POST   /api/subscriptions/plans              - Create new subscription plan
GET    /api/subscriptions/plans/:id          - Get subscription plan details
PUT    /api/subscriptions/plans/:id          - Update subscription plan
DELETE /api/subscriptions/plans/:id          - Delete subscription plan
```

#### Customer Subscriptions
```
GET    /api/subscriptions                    - Get user's subscriptions
POST   /api/subscriptions                    - Create new subscription
GET    /api/subscriptions/:id                - Get subscription details
PUT    /api/subscriptions/:id                - Update subscription
DELETE /api/subscriptions/:id                - Cancel subscription
POST   /api/subscriptions/:id/pause           - Pause subscription
POST   /api/subscriptions/:id/resume          - Resume subscription
PUT    /api/subscriptions/:id/upgrade        - Upgrade subscription
PUT    /api/subscriptions/:id/downgrade      - Downgrade subscription
```

#### Subscription Billing
```
GET    /api/subscriptions/:id/billing        - Get billing history
POST   /api/subscriptions/:id/payment-method  - Update payment method
GET    /api/subscriptions/:id/upcoming        - Get upcoming charges
POST   /api/subscriptions/webhook             - Stripe webhook handler
```

### 3.2 Loyalty Program API Endpoints

#### Points Management
```
GET    /api/loyalty/points                   - Get user's points balance
GET    /api/loyalty/points/history           - Get points transaction history
POST   /api/loyalty/points/redeem             - Redeem points for rewards
GET    /api/loyalty/rewards                  - List available rewards
```

#### Tier Management
```
GET    /api/loyalty/tier                     - Get user's current tier
GET    /api/loyalty/tiers                    - List all tier levels
GET    /api/loyalty/tier/progress            - Get progress to next tier
GET    /api/loyalty/benefits                 - Get current tier benefits
```

#### Loyalty Activities
```
POST   /api/loyalty/activities/purchase      - Record purchase activity
POST   /api/loyalty/activities/review         - Record review activity
POST   /api/loyalty/activities/referral      - Record referral activity
POST   /api/loyalty/activities/birthday      - Record birthday bonus
```

### 3.3 Affiliate Program API Endpoints

#### Affiliate Management
```
POST   /api/affiliates/register              - Register as affiliate
GET    /api/affiliates/profile               - Get affiliate profile
PUT    /api/affiliates/profile               - Update affiliate profile
GET    /api/affiliates/dashboard             - Get affiliate dashboard data
```

#### Links & Tracking
```
POST   /api/affiliates/links                 - Generate affiliate link
GET    /api/affiliates/links                 - List affiliate links
GET    /api/affiliates/clicks                - Get click statistics
POST   /api/affiliates/track                 - Track affiliate click
```

#### Commissions & Payouts
```
GET    /api/affiliates/commissions           - Get commission history
GET    /api/affiliates/earnings              - Get earnings summary
POST   /api/affiliates/payout/request        - Request payout
GET    /api/affiliates/payouts               - Get payout history
```

## 4. Database Schema Changes

### 4.1 Subscription Tables

```sql
-- Subscription Plans
CREATE TABLE subscription_plans (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(255) NOT NULL,
    slug VARCHAR(255) UNIQUE NOT NULL,
    description TEXT,
    price DECIMAL(10,2) NOT NULL,
    billing_cycle VARCHAR(20) NOT NULL, -- monthly, quarterly, annual
    trial_days INTEGER DEFAULT 0,
    setup_fee DECIMAL(10,2) DEFAULT 0,
    is_active BOOLEAN DEFAULT true,
    features JSONB, -- Plan features object
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

-- Customer Subscriptions
CREATE TABLE customer_subscriptions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES users(id),
    plan_id UUID NOT NULL REFERENCES subscription_plans(id),
    status VARCHAR(20) NOT NULL, -- active, paused, cancelled, expired
    current_period_start TIMESTAMP NOT NULL,
    current_period_end TIMESTAMP NOT NULL,
    trial_start TIMESTAMP,
    trial_end TIMESTAMP,
    cancelled_at TIMESTAMP,
    ends_at TIMESTAMP,
    quantity INTEGER DEFAULT 1,
    stripe_subscription_id VARCHAR(255),
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

-- Subscription Items
CREATE TABLE subscription_items (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    subscription_id UUID NOT NULL REFERENCES customer_subscriptions(id),
    product_id UUID NOT NULL REFERENCES products(id),
    quantity INTEGER NOT NULL DEFAULT 1,
    price DECIMAL(10,2) NOT NULL,
    created_at TIMESTAMP DEFAULT NOW()
);

-- Subscription Billing History
CREATE TABLE subscription_billing (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    subscription_id UUID NOT NULL REFERENCES customer_subscriptions(id),
    amount DECIMAL(10,2) NOT NULL,
    currency VARCHAR(3) DEFAULT 'USD',
    status VARCHAR(20) NOT NULL, -- pending, paid, failed, refunded
    stripe_invoice_id VARCHAR(255),
    billing_period_start TIMESTAMP NOT NULL,
    billing_period_end TIMESTAMP NOT NULL,
    created_at TIMESTAMP DEFAULT NOW()
);
```

### 4.2 Loyalty Program Tables

```sql
-- Loyalty Program Configuration
CREATE TABLE loyalty_program (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(255) NOT NULL,
    points_per_dollar DECIMAL(5,2) DEFAULT 1.00,
    points_expiration_days INTEGER DEFAULT 365,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

-- Loyalty Tiers
CREATE TABLE loyalty_tiers (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(255) NOT NULL,
    slug VARCHAR(255) UNIQUE NOT NULL,
    min_spending DECIMAL(10,2) NOT NULL,
    min_points INTEGER NOT NULL,
    points_multiplier DECIMAL(3,2) DEFAULT 1.00,
    discount_percent DECIMAL(5,2) DEFAULT 0.00,
    free_shipping BOOLEAN DEFAULT false,
    benefits JSONB, -- Tier benefits object
    sort_order INTEGER NOT NULL,
    created_at TIMESTAMP DEFAULT NOW()
);

-- Customer Loyalty Status
CREATE TABLE customer_loyalty (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID UNIQUE NOT NULL REFERENCES users(id),
    tier_id UUID NOT NULL REFERENCES loyalty_tiers(id),
    points_balance INTEGER DEFAULT 0,
    lifetime_points INTEGER DEFAULT 0,
    total_spending DECIMAL(10,2) DEFAULT 0.00,
    tier_advancement_at TIMESTAMP,
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

-- Points Transactions
CREATE TABLE points_transactions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES users(id),
    points INTEGER NOT NULL, -- positive for earned, negative for redeemed
    type VARCHAR(50) NOT NULL, -- purchase, redemption, referral, bonus, expiration
    reference_id UUID, -- Reference to order, affiliate, etc.
    description TEXT,
    expires_at TIMESTAMP,
    created_at TIMESTAMP DEFAULT NOW()
);

-- Loyalty Rewards
CREATE TABLE loyalty_rewards (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(255) NOT NULL,
    description TEXT,
    type VARCHAR(50) NOT NULL, -- discount, free_product, free_shipping
    points_cost INTEGER NOT NULL,
    value DECIMAL(10,2), -- Discount amount or product value
    is_active BOOLEAN DEFAULT true,
    inventory INTEGER, -- For physical rewards
    created_at TIMESTAMP DEFAULT NOW()
);
```

### 4.3 Affiliate Program Tables

```sql
-- Affiliate Profiles
CREATE TABLE affiliates (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID UNIQUE NOT NULL REFERENCES users(id),
    company_name VARCHAR(255),
    website_url VARCHAR(500),
    bio TEXT,
    status VARCHAR(20) DEFAULT 'pending', -- pending, approved, rejected, suspended
    commission_tier_id UUID REFERENCES affiliate_commission_tiers(id),
    stripe_account_id VARCHAR(255),
    tax_info JSONB,
    approved_at TIMESTAMP,
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

-- Affiliate Commission Tiers
CREATE TABLE affiliate_commission_tiers (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(255) NOT NULL,
    min_sales DECIMAL(10,2) NOT NULL,
    commission_rate DECIMAL(5,2) NOT NULL, -- Percentage
    recurring_rate DECIMAL(5,2), -- For subscription commissions
    created_at TIMESTAMP DEFAULT NOW()
);

-- Affiliate Links
CREATE TABLE affiliate_links (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    affiliate_id UUID NOT NULL REFERENCES affiliates(id),
    name VARCHAR(255) NOT NULL,
    url VARCHAR(1000) NOT NULL,
    slug VARCHAR(255) UNIQUE NOT NULL,
    product_id UUID REFERENCES products(id),
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP DEFAULT NOW()
);

-- Affiliate Clicks
CREATE TABLE affiliate_clicks (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    affiliate_id UUID NOT NULL REFERENCES affiliates(id),
    link_id UUID NOT NULL REFERENCES affiliate_links(id),
    ip_address INET,
    user_agent TEXT,
    referrer VARCHAR(1000),
    landing_page VARCHAR(1000),
    converted BOOLEAN DEFAULT false,
    conversion_date TIMESTAMP,
    created_at TIMESTAMP DEFAULT NOW()
);

-- Affiliate Commissions
CREATE TABLE affiliate_commissions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    affiliate_id UUID NOT NULL REFERENCES affiliates(id),
    order_id UUID REFERENCES orders(id),
    click_id UUID REFERENCES affiliate_clicks(id),
    amount DECIMAL(10,2) NOT NULL,
    commission_rate DECIMAL(5,2) NOT NULL,
    commission_amount DECIMAL(10,2) NOT NULL,
    status VARCHAR(20) DEFAULT 'pending', -- pending, approved, paid, reversed
    paid_at TIMESTAMP,
    created_at TIMESTAMP DEFAULT NOW()
);

-- Affiliate Payouts
CREATE TABLE affiliate_payouts (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    affiliate_id UUID NOT NULL REFERENCES affiliates(id),
    total_amount DECIMAL(10,2) NOT NULL,
    commission_count INTEGER NOT NULL,
    status VARCHAR(20) DEFAULT 'pending', -- pending, processing, paid, failed
    stripe_transfer_id VARCHAR(255),
    paid_at TIMESTAMP,
    created_at TIMESTAMP DEFAULT NOW()
);
```

## 5. Redis / Caching Usage

### 5.1 Subscription Caching
```redis
# Subscription Plans Cache
subscription:plans:{plan_id} -> Plan object (TTL: 1 hour)
subscription:plans:all -> All plans array (TTL: 30 minutes)

# Customer Subscription Status
subscription:status:{user_id} -> Active subscriptions (TTL: 15 minutes)
subscription:billing:{subscription_id} -> Billing info (TTL: 5 minutes)

# Subscription Analytics
subscription:mrr:current -> Current MRR value (TTL: 10 minutes)
subscription:churn:rate -> Monthly churn rate (TTL: 1 hour)
```

### 5.2 Loyalty Program Caching
```redis
# Customer Loyalty Data
loyalty:status:{user_id} -> Points balance and tier (TTL: 10 minutes)
loyalty:tier:benefits:{tier_id} -> Tier benefits (TTL: 1 hour)
loyalty:rewards:available -> Available rewards (TTL: 30 minutes)

# Points Calculations
loyalty:points:rate -> Points per dollar rate (TTL: 1 hour)
loyalty:tier:progress:{user_id} -> Progress to next tier (TTL: 15 minutes)

# Leaderboards
loyalty:leaderboard:points -> Top points earners (TTL: 1 hour)
loyalty:leaderboard:referrals -> Top referrers (TTL: 1 hour)
```

### 5.3 Affiliate Program Caching
```redis
# Affiliate Performance
affiliate:dashboard:{affiliate_id} -> Dashboard stats (TTL: 5 minutes)
affiliate:links:{affiliate_id} -> Affiliate links (TTL: 30 minutes)
affiliate:commissions:pending -> Pending commissions (TTL: 10 minutes)

# Click Tracking
affiliate:clicks:today:{affiliate_id} -> Today's clicks (TTL: 5 minutes)
affiliate:conversions:rate -> Conversion rates (TTL: 1 hour)

# Marketing Materials
affiliate:materials:banners -> Available banners (TTL: 1 hour)
affiliate:materials:links -> Pre-built links (TTL: 30 minutes)
```

## 6. Payment & Integration Considerations

### 6.1 Stripe Integration

#### Subscription Billing
- **Stripe Subscriptions API**: Create and manage subscription plans
- **Billing Cycles**: Support monthly, quarterly, annual billing
- **Payment Methods**: Multiple payment methods for subscriptions
- **Invoicing**: Automated invoice generation and delivery
- **Dunning Management**: Automated retry logic for failed payments
- **Webhooks**: Handle subscription events (created, updated, deleted)

#### Stripe Connect for Affiliates
- **Express Accounts**: Quick onboarding for affiliates
- **Custom Accounts**: Full control for high-volume affiliates
- **Transfers**: Automated commission payouts
- **Identity Verification**: KYC requirements handling
- **Tax Reporting**: 1099 form generation for US affiliates

### 6.2 SendGrid Integration

#### Subscription Notifications
- **Welcome Emails**: Subscription confirmation and setup
- **Billing Reminders**: Upcoming charge notifications
- **Payment Failed**: Dunning and payment update requests
- **Subscription Changes**: Upgrade/downgrade confirmations
- **Cancellation**: Subscription cancellation confirmations

#### Loyalty Program Communications
- **Points Earned**: Real-time points earning notifications
- **Tier Advancement**: Tier upgrade celebrations
- **Rewards Available**: New rewards announcements
- **Points Expiring**: Expiration warnings
- **Birthday Rewards**: Special birthday offers

#### Affiliate Communications
- **Approval Notifications**: Affiliate application status
- **Commission Updates**: New commission notifications
- **Payment Confirmations**: Payout processing notifications
- **Performance Reports**: Monthly performance summaries
- **Marketing Updates**: New promotions and materials

### 6.3 Twilio Integration

#### SMS Notifications
- **Subscription Alerts**: Critical subscription updates
- **Payment Issues**: Urgent payment failure notifications
- **Loyalty Alerts**: High-value loyalty notifications
- **Affiliate Alerts**: Important affiliate updates

#### Two-Factor Authentication
- **Affiliate Login**: 2FA for affiliate dashboard access
- **Admin Access**: Enhanced security for admin functions

### 6.4 CMS Integration

#### Content Management
- **Subscription Landing Pages**: Dynamic subscription plan pages
- **Loyalty Program Pages**: Tier benefits and rewards information
- **Affiliate Resources**: Marketing materials and training content
- **Blog Integration**: Content marketing for affiliate promotions

#### Dynamic Content
- **Personalized Offers**: Targeted offers based on loyalty tier
- **Subscription Content**: Premium content for subscribers
- **Affiliate Landing Pages**: Custom landing pages for affiliates

## 7. UI/UX Requirements

### 7.1 Subscription Management UI

#### Subscription Plans Page
```jsx
// Components: SubscriptionPlans.tsx, SubscriptionPlanCard.tsx
- Plan comparison table with features
- Pricing tiers with monthly/annual toggle
- Trial period indicators
- Benefits highlight sections
- CTA buttons for each plan
- FAQ accordion section
```

#### Customer Subscription Dashboard
```jsx
// Components: SubscriptionDashboard.tsx, SubscriptionCard.tsx
- Active subscriptions overview
- Upcoming charges display
- Quick actions (pause, upgrade, cancel)
- Billing history table
- Payment method management
- Subscription usage metrics
```

#### Subscription Checkout Flow
```jsx
// Components: SubscriptionCheckout.tsx, SubscriptionPayment.tsx
- Plan selection and customization
- Trial period confirmation
- Payment method setup
- Shipping address configuration
- Order review and confirmation
- Subscription success state
```

### 7.2 Loyalty Program UI

#### Loyalty Dashboard
```jsx
// Components: LoyaltyDashboard.tsx, LoyaltyTierCard.tsx
- Current tier status and benefits
- Points balance and breakdown
- Progress to next tier visualization
- Recent activity timeline
- Available rewards carousel
- Points expiration warnings
```

#### Points Redemption Interface
```jsx
// Components: PointsRedemption.tsx, RewardCard.tsx
- Reward categories and filtering
- Points value calculator
- Redemption confirmation modal
- Apply points at checkout
- Redemption history table
```

#### Tier Benefits Display
```jsx
// Components: TierBenefits.tsx, TierProgress.tsx
- Tier comparison chart
- Benefits checklist per tier
- Progress bar to next tier
- Tier anniversary countdown
- Exclusive access indicators
```

### 7.3 Affiliate Program UI

#### Affiliate Dashboard
```jsx
// Components: AffiliateDashboard.tsx, AffiliateStats.tsx
- Earnings overview and charts
- Click and conversion metrics
- Commission tracking table
- Payout history and status
- Performance trends
- Quick link generation
```

#### Marketing Materials Hub
```jsx
// Components: MarketingMaterials.tsx, MaterialCard.tsx
- Banner gallery with sizes
- Pre-built link generator
- Social media templates
- Email swipe copy
- Performance tracking per material
- Download and share options
```

#### Affiliate Analytics
```jsx
// Components: AffiliateAnalytics.tsx, PerformanceChart.tsx
- Conversion rate trends
- Top performing products
- Traffic source analysis
- Commission breakdown
- Goal tracking and projections
- Export functionality
```

### 7.4 Notification Components

```jsx
// Components: NotificationCenter.tsx, NotificationItem.tsx
- Unified notification center
- Subscription, loyalty, affiliate notifications
- Real-time updates via WebSocket
- Notification preferences management
- Email/SMS subscription toggles
- Notification history and search
```

## 8. Dependencies & Phase Pre-requisites

### 8.1 Required Dependencies

#### Backend Dependencies
```json
{
  "stripe": "^14.9.0",
  "@stripe/connect": "^0.1.0",
  "node-cron": "^3.0.3",
  "moment": "^2.29.4",
  "nodemailer": "^6.9.7",
  "twilio": "^4.19.0",
  "@sendgrid/mail": "^7.7.0",
  "redis": "^4.6.10",
  "bull": "^4.11.4",
  "express-rate-limit": "^7.1.5",
  "joi": "^17.11.0",
  "uuid": "^9.0.1"
}
```

#### Frontend Dependencies
```json
{
  "@stripe/react-stripe-js": "^2.4.0",
  "@stripe/stripe-js": "^2.4.0",
  "recharts": "^2.8.0",
  "date-fns": "^2.30.0",
  "react-hook-form": "^7.48.2",
  "@hookform/resolvers": "^3.3.2",
  "zod": "^3.22.4",
  "framer-motion": "^10.16.16",
  "react-hot-toast": "^2.4.1",
  "@radix-ui/react-dialog": "^1.0.5",
  "@radix-ui/react-tabs": "^1.0.4",
  "@radix-ui/react-progress": "^1.0.3"
}
```

### 8.2 Phase Prerequisites

#### Must Be Completed First
1. **Phase 1 MVP**: Core e-commerce functionality
2. **Phase 2**: User authentication and profiles
3. **Phase 3**: Payment processing with Stripe
4. **Phase 4**: Performance and scalability
5. **Phase 5**: Marketing automation
6. **Phase 6**: Multi-vendor marketplace

#### Required Infrastructure
- PostgreSQL database with existing schema
- Redis for caching and session management
- Stripe account with subscriptions enabled
- SendGrid account for email communications
- Twilio account for SMS notifications
- Docker environment with existing services

## 9. Docker Considerations

### 9.1 New Services Required

#### Subscription Billing Service
```yaml
subscription-billing:
  build: ./services/subscription-billing
  environment:
    - DATABASE_URL=${DATABASE_URL}
    - REDIS_URL=${REDIS_URL}
    - STRIPE_SECRET_KEY=${STRIPE_SECRET_KEY}
    - STRIPE_WEBHOOK_SECRET=${STRIPE_WEBHOOK_SECRET}
    - NODE_ENV=production
  volumes:
    - ./logs:/app/logs
  restart: unless-stopped
```

#### Loyalty Program Service
```yaml
loyalty-service:
  build: ./services/loyalty
  environment:
    - DATABASE_URL=${DATABASE_URL}
    - REDIS_URL=${REDIS_URL}
    - SENDGRID_API_KEY=${SENDGRID_API_KEY}
    - NODE_ENV=production
  volumes:
    - ./logs:/app/logs
  restart: unless-stopped
```

#### Affiliate Tracking Service
```yaml
affiliate-service:
  build: ./services/affiliate
  environment:
    - DATABASE_URL=${DATABASE_URL}
    - REDIS_URL=${REDIS_URL}
    - STRIPE_SECRET_KEY=${STRIPE_SECRET_KEY}
    - TWILIO_ACCOUNT_SID=${TWILIO_ACCOUNT_SID}
    - TWILIO_AUTH_TOKEN=${TWILIO_AUTH_TOKEN}
    - NODE_ENV=production
  volumes:
    - ./logs:/app/logs
  restart: unless-stopped
```

### 9.2 Environment Variables

```env
# Subscription Configuration
SUBSCRIPTION_TRIAL_DAYS=14
SUBSCRIPTION_DUNNING_RETRIES=3
SUBSCRIPTION_BILLING_GRACE_PERIOD=7

# Loyalty Program Configuration
LOYALTY_POINTS_PER_DOLLAR=1.00
LOYALTY_POINTS_EXPIRATION_DAYS=365
LOYALTY_TIER_ADVANCEMENT_THRESHOLD=1000

# Affiliate Program Configuration
AFFILIATE_COOKIE_DURATION=30
AFFILIATE_COMMISSION_RATE=10.00
AFFILIATE_RECURRING_COMMISSION_RATE=5.00
AFFILIATE_PAYOUT_THRESHOLD=50.00

# Stripe Connect Configuration
STRIPE_CONNECT_CLIENT_ID=ca_...
STRIPE_CONNECT_WEBHOOK_SECRET=whsec_...

# Notification Configuration
SUBSCRIPTION_NOTIFICATIONS_ENABLED=true
LOYALTY_NOTIFICATIONS_ENABLED=true
AFFILIATE_NOTIFICATIONS_ENABLED=true
```

### 9.3 Database Migrations

```bash
# Run Phase 7 migrations
npx prisma migrate dev --name phase-7-advanced-commerce

# Generate Prisma client
npx prisma generate

# Seed initial data
npx prisma db seed
```

### 9.4 Monitoring & Logging

#### Enhanced Monitoring
```yaml
# Prometheus configuration for Phase 7 metrics
- subscription_mrr_total
- subscription_churn_rate
- loyalty_points_issued_total
- loyalty_points_redeemed_total
- affiliate_clicks_total
- affiliate_conversions_total
- affiliate_commissions_total
```

#### Structured Logging
```javascript
// Enhanced logging for Phase 7 features
logger.info('subscription_created', {
  userId,
  planId,
  billingCycle,
  trialPeriod
});

logger.info('loyalty_points_earned', {
  userId,
  points,
  type,
  orderId
});

logger.info('affiliate_commission_earned', {
  affiliateId,
  orderId,
  amount,
  commissionAmount
});
```

## Implementation Timeline

### Week 1-2: Database Schema & Core Services
- Implement database schema changes
- Create core service classes
- Set up Stripe subscription integration
- Configure Redis caching layer

### Week 3-4: Subscription Features
- Build subscription management API
- Implement billing cycle logic
- Create subscription dashboard UI
- Set up dunning management

### Week 5-6: Loyalty Program
- Implement points system
- Create tier management
- Build rewards redemption
- Develop loyalty dashboard

### Week 7-8: Affiliate Program
- Build affiliate registration system
- Implement tracking and analytics
- Create commission management
- Develop affiliate dashboard

### Week 9-10: Integration & Testing
- Integrate all Phase 7 features
- Implement notifications and emails
- Comprehensive testing and QA
- Performance optimization

### Week 11-12: Deployment & Documentation
- Deploy to production environment
- Create user documentation
- Admin training and setup
- Go-live and monitoring

## Success Metrics

### Subscription Metrics
- MRR growth target: 25% in first 6 months
- Subscription churn rate: < 5% monthly
- Trial conversion rate: > 15%
- Customer lifetime value: +40% increase

### Loyalty Program Metrics
- Program enrollment: 60% of active customers
- Points redemption rate: 75% of issued points
- Tier advancement: 40% of members advance annually
- Repeat purchase rate: +30% increase

### Affiliate Program Metrics
- Affiliate acquisition: 100+ active affiliates
- Conversion rate: 3-5% from affiliate traffic
- Commission payout: $10,000+ monthly
- Revenue from affiliates: 15% of total sales

This comprehensive Phase 7 implementation will transform your e-commerce platform into a sophisticated commerce ecosystem with multiple revenue streams, enhanced customer loyalty, and powerful affiliate marketing capabilities.
