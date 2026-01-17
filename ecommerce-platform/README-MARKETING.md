# Phase 5: Marketing & Automation

This document provides a comprehensive guide for the Marketing & Automation features implemented in Phase 5 of the e-commerce platform.

## 🎯 Overview

Phase 5 introduces a complete marketing automation system that enables personalized customer engagement through email campaigns, SMS marketing, abandoned cart recovery, customer segmentation, and comprehensive analytics.

## 📋 Features Implemented

### 1. Campaign Management
- **Multi-channel Campaigns**: Email, SMS, push notifications, and in-app messages
- **Template System**: Dynamic email and SMS templates with variable substitution
- **Scheduling**: Time-based and trigger-based campaign scheduling
- **A/B Testing**: Campaign variant testing capabilities
- **Analytics**: Real-time campaign performance tracking

### 2. Customer Segmentation
- **Dynamic Segments**: Behavior-based customer segmentation
- **RFM Analysis**: Recency, Frequency, Monetary value analysis
- **Custom Rules**: Flexible segmentation rule builder
- **Real-time Sync**: Automatic segment updates based on customer behavior

### 3. Abandoned Cart Recovery
- **Multi-step Recovery**: Email and SMS recovery sequences
- **Timing Optimization**: Intelligent recovery timing based on customer behavior
- **Personalization**: Cart-specific recovery messages
- **Analytics**: Recovery rate and ROI tracking

### 4. Discount & Coupon Management
- **Flexible Discounts**: Percentage, fixed amount, free shipping
- **Usage Controls**: Per-customer and total usage limits
- **Validation**: Real-time coupon validation with business rules
- **Analytics**: Redemption tracking and effectiveness measurement

### 5. Email Marketing (SendGrid)
- **Template Management**: Dynamic email templates
- **Delivery Tracking**: Real-time delivery status and analytics
- **Webhook Integration**: Automated event processing
- **Personalization**: Customer-specific content personalization

### 6. SMS Marketing (Twilio)
- **Two-way Messaging**: Interactive SMS campaigns
- **Delivery Tracking**: Real-time SMS delivery status
- **Compliance**: TCPA and GDPR compliance features
- **Opt-out Management**: Automated subscription management

### 7. CMS Integration
- **Content Synchronization**: Blog and landing page integration
- **Dynamic Content**: Campaign-specific content management
- **SEO Optimization**: Integrated SEO management
- **Media Management**: Centralized media asset management

### 8. Analytics & Monitoring
- **Real-time Dashboards**: Live campaign performance metrics
- **Customer Analytics**: Behavior tracking and insights
- **ROI Tracking**: Campaign return on investment measurement
- **Alerting**: Automated performance alerts

## 🏗️ Architecture

### System Components

```
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│   Frontend      │    │   API Gateway   │    │  Background     │
│   (Next.js)     │◄──►│   (Next.js)     │◄──►│  Jobs Worker    │
│                 │    │                 │    │  (Redis Queue)  │
└─────────────────┘    └─────────────────┘    └─────────────────┘
         │                       │                       │
         │                       │                       │
         ▼                       ▼                       ▼
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│   Marketing UI  │    │ Marketing APIs  │    │   External      │
│ - Campaigns     │    │ - Campaigns     │    │   Integrations  │
│ - Coupons       │    │ - Coupons       │    │ - SendGrid      │
│ - Analytics     │    │ - Analytics     │    │ - Twilio        │
│ - Segmentation  │    │ - Segmentation  │    │ - CMS           │
└─────────────────┘    └─────────────────┘    └─────────────────┘
                                │
                                ▼
                    ┌─────────────────┐
                    │   Data Layer    │
                    │ - PostgreSQL    │
                    │ - Redis Cache   │
                    │ - Analytics DB  │
                    └─────────────────┘
```

### Database Schema

The marketing system extends the existing database with the following tables:

- **Campaigns**: Campaign definitions and settings
- **Marketing Templates**: Email and SMS templates
- **Customer Segments**: Customer segmentation rules
- **Campaign Interactions**: Customer engagement tracking
- **Campaign Analytics**: Performance metrics storage
- **Abandoned Carts**: Cart abandonment tracking
- **Subscriptions**: Customer subscription preferences
- **Marketing Jobs**: Background job queue management

## 🚀 Quick Start

### Prerequisites

- Docker and Docker Compose
- Node.js 18+ (for local development)
- PostgreSQL 15+
- Redis 7+
- SendGrid API key
- Twilio account credentials

### Installation

1. **Clone the repository**
   ```bash
   git clone <repository-url>
   cd ecommerce-platform
   ```

2. **Set up environment variables**
   ```bash
   cp .env.marketing.example .env.marketing
   # Edit .env.marketing with your API keys and configuration
   ```

3. **Run the setup script**
   ```bash
   chmod +x scripts/setup-marketing.sh
   ./scripts/setup-marketing.sh
   ```

