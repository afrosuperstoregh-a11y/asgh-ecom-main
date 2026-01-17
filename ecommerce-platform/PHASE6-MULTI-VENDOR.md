# Phase 6 – Multi-Vendor & Marketplace Implementation

## Overview
Phase 6 transforms the e-commerce platform into a full-featured marketplace supporting multiple vendors, commission management, and comprehensive vendor tools.

## Objectives
- Enable multiple vendors to sell products on the platform
- Provide comprehensive vendor dashboard and management tools
- Implement commission and payout system with Stripe Connect
- Create admin tools for vendor management and oversight
- Deliver seamless multi-vendor shopping experience
- Ensure scalability and performance for marketplace operations

## Features Breakdown

### Customer-Facing Features
1. **Multi-Vendor Product Discovery**
   - Browse products from multiple vendors
   - Filter by vendor, rating, location
   - Vendor storefront pages
   - Vendor-specific product listings

2. **Vendor Information & Trust**
   - Vendor profiles and ratings
   - Vendor verification badges
   - Product reviews per vendor
   - Vendor response times and metrics

3. **Multi-Vendor Checkout**
   - Single cart with products from multiple vendors
   - Split order processing by vendor
   - Unified payment with vendor allocation
   - Combined shipping options

4. **Order Management**
   - Track orders by vendor
   - Vendor-specific shipping updates
   - Multi-vendor order history
   - Vendor communication tools

### Vendor Dashboard Features
1. **Vendor Registration & Onboarding**
   - Multi-step vendor application
   - Document verification
   - Bank account setup via Stripe Connect
   - Tax information collection

2. **Product Management**
   - Bulk product upload
   - Vendor-specific inventory
   - Product approval workflow
   - Category-specific requirements

3. **Order Processing**
   - Order fulfillment dashboard
   - Shipping label generation
   - Order status updates
   - Customer communication

4. **Financial Management**
   - Revenue dashboard
   - Commission tracking
   - Payout history
   - Tax documents

5. **Analytics & Reporting**
   - Sales performance metrics
   - Product performance
   - Customer insights
   - Comparison analytics

6. **Store Customization**
   - Vendor storefront customization
   - Brand banner and logo
   - Store policies
   - Business hours

### Admin Features
1. **Vendor Management**
   - Vendor approval workflow
   - Vendor verification
   - Performance monitoring
   - Vendor suspension/termination

2. **Commission Management**
   - Commission rate configuration
   - Tiered commission structures
   - Promotional commission adjustments
   - Revenue analytics

3. **Marketplace Oversight**
   - Dispute resolution
   - Quality assurance
   - Compliance monitoring
   - Fraud detection

4. **Financial Administration**
   - Payout management
   - Commission reconciliation
   - Tax reporting
   - Revenue optimization

## Database Schema Updates

### New Tables

