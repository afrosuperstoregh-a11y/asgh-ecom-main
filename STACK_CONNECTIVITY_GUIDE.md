# Stack Connectivity Guide

## Overview
This document outlines the connectivity between all stacks in the Afro Superstore e-commerce platform.

## Architecture Summary

### 1. Root Backend Stack (`/backend`)
- **Port**: 3001
- **Purpose**: Primary backend API with comprehensive features
- **Database**: PostgreSQL + Supabase (hybrid approach)
- **Features**: Complete authentication, payments, admin panel, CRM

### 2. Ecommerce Platform Stack (`/ecommerce-platform`)
- **Frontend**: Next.js (Port 3000)
- **Backend**: Express.js (Port 3001)
- **Purpose**: Modern React-based frontend with connected backend
- **Database**: PostgreSQL + Supabase (mirrors root backend)

## Connectivity Status ✅

### ✅ Database Connectivity
- **PostgreSQL**: Connected to both stacks
- **Supabase**: Configured for both stacks with fallback to PostgreSQL
- **Connection Testing**: Implemented in both stacks

### ✅ API Endpoint Connectivity
- **Authentication**: `/api/auth/*` endpoints fully connected
- **Products**: `/api/products/*` endpoints synchronized
- **Orders**: `/api/orders/*` endpoints connected
- **Payments**: `/api/payments/*` endpoints integrated
- **Users**: `/api/users/*` endpoints connected
- **Admin**: `/api/admin/*` endpoints synchronized

### ✅ Authentication & Authorization
- **JWT Tokens**: Consistent across both stacks
- **Password Hashing**: bcryptjs implemented
- **Role-based Access**: Admin, Manager, Customer roles
- **Session Management**: LocalStorage + JWT

### ✅ Payment Integration
- **Stripe**: Connected to both stacks
- **PayPal**: Integrated in both backends
- **Webhooks**: Configured for payment confirmation
- **Security**: PCI compliant implementation

### ✅ Environment Variables
- **Consistent Naming**: Standardized across stacks
- **Development/Production**: Separate configurations
- **Security**: Sensitive data properly managed

## API Endpoints Mapping

### Authentication
```
POST /api/auth/login          - User login
POST /api/auth/register       - User registration
POST /api/auth/logout         - User logout
GET  /api/auth/me             - Get current user
GET  /api/auth/validate       - Validate token
POST /api/auth/forgot-password - Password reset request
POST /api/auth/reset-password  - Password reset confirmation
```

### Products
```
GET    /api/products          - Get all products
GET    /api/products/:id      - Get single product
POST   /api/products          - Create product (admin)
PUT    /api/products/:id      - Update product (admin)
DELETE /api/products/:id      - Delete product (admin)
```

### Orders
```
GET    /api/orders            - Get user orders
POST   /api/orders            - Create order
GET    /api/orders/:id        - Get order details
PUT    /api/orders/:id        - Update order status (admin)
```

### Payments
```
POST   /api/payments/create-intent    - Create Stripe payment intent
POST   /api/payments/confirm          - Confirm payment
POST   /api/payments/paypal/create    - Create PayPal payment
POST   /api/payments/paypal/capture   - Capture PayPal payment
GET    /api/payments/status/:id       - Get payment status
POST   /api/payments/refund           - Process refund
```

## Frontend-Backend Integration

### API Configuration
- **Development**: `http://localhost:3001/api`
- **Production**: `https://api.afrosuperstore.ca`
- **Fallback**: `/api` (for same deployment)

### Authentication Flow
1. User logs in via frontend auth component
2. Request sent to backend `/api/auth/login`
3. Backend validates credentials and returns JWT
4. Frontend stores token in localStorage
5. Subsequent requests include Authorization header

### Payment Flow
1. User selects products and proceeds to checkout
2. Frontend creates payment intent via `/api/payments/create-intent`
3. Payment processed via Stripe/PayPal
4. Backend confirms payment via webhooks
5. Order status updated and user notified

## Environment Setup

### Required Environment Variables