4. **Access the services**
   - Frontend: http://localhost:3000
   - API: http://localhost:3001
   - Redis Commander: http://localhost:8081
   - Grafana: http://localhost:3002 (admin/admin)
   - Prometheus: http://localhost:9090

## 📊 API Documentation

### Campaign Management

#### Create Campaign
```http
POST /api/marketing/campaigns
Content-Type: application/json

{
  "name": "Summer Sale Campaign",
  "description": "Summer promotion campaign",
  "type": "EMAIL",
  "templateId": "template-uuid",
  "segmentId": "segment-uuid",
  "scheduledAt": "2024-06-01T10:00:00Z"
}
```

#### Send Campaign
```http
POST /api/marketing/campaigns/{id}/send
Content-Type: application/json

{
  "sendNow": true,
  "testMode": false
}
```

#### Get Campaign Analytics
```http
GET /api/marketing/analytics/campaigns/{id}?startDate=2024-06-01&endDate=2024-06-30
```

### Customer Segmentation

#### Create Segment
```http
POST /api/marketing/segments
Content-Type: application/json

{
  "name": "High Value Customers",
  "description": "Customers with >$1000 lifetime value",
  "rules": {
    "conditions": [
      {
        "field": "totalSpent",
        "operator": "gte",
        "value": 1000
      }
    ],
    "operator": "AND"
  }
}
```

### Discount Management

#### Validate Coupon
```http
POST /api/marketing/coupons/validate
Content-Type: application/json

{
  "code": "SUMMER20",
  "cartValue": 150.00
}
```

### Subscriptions

#### Subscribe Customer
```http
POST /api/marketing/subscribe
Content-Type: application/json

{
  "email": "customer@example.com",
  "phone": "+1234567890",
  "emailSubscribed": true,
  "smsSubscribed": false,
  "source": "newsletter_signup"
}
```

## 🎨 Frontend Components

### Newsletter Signup

```tsx
import NewsletterSignup from '@/components/marketing/NewsletterSignup';

<NewsletterSignup
  variant="default"
  showPhone={true}
  onSubscribe={(data) => console.log('Subscribed:', data)}
/>
```

### Promo Banner

```tsx
import PromoBanner from '@/components/marketing/PromoBanner';

<PromoBanner
  variant="top"
  dismissible={true}
  autoHide={30000}
  promo={{
    id: 'summer-sale',
    title: 'Summer Sale!',
    description: 'Get 20% off everything',
    discountCode: 'SUMMER20',
    discountType: 'percentage',
    discountValue: 20
  }}
/>
```

### Discount Input

```tsx
import DiscountInput from '@/components/marketing/DiscountInput';

<DiscountInput
  onDiscountApplied={(discount) => console.log('Applied:', discount)}
  onDiscountRemoved={() => console.log('Removed')}
/>
```

### Product Recommendations

```tsx
import ProductRecommendations from '@/components/marketing/ProductRecommendations';

<ProductRecommendations
  type="personalized"
  customerId="customer-uuid"
  limit={8}
  showAddToCart={true}
/>
```

### Abandoned Cart Modal

```tsx
import AbandonedCartModal from '@/components/marketing/AbandonedCartModal';

<AbandonedCartModal
  isOpen={showModal}
  onClose={() => setShowModal(false)}
  cartData={cartData}
  onEmailSubmit={(email) => saveEmail(email)}
  onCartRecovery={() => navigate('/cart')}
/>
```

## 🔧 Configuration

### Environment Variables

```bash
# Database
DATABASE_URL=postgresql://postgres:password@localhost:5432/ecommerce

# Redis
REDIS_URL=redis://localhost:6379
REDIS_QUEUE_URL=redis://localhost:6379

# SendGrid
SENDGRID_API_KEY=your_sendgrid_api_key
SENDGRID_FROM_EMAIL=noreply@yourstore.com
SENDGRID_FROM_NAME=Your Store

# Twilio
TWILIO_ACCOUNT_SID=your_twilio_account_sid
TWILIO_AUTH_TOKEN=your_twilio_auth_token
TWILIO_PHONE_NUMBER=+1234567890

# CMS
CMS_API_URL=https://your-cms.com/api
CMS_API_KEY=your_cms_api_key

# Marketing
MARKETING_WORKER_CONCURRENCY=5
MARKETING_BATCH_SIZE=100
```

### Docker Configuration

The marketing system uses `docker-compose.marketing.yml` for container orchestration:

- **API Service**: Main application server
- **Marketing Worker**: Background job processor
- **Client Service**: Frontend application
- **PostgreSQL**: Primary database
- **Redis**: Caching and session storage
- **Redis Queue**: Job queue management
- **Nginx**: Load balancer and reverse proxy
- **Prometheus**: Metrics collection
- **Grafana**: Monitoring dashboard