#### Vendors
```sql
CREATE TABLE vendors (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    business_name VARCHAR(255) NOT NULL,
    business_email VARCHAR(255) NOT NULL,
    business_phone VARCHAR(50),
    business_description TEXT,
    business_address JSONB,
    tax_id VARCHAR(100),
    website_url VARCHAR(500),
    logo_url VARCHAR(500),
    banner_url VARCHAR(500),
    verification_status VARCHAR(50) DEFAULT 'pending', -- pending, approved, rejected, suspended
    verification_documents JSONB,
    stripe_connect_id VARCHAR(255),
    commission_rate DECIMAL(5,2) DEFAULT 10.00,
    rating DECIMAL(3,2) DEFAULT 0.00,
    total_reviews INTEGER DEFAULT 0,
    total_sales DECIMAL(12,2) DEFAULT 0.00,
    is_active BOOLEAN DEFAULT false,
    settings JSONB,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

#### Vendor Products
```sql
CREATE TABLE vendor_products (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    vendor_id UUID REFERENCES vendors(id) ON DELETE CASCADE,
    product_id UUID REFERENCES products(id) ON DELETE CASCADE,
    sku VARCHAR(100) UNIQUE NOT NULL,
    cost_price DECIMAL(10,2),
    commission_rate DECIMAL(5,2),
    inventory_count INTEGER DEFAULT 0,
    reorder_level INTEGER DEFAULT 0,
    approval_status VARCHAR(50) DEFAULT 'pending', -- pending, approved, rejected
    rejection_reason TEXT,
    is_featured BOOLEAN DEFAULT false,
    vendor_notes TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

#### Vendor Orders
```sql
CREATE TABLE vendor_orders (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    order_id UUID REFERENCES orders(id) ON DELETE CASCADE,
    vendor_id UUID REFERENCES vendors(id) ON DELETE CASCADE,
    vendor_order_number VARCHAR(100) UNIQUE NOT NULL,
    status VARCHAR(50) DEFAULT 'pending', -- pending, processing, shipped, delivered, cancelled, refunded
    subtotal DECIMAL(10,2) NOT NULL,
    commission_amount DECIMAL(10,2) NOT NULL,
    vendor_earnings DECIMAL(10,2) NOT NULL,
    shipping_cost DECIMAL(10,2) DEFAULT 0.00,
    tax_amount DECIMAL(10,2) DEFAULT 0.00,
    tracking_number VARCHAR(255),
    carrier VARCHAR(100),
    shipped_at TIMESTAMP,
    delivered_at TIMESTAMP,
    notes TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

#### Vendor Order Items
```sql
CREATE TABLE vendor_order_items (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    vendor_order_id UUID REFERENCES vendor_orders(id) ON DELETE CASCADE,
    vendor_product_id UUID REFERENCES vendor_products(id) ON DELETE CASCADE,
    quantity INTEGER NOT NULL,
    unit_price DECIMAL(10,2) NOT NULL,
    total_price DECIMAL(10,2) NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

#### Vendor Payouts
```sql
CREATE TABLE vendor_payouts (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    vendor_id UUID REFERENCES vendors(id) ON DELETE CASCADE,
    payout_reference VARCHAR(255) UNIQUE NOT NULL,
    amount DECIMAL(12,2) NOT NULL,
    status VARCHAR(50) DEFAULT 'pending', -- pending, processing, completed, failed
    stripe_transfer_id VARCHAR(255),
    period_start DATE NOT NULL,
    period_end DATE NOT NULL,
    order_count INTEGER DEFAULT 0,
    commission_total DECIMAL(12,2) DEFAULT 0.00,
    processing_fee DECIMAL(10,2) DEFAULT 0.00,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    processed_at TIMESTAMP
);
```

#### Vendor Reviews
```sql
CREATE TABLE vendor_reviews (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    vendor_id UUID REFERENCES vendors(id) ON DELETE CASCADE,
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    order_id UUID REFERENCES orders(id) ON DELETE SET NULL,
    rating INTEGER CHECK (rating >= 1 AND rating <= 5),
    title VARCHAR(255),
    comment TEXT,
    response TEXT,
    response_date TIMESTAMP,
    is_verified_purchase BOOLEAN DEFAULT false,
    helpful_count INTEGER DEFAULT 0,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

#### Vendor Categories
```sql
CREATE TABLE vendor_categories (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    vendor_id UUID REFERENCES vendors(id) ON DELETE CASCADE,
    category_id UUID REFERENCES categories(id) ON DELETE CASCADE,
    is_approved BOOLEAN DEFAULT false,
    approval_date TIMESTAMP,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

#### Commission Tiers
```sql
CREATE TABLE commission_tiers (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(255) NOT NULL,
    min_monthly_sales DECIMAL(12,2) NOT NULL,
    max_monthly_sales DECIMAL(12,2),
    commission_rate DECIMAL(5,2) NOT NULL,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

#### Vendor Notifications
```sql
CREATE TABLE vendor_notifications (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    vendor_id UUID REFERENCES vendors(id) ON DELETE CASCADE,
    type VARCHAR(100) NOT NULL, -- order, payment, review, system, marketing
    title VARCHAR(255) NOT NULL,
    message TEXT NOT NULL,
    data JSONB,
    is_read BOOLEAN DEFAULT false,
    action_url VARCHAR(500),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    read_at TIMESTAMP
);
```

### Updated Tables

#### Users
```sql
ALTER TABLE users ADD COLUMN role VARCHAR(50) DEFAULT 'customer'; -- customer, vendor, admin
ALTER TABLE users ADD COLUMN vendor_id UUID REFERENCES vendors(id) ON DELETE SET NULL;
```

#### Products
```sql
ALTER TABLE products ADD COLUMN vendor_id UUID REFERENCES vendors(id) ON DELETE SET NULL;
ALTER TABLE products ADD COLUMN is_marketplace BOOLEAN DEFAULT false;
```

#### Orders
```sql
ALTER TABLE orders ADD COLUMN is_multi_vendor BOOLEAN DEFAULT false;
ALTER TABLE orders ADD COLUMN vendor_count INTEGER DEFAULT 1;
```

## API Endpoints

### Vendor Management Endpoints

#### Vendor Registration & Profile
- `POST /api/vendors/register` - Register new vendor
- `GET /api/vendors/profile` - Get vendor profile
- `PUT /api/vendors/profile` - Update vendor profile
- `POST /api/vendors/verify` - Submit verification documents
- `GET /api/vendors/verification-status` - Check verification status
- `POST /api/vendors/stripe-connect` - Initiate Stripe Connect onboarding
- `GET /api/vendors/stripe-connect/status` - Check Stripe Connect status

#### Vendor Dashboard
- `GET /api/vendors/dashboard` - Get dashboard overview
- `GET /api/vendors/analytics` - Get vendor analytics
- `GET /api/vendors/sales` - Get sales data
- `GET /api/vendors/revenue` - Get revenue data

#### Product Management
- `GET /api/vendors/products` - Get vendor products
- `POST /api/vendors/products` - Create new product
- `PUT /api/vendors/products/:id` - Update product
- `DELETE /api/vendors/products/:id` - Delete product
- `POST /api/vendors/products/bulk-upload` - Bulk upload products
- `PUT /api/vendors/products/:id/inventory` - Update inventory
- `GET /api/vendors/products/categories` - Get available categories

#### Order Management
- `GET /api/vendors/orders` - Get vendor orders
- `GET /api/vendors/orders/:id` - Get specific order
- `PUT /api/vendors/orders/:id/status` - Update order status
- `POST /api/vendors/orders/:id/ship` - Mark order as shipped
- `GET /api/vendors/orders/:id/label` - Generate shipping label
- `POST /api/vendors/orders/:id/track` - Add tracking information

#### Financial Management
- `GET /api/vendors/payouts` - Get payout history
- `GET /api/vendors/payouts/:id` - Get specific payout
- `GET /api/vendors/earnings` - Get earnings summary
- `GET /api/vendors/commissions` - Get commission details
- `GET /api/vendors/statements` - Get monthly statements

#### Reviews & Ratings
- `GET /api/vendors/reviews` - Get vendor reviews
- `POST /api/vendors/reviews/:id/respond` - Respond to review
- `GET /api/vendors/ratings` - Get rating summary

#### Notifications
- `GET /api/vendors/notifications` - Get notifications
- `PUT /api/vendors/notifications/:id/read` - Mark notification as read
- `PUT /api/vendors/notifications/read-all` - Mark all as read

### Customer-Facing Endpoints

#### Multi-Vendor Shopping
- `GET /api/vendors` - List all vendors
- `GET /api/vendors/:id` - Get vendor details
- `GET /api/vendors/:id/products` - Get vendor products
- `GET /api/vendors/:id/reviews` - Get vendor reviews
- `GET /api/products` - Get all marketplace products (filtered by vendor)
- `GET /api/search/vendors` - Search vendors

#### Checkout & Orders
- `POST /api/orders/multi-vendor` - Create multi-vendor order
- `GET /api/orders/vendor-breakdown/:id` - Get order breakdown by vendor

### Admin Endpoints

#### Vendor Management
- `GET /api/admin/vendors` - List all vendors
- `GET /api/admin/vendors/:id` - Get vendor details
- `PUT /api/admin/vendors/:id/approve` - Approve vendor
- `PUT /api/admin/vendors/:id/suspend` - Suspend vendor
- `PUT /api/admin/vendors/:id/verify` - Verify vendor documents
- `GET /api/admin/vendors/pending` - Get pending approvals

#### Commission Management
- `GET /api/admin/commissions` - Get commission settings
- `PUT /api/admin/commissions` - Update commission settings
- `GET /api/admin/commission-tiers` - Get commission tiers
- `POST /api/admin/commission-tiers` - Create commission tier
- `PUT /api/admin/commission-tiers/:id` - Update commission tier

#### Payout Management
- `GET /api/admin/payouts` - Get all payouts
- `POST /api/admin/payouts/process` - Process pending payouts
- `GET /api/admin/payouts/:id` - Get payout details

#### Analytics
- `GET /api/admin/analytics/vendors` - Get vendor analytics
- `GET /api/admin/analytics/marketplace` - Get marketplace analytics
- `GET /api/admin/reports/commissions` - Get commission reports

## Frontend Components

### Vendor Dashboard Pages

#### Main Dashboard
- `/vendor/dashboard` - Overview with metrics, charts, recent orders
- `/vendor/analytics` - Detailed analytics and reports
- `/vendor/products` - Product management interface
- `/vendor/orders` - Order management and fulfillment
- `/vendor/earnings` - Financial overview and statements
- `/vendor/reviews` - Review management and responses
- `/vendor/settings` - Store settings and configuration
- `/vendor/profile` - Vendor profile management

#### Product Management Components
- `ProductList` - Vendor product listing with filters
- `ProductForm` - Product creation/editing form
- `BulkUpload` - CSV/Excel bulk product upload
- `InventoryManager` - Inventory tracking and updates
- `ProductApproval` - Product approval status tracking

#### Order Management Components
- `OrderList` - Vendor order listing with status filters
- `OrderDetails` - Detailed order view with customer info
- `ShippingManager` - Shipping label generation and tracking
- `OrderStatus` - Order status update interface

#### Financial Components
- `EarningsDashboard` - Revenue and earnings overview
- `PayoutHistory` - Payout tracking and details
- `CommissionBreakdown` - Commission calculation details
- `TaxDocuments` - Tax document generation and download

### Customer-Facing Pages

#### Multi-Vendor Shopping
- `/vendors` - Vendor directory and search
- `/vendors/:id` - Vendor storefront page
- `/vendors/:id/products` - Vendor product listing
- `/vendors/:id/reviews` - Vendor reviews page
- `/marketplace` - Marketplace home with featured vendors
- `/products` - Enhanced product listing with vendor info

#### Product Pages
- Enhanced product cards with vendor information
- Vendor trust badges and ratings
- Multi-vendor cart management
- Vendor-specific shipping information

### Admin Pages

#### Vendor Management
- `/admin/vendors` - Vendor listing and management
- `/admin/vendors/:id` - Detailed vendor view
- `/admin/vendors/approvals` - Vendor approval queue
- `/admin/vendors/analytics` - Vendor performance analytics

#### Commission Management
- `/admin/commissions` - Commission configuration
- `/admin/payouts` - Payout management interface
- `/admin/reports` - Financial and marketplace reports

## Backend Logic

### Commission Calculation
```typescript
interface CommissionCalculation {
  baseRate: number;        // Base commission rate (e.g., 10%)
  tierRate: number;        // Tier-based rate adjustment
  productRate: number;     // Product-specific rate
  vendorRate: number;      // Vendor-specific rate
  finalRate: number;       // Final applied rate
}

class CommissionService {
  async calculateCommission(
    vendorId: string,
    productId: string,
    orderAmount: number
  ): Promise<CommissionCalculation> {
    // Get vendor commission rate
    const vendor = await this.getVendor(vendorId);
    
    // Check commission tiers
    const tier = await this.getCommissionTier(vendor.monthlySales);
    
    // Check product-specific rates
    const productRate = await this.getProductCommissionRate(productId);
    
    // Calculate final rate
    const finalRate = Math.max(
      vendor.commissionRate,
      tier.commissionRate,
      productRate
    );
    
    return {
      baseRate: vendor.commissionRate,
      tierRate: tier.commissionRate,
      productRate,
      vendorRate: vendor.commissionRate,
      finalRate
    };
  }
}
```

### Order Allocation Logic
```typescript
class OrderAllocationService {
  async allocateOrderToVendors(orderId: string): Promise<void> {
    const order = await this.getOrder(orderId);
    const vendorGroups = this.groupItemsByVendor(order.items);
    
    for (const [vendorId, items] of vendorGroups) {
      await this.createVendorOrder(vendorId, items, order);
      await this.notifyVendor(vendorId, items, order);
    }
    
    await this.updateOrderStatus(orderId, 'processing');
  }
  
  private async createVendorOrder(
    vendorId: string,
    items: OrderItem[],
    order: Order
  ): Promise<VendorOrder> {
    const subtotal = items.reduce((sum, item) => sum + item.totalPrice, 0);
    const commission = await this.calculateCommission(vendorId, items);
    const vendorEarnings = subtotal - commission.total;
    
    return await this.vendorOrderRepository.create({
      orderId: order.id,
      vendorId,
      vendorOrderNumber: this.generateVendorOrderNumber(),
      subtotal,
      commissionAmount: commission.total,
      vendorEarnings,
      items: items.map(item => ({
        vendorProductId: item.vendorProductId,
        quantity: item.quantity,
        unitPrice: item.unitPrice,
        totalPrice: item.totalPrice
      }))
    });
  }
}
```

### Payout Processing
```typescript
class PayoutService {
  async processVendorPayouts(): Promise<void> {
    const vendors = await this.getVendorsForPayout();
    
    for (const vendor of vendors) {
      const payoutCalculation = await this.calculatePayout(vendor);
      
      if (payoutCalculation.amount > 0) {
        await this.createPayout(vendor, payoutCalculation);
        await this.processStripeTransfer(vendor, payoutCalculation);
      }
    }
  }
  
  private async calculatePayout(vendor: Vendor): Promise<PayoutCalculation> {
    const orders = await this.getVendorOrdersForPeriod(vendor.id);
    const totalEarnings = orders.reduce((sum, order) => sum + order.vendorEarnings, 0);
    const totalCommission = orders.reduce((sum, order) => sum + order.commissionAmount, 0);
    const processingFee = totalEarnings * 0.025; // 2.5% processing fee
    
    return {
      vendorId: vendor.id,
      amount: totalEarnings - processingFee,
      orderCount: orders.length,
      commissionTotal: totalCommission,
      processingFee,
      orders
    };
  }
}
```

### Event-Driven Workflows
```typescript
// Order Placed Event
eventBus.on('order.placed', async (order: Order) => {
  await orderAllocationService.allocateOrderToVendors(order.id);
  await notificationService.notifyCustomers(order);
  await analyticsService.trackOrder(order);
});

// Vendor Order Shipped Event
eventBus.on('vendorOrder.shipped', async (vendorOrder: VendorOrder) => {
  await notificationService.notifyCustomerShipment(vendorOrder);
  await trackingService.updateTracking(vendorOrder);
  await analyticsService.trackShipment(vendorOrder);
});

// Vendor Review Event
eventBus.on('vendor.review', async (review: VendorReview) => {
  await vendorService.updateVendorRating(review.vendorId);
  await notificationService.notifyVendorReview(review);
  await analyticsService.trackReview(review);
});
```

## Docker & Infrastructure Considerations

### New Services
1. **Vendor Service Container**
   - Dedicated microservice for vendor operations
   - Handles vendor-specific business logic
   - Scales independently based on vendor load

2. **Payout Processing Service**
   - Background job processor for payouts
   - Stripe Connect integration
   - Scheduled tasks for commission calculations

3. **Search Indexing Service**
   - Elasticsearch for vendor and product search
   - Real-time indexing of vendor products
   - Faceted search capabilities

### Environment Variables
```env
# Vendor Management
VENDOR_SERVICE_URL=http://vendor-service:3001
PAYOUT_SERVICE_URL=http://payout-service:3002

# Stripe Connect
STRIPE_SECRET_KEY=sk_test_...
STRIPE_CONNECT_CLIENT_ID=ca_...
STRIPE_WEBHOOK_SECRET=whsec_...

# Commission Settings
DEFAULT_COMMISSION_RATE=10.0
MIN_PAYOUT_AMOUNT=10.00
PAYOUT_PROCESSING_FEE=0.025

# Search
ELASTICSEARCH_URL=http://elasticsearch:9200
SEARCH_INDEX_NAME=marketplace

# Notification Settings
VENDOR_NOTIFICATION_ENABLED=true
ORDER_NOTIFICATION_ENABLED=true
```

### Scaling Considerations
- Vendor service should scale based on active vendors
- Payout processing can be batched for efficiency
- Search indexing should be optimized for real-time updates
- Database read replicas for vendor analytics queries

## Integration Points

### Stripe Connect Integration
```typescript
class StripeConnectService {
  async createExpressAccount(vendorId: string): Promise<string> {
    const account = await stripe.accounts.create({
      type: 'express',
      country: 'US',
      email: 'vendor@example.com',
      capabilities: {
        card_payments: { requested: true },
        transfers: { requested: true },
      },
      business_profile: {
        name: 'Vendor Business Name',
        url: 'https://vendor-website.com'
      }
    });
    
    await this.saveStripeAccountId(vendorId, account.id);
    return account.id;
  }
  
  async createTransfer(vendorId: string, amount: number): Promise<Stripe.Transfer> {
    const vendor = await this.getVendor(vendorId);
    
    return await stripe.transfers.create({
      amount: Math.round(amount * 100), // Convert to cents
      currency: 'usd',
      destination: vendor.stripeConnectId,
      transfer_group: `payout_${Date.now()}`
    });
  }
}
```

### SendGrid Notifications
```typescript
class VendorNotificationService {
  async notifyNewOrder(vendorId: string, order: VendorOrder): Promise<void> {
    const vendor = await this.getVendor(vendorId);
    
    await sendGrid.send({
      to: vendor.businessEmail,
      from: 'noreply@marketplace.com',
      templateId: 'd-new-vendor-order',
      dynamicTemplateData: {
        vendorName: vendor.businessName,
        orderNumber: order.vendorOrderNumber,
        customerName: order.customerName,
        totalAmount: order.subtotal,
        orderUrl: `${process.env.VENDOR_PORTAL_URL}/orders/${order.id}`
      }
    });
  }
  
  async notifyPayoutProcessed(vendorId: string, payout: VendorPayout): Promise<void> {
    const vendor = await this.getVendor(vendorId);
    
    await sendGrid.send({
      to: vendor.businessEmail,
      from: 'payments@marketplace.com',
      templateId: 'd-payout-processed',
      dynamicTemplateData: {
        vendorName: vendor.businessName,
        payoutAmount: payout.amount,
        payoutDate: payout.processedAt,
        payoutReference: payout.payoutReference
      }
    });
  }
}
```

### Search Engine Integration
```typescript
class VendorSearchService {
  async indexVendor(vendor: Vendor): Promise<void> {
    await elasticsearch.index({
      index: 'vendors',
      id: vendor.id,
      body: {
        businessName: vendor.businessName,
        description: vendor.businessDescription,
        rating: vendor.rating,
        totalReviews: vendor.totalReviews,
        categories: vendor.categories,
        location: vendor.businessAddress,
        isActive: vendor.isActive,
        verificationStatus: vendor.verificationStatus,
        createdAt: vendor.createdAt
      }
    });
  }
  
  async searchVendors(query: string, filters: VendorSearchFilters): Promise<Vendor[]> {
    const searchQuery = {
      index: 'vendors',
      body: {
        query: {
          bool: {
            must: [
              { match: { businessName: query } },
              { term: { isActive: true } }
            ],
            filter: this.buildFilters(filters)
          }
        },
        sort: [
          { rating: { order: 'desc' } },
          { totalReviews: { order: 'desc' } }
        ]
      }
    };
    
    const response = await elasticsearch.search(searchQuery);
    return response.body.hits.hits.map(hit => hit._source);
  }
}
```

## Milestones & Timeline

### Sprint 1: Foundation (Week 1-2)
**Priority: High**
- Database schema implementation
- Basic vendor registration system
- Vendor profile management
- Basic admin vendor management

**Dependencies:**
- Database migration scripts
- User role system implementation

### Sprint 2: Product Management (Week 3-4)
**Priority: High**
- Vendor product management
- Product approval workflow
- Bulk product upload
- Inventory management

**Dependencies:**
- Sprint 1 completion
- Product catalog integration

### Sprint 3: Order Processing (Week 5-6)
**Priority: High**
- Multi-vendor order allocation
- Vendor order management
- Shipping integration
- Order status tracking

**Dependencies:**
- Sprint 2 completion
- Existing order system integration

### Sprint 4: Financial System (Week 7-8)
**Priority: High**
- Commission calculation engine
- Stripe Connect integration
- Payout processing
- Financial reporting

**Dependencies:**
- Sprint 3 completion
- Stripe account setup

### Sprint 5: Vendor Dashboard (Week 9-10)
**Priority: High**
- Complete vendor dashboard
- Analytics and reporting
- Review management
- Notification system

**Dependencies:**
- Sprint 4 completion
- Frontend framework setup

### Sprint 6: Customer Experience (Week 11-12)
**Priority: Medium**
- Multi-vendor shopping interface
- Vendor storefronts
- Enhanced search and filtering
- Review and rating system

**Dependencies:**
- Sprint 5 completion
- Search engine integration

### Sprint 7: Admin Tools (Week 13-14)
**Priority: Medium**
- Advanced admin dashboard
- Vendor analytics
- Commission management
- Dispute resolution

**Dependencies:**
- Sprint 6 completion
- Admin panel framework

### Sprint 8: Optimization & Testing (Week 15-16)
**Priority: Medium**
- Performance optimization
- Load testing
- Security audit
- Documentation completion

**Dependencies:**
- All previous sprints
- Testing environment setup

## Expected Outcomes

### Business Metrics
- Support 1000+ active vendors
- Process 10,000+ daily orders
- $1M+ monthly GMV (Gross Merchandise Volume)
- 95% vendor satisfaction rate
- 99.9% platform uptime

### Technical Metrics
- Sub-200ms API response times
- 99.99% data accuracy for financial calculations
- Real-time inventory synchronization
- Scalable architecture for 10x growth

### User Experience
- Seamless vendor onboarding (< 10 minutes)
- Intuitive vendor dashboard
- Transparent commission and payout system
- Excellent customer support tools

## Next Steps

1. **Immediate Actions**
   - Set up development environment
   - Create database migration scripts
   - Initialize vendor service repository
   - Set up Stripe Connect test accounts

2. **Week 1 Priorities**
   - Implement vendor registration flow
   - Create basic vendor profile
   - Set up admin vendor management
   - Begin database schema implementation

3. **Success Criteria**
   - Vendor can register and get approved
   - Vendor can add and manage products
   - Orders can be allocated to multiple vendors
   - Commissions are calculated correctly
   - Payouts are processed automatically

This comprehensive implementation plan provides a complete roadmap for transforming the e-commerce platform into a full-featured marketplace with multi-vendor capabilities.