#### Backend (.env)
```bash
# Database
DATABASE_URL=postgresql://user:pass@localhost:5432/asca_ecommerce
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key

# Authentication
JWT_SECRET=your-super-secret-jwt-key-here

# Server
PORT=3001
NODE_ENV=development
FRONTEND_URL=http://localhost:3000

# Payments
STRIPE_SECRET_KEY=sk_test_your-stripe-secret-key
PAYPAL_CLIENT_ID=your-paypal-client-id
PAYPAL_CLIENT_SECRET=your-paypal-client-secret

# Email
SMTP_HOST=smtp.gmail.com
SMTP_USER=your-email@gmail.com
SMTP_PASS=your-app-password
FROM_EMAIL=noreply@afrosuperstore.ca
```

#### Frontend (.env.local)
```bash
NEXT_PUBLIC_API_URL=http://localhost:3001/api
NEXT_PUBLIC_SITE_URL=http://localhost:3000
```

## Deployment Configuration

### Development
- **Frontend**: `npm run dev` (Port 3000)
- **Backend**: `npm run dev` (Port 3001)
- **Database**: Local PostgreSQL + Supabase

### Production
- **Frontend**: Vercel deployment
- **Backend**: Render/Railway deployment
- **Database**: Supabase PostgreSQL
- **CDN**: Vercel Edge Network

## Security Implementation

### CORS Configuration
- **Allowed Origins**: afrosuperstore.ca, localhost:3000, localhost:3001
- **Methods**: GET, POST, PUT, DELETE, PATCH, OPTIONS
- **Headers**: Content-Type, Authorization, X-Requested-With

### Rate Limiting
- **General**: 100 requests per 15 minutes
- **Authentication**: 5 requests per 15 minutes
- **Password Reset**: 3 requests per hour

### Security Headers
- **Helmet.js**: Security middleware implemented
- **CSP**: Content Security Policy configured
- **HSTS**: HTTP Strict Transport Security enabled

## Testing Connectivity

### Health Check Endpoints
```bash
# Backend health check
curl http://localhost:3001/api/health

# Expected response
{
  "status": "OK",
  "timestamp": "2024-01-29T...",
  "service": "Afro Superstore Backend API",
  "version": "1.0.0"
}
```

### Database Connection Test
```bash
# Test database connectivity
node -e "require('./backend/src/config/database').testConnection()"
```

### Authentication Test
```bash
# Test login endpoint
curl -X POST http://localhost:3001/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"test@example.com","password":"password"}'
```

## Troubleshooting

### Common Issues

1. **CORS Errors**
   - Check FRONTEND_URL environment variable
   - Verify CORS configuration in server.js

2. **Database Connection**
   - Verify DATABASE_URL is correct
   - Check PostgreSQL service is running
   - Test Supabase credentials

3. **Authentication Failures**
   - Verify JWT_SECRET is set
   - Check password hashing consistency
   - Validate token format

4. **Payment Integration**
   - Verify Stripe/PayPal API keys
   - Check webhook endpoints
   - Validate payment intent creation

### Debug Commands
```bash
# Check backend logs
npm run dev

# Check database connection
node -e "console.log(require('./backend/src/config/database'))"

# Test API endpoints
curl http://localhost:3001/api/health
```

## Monitoring

### Health Monitoring
- **Database**: Connection status checked on startup
- **API**: Health endpoint available at `/api/health`
- **Services**: External service status monitored

### Logging
- **Development**: Console logging enabled
- **Production**: Structured logging with error tracking
- **Security**: Authentication attempts logged

## Next Steps

1. **Load Testing**: Test API endpoints under load
2. **Security Audit**: Perform security penetration testing
3. **Performance Monitoring**: Implement APM solutions
4. **Backup Strategy**: Regular database backups
5. **Disaster Recovery**: Implement recovery procedures

---

## Status: ✅ ALL STACKS FULLY CONNECTED

All components of the Afro Superstore e-commerce platform are now fully connected and operational:

- ✅ Database connectivity established
- ✅ API endpoints synchronized
- ✅ Authentication system unified
- ✅ Payment integrations active
- ✅ Environment variables consistent
- ✅ Security measures implemented
- ✅ Frontend-backend communication verified

The platform is ready for development, testing, and production deployment.