## 📈 Monitoring & Analytics

### Key Metrics

#### Campaign Performance
- **Open Rate**: Percentage of recipients who opened emails
- **Click-through Rate**: Percentage of recipients who clicked links
- **Conversion Rate**: Percentage of recipients who completed desired actions
- **Bounce Rate**: Percentage of emails that bounced
- **Unsubscribe Rate**: Percentage of recipients who unsubscribed

#### Customer Engagement
- **List Growth Rate**: New subscriber acquisition rate
- **Customer Lifetime Value**: Total revenue per customer
- **Customer Acquisition Cost**: Cost to acquire new customers
- **Retention Rate**: Customer retention percentage

#### Cart Recovery
- **Abandonment Rate**: Percentage of carts abandoned
- **Recovery Rate**: Percentage of abandoned carts recovered
- **Recovery Revenue**: Revenue from recovered carts
- **Time to Recovery**: Average time to cart recovery

### Grafana Dashboards

1. **Campaign Overview**: Real-time campaign performance
2. **Customer Analytics**: Customer behavior and segmentation
3. **Email Performance**: SendGrid metrics and deliverability
4. **SMS Performance**: Twilio metrics and delivery rates
5. **System Health**: Infrastructure and application health

### Alerting Rules

The system includes comprehensive alerting rules for:

- **Campaign Performance**: Low open/click rates, high bounce rates
- **Service Health**: API errors, high latency, queue backlogs
- **Business Metrics**: Low conversion rates, high acquisition costs
- **Infrastructure**: Database performance, Redis memory usage

## 🧪 Testing

### Unit Tests

```bash
# Run marketing service tests
npm test -- --testPathPattern=marketing

# Run API tests
npm test -- --testPathPattern=api/marketing
```

### Integration Tests

```bash
# Test campaign creation and sending
npm run test:campaigns

# Test abandoned cart recovery
npm run test:abandoned-carts

# Test discount validation
npm run test:discounts
```

### Load Testing

```bash
# Run marketing API load tests
./scripts/performance-test.sh marketing

# Test email sending performance
./scripts/email-load-test.sh
```

## 🔒 Security

### Data Protection
- **GDPR Compliance**: Consent management and data deletion
- **PII Encryption**: Personal data encryption at rest
- **API Security**: Rate limiting and authentication
- **Audit Logging**: Comprehensive activity tracking

### Privacy Features
- **Double Opt-in**: Email verification requirement
- **Consent Management**: Granular subscription preferences
- **Data Anonymization**: Analytics data protection
- **Secure Storage**: Encrypted credential management

## 🚀 Deployment

### Production Deployment

1. **Prepare Environment**
   ```bash
   # Set production environment variables
   cp .env.marketing.example .env.production
   
   # Configure SSL certificates
   mkdir -p ssl
   # Copy your SSL certificates to ssl/
   ```

2. **Deploy Services**
   ```bash
   # Deploy with production configuration
   docker-compose -f docker-compose.marketing.yml -f docker-compose.prod.yml up -d
   ```

3. **Run Migrations**
   ```bash
   # Run database migrations
   docker-compose exec api npm run prisma:migrate
   ```

4. **Seed Data**
   ```bash
   # Seed with initial data
   docker-compose exec api npm run prisma:seed
   ```

### Monitoring Setup

1. **Configure Prometheus**
   - Update `monitoring/prometheus-marketing.yml`
   - Set up alerting rules
   - Configure data retention

2. **Set Up Grafana**
   - Import marketing dashboards
   - Configure data sources
   - Set up alert notifications

3. **Configure Logging**
   - Set up centralized logging
   - Configure log rotation
   - Set up error tracking

## 📚 Additional Resources

### Documentation
- [API Reference](./API-ENDPOINTS.md)
- [Frontend Components](./FRONTEND-COMPONENTS.md)
- [Database Schema](./api/prisma/schema.prisma)
- [Monitoring Guide](./README-PERFORMANCE.md)

### Support
- [Troubleshooting Guide](./TROUBLESHOOTING.md)
- [FAQ](./FAQ.md)
- [Community Forum](https://community.yourstore.com)

### Best Practices
- [Email Marketing Best Practices](./docs/email-best-practices.md)
- [SMS Marketing Guidelines](./docs/sms-guidelines.md)
- [Customer Segmentation Strategies](./docs/segmentation-strategies.md)

## 🔄 Version History

### v5.0.0 (Current)
- Initial marketing automation implementation
- Email and SMS campaign management
- Customer segmentation
- Abandoned cart recovery
- Discount and coupon system
- Analytics and monitoring
- SendGrid and Twilio integration
- CMS integration

### Future Releases
- AI-powered recommendations
- Advanced personalization
- Multi-channel orchestration
- Predictive analytics
- Advanced A/B testing

---

For questions or support, please refer to the documentation or contact the development team.
