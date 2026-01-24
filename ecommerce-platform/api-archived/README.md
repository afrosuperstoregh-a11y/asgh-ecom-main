# E-Commerce Platform API

A complete, production-ready e-commerce backend built with Node.js, Express, TypeScript, and modern development practices.

## 🚀 Quick Start

### Prerequisites
- Node.js 18+
- Docker & Docker Compose
- PostgreSQL 15+
- Redis 7+
- Stripe account (for payments)

### 1. Clone & Install Dependencies
```bash
cd ecommerce-platform/api
npm install
```

### 2. Environment Setup
Copy `.env.example` to `.env` and configure:
```env
# Database
DATABASE_URL="postgresql://postgres:postgres@localhost:5432/ecommerce"

# Redis
REDIS_URL="redis://localhost:6379"

# JWT
JWT_SECRET="your-super-secret-jwt-key-here"

# Stripe
STRIPE_SECRET_KEY="sk_test_..."
STRIPE_WEBHOOK_SECRET="whsec_..."

# Typesense
TYPESENSE_API_KEY="your-typesense-key"
TYPESENSE_HOST="localhost"
TYPESENSE_PORT="8108"

# CORS
ALLOWED_ORIGINS="http://localhost:3000,http://localhost:3001"
```

### 3. Start Services with Docker
```bash
# From the root directory
docker-compose up -d
```

### 4. Setup Database
```bash
# Generate Prisma client
npm run prisma:generate

# Run database migrations
npm run prisma:migrate

# Seed with sample data
npm run prisma:seed
```

### 5. Start Development Server
```bash
npm run dev
```

The API will be available at `http://localhost:3001`

## 📚 API Documentation

### Base URL
```
http://localhost:3001/api
```

### Authentication
Most endpoints require authentication. Include the JWT token in the Authorization header:
```
Authorization: Bearer <your-jwt-token>
```

### Core Endpoints

#### 🛍️ Products
```
GET    /api/products              # List products with pagination
GET    /api/products/:id          # Get product details
GET    /api/products/featured     # Featured products
GET    /api/products/search       # Search products
GET    /api/products/categories   # All categories
GET    /api/products/category/:slug # Products by category
```

#### 🛒 Shopping Cart
```
GET    /api/cart                 # Get current cart
POST   /api/cart/items           # Add item to cart
PUT    /api/cart/items/:id        # Update item quantity
DELETE /api/cart/items/:id     # Remove item
DELETE /api/cart               # Clear cart
POST   /api/cart/merge           # Merge guest cart
```

#### 👤 Authentication
```
POST   /api/auth/register         # User registration
POST   /api/auth/login           # User login
POST   /api/auth/verify-email    # Email verification
POST   /api/auth/forgot-password # Password reset
POST   /api/auth/reset-password  # Complete password reset
POST   /api/auth/change-password # Change password
GET    /api/auth/me              # Get user profile
PUT    /api/auth/me              # Update profile
POST   /api/auth/logout          # Logout
```

#### 📦 Orders & Checkout
```
POST   /api/checkout             # Create order
GET    /api/orders               # User orders
GET    /api/orders/:id           # Order details
PUT    /api/orders/:id/cancel    # Cancel order
GET    /api/orders/:id/tracking  # Order tracking
```

#### 💳 Payments
```
POST   /api/payments/intent      # Create payment intent
POST   /api/payments/confirm     # Stripe webhook
GET    /api/payments/:orderId     # Payment status
POST   /api/payments/refund     # Process refund
```

### 🧪 Test Data
The database is seeded with test data:

**Test User:**
- Email: `test@example.com`
- Password: `password123`

**Sample Products:**
- Wireless Headphones - $199.99
- Smart Watch - $299.99
- Laptop Pro - $1299.99
- Cotton T-Shirt - $29.99
- Denim Jeans - $79.99
- JavaScript Guide - $49.99

**Sample Coupons:**
- `WELCOME10` - 10% off orders over $50
- `FREESHIP` - Free shipping on orders over $100

## 🏗️ Architecture

### Technology Stack
- **Runtime**: Node.js 18+
- **Framework**: Express.js
- **Language**: TypeScript
- **Database**: PostgreSQL with Prisma ORM
- **Cache**: Redis
- **Search**: Typesense
- **Authentication**: JWT
- **Payments**: Stripe
- **Validation**: Express Validator
- **Logging**: Winston

### Project Structure
```
src/
├── config/          # Database, Redis, Typesense configuration
├── controllers/     # Route handlers
├── middleware/      # Auth, validation, rate limiting
├── routes/         # API route definitions
├── types/          # TypeScript type definitions
├── utils/          # Helper functions and utilities
└── index.ts        # Application entry point
```

### Security Features
- JWT-based authentication with refresh tokens
- Rate limiting (auth, search, cart, orders)
- Input sanitization & validation
- CORS with origin whitelist
- Security headers (CSP, HSTS, XSS protection)
- Request size limits

### Performance Optimizations
- Redis caching for products, categories, search
- Database connection pooling
- Pagination for all list endpoints
- Optimized database queries with includes
- Search result caching

## 🔧 Development

### Available Scripts
```bash
npm run dev              # Start development server
npm run build            # Build for production
npm run start            # Start production server
npm run prisma:generate  # Generate Prisma client
npm run prisma:migrate    # Run database migrations
npm run prisma:seed      # Seed database with sample data
npm run prisma:studio    # Open Prisma Studio
npm run prisma:reset     # Reset database
npm run setup            # Complete setup (generate + migrate + seed)
```

### Environment Variables
See `.env.example` for all available environment variables.

## 🐳 Docker Services

The platform includes these Docker services:
- **API**: Node.js application (port 3001)
- **Database**: PostgreSQL 15 (port 5432)
- **Redis**: Redis 7 (port 6379)
- **Typesense**: Search engine (port 8108)
- **Adminer**: Database management (port 8080)

## 📊 Monitoring & Logging

### Health Check
```bash
curl http://localhost:3001/api/health
```

### Logging
- Structured logging with Winston
- Different log levels for development/production
- Request/response logging
- Error tracking and reporting

## 🔒 Security Considerations

- All passwords are hashed with bcrypt
- JWT tokens have expiration
- Rate limiting prevents abuse
- Input validation prevents injection attacks
- CORS restricts cross-origin requests
- Security headers protect against common attacks

## 🚀 Production Deployment

### Environment Setup
1. Set production environment variables
2. Configure SSL certificates
3. Set up proper CORS origins
4. Configure Stripe webhooks
5. Set up monitoring and logging

### Database
1. Run migrations: `npm run prisma:migrate`
2. Seed initial data if needed: `npm run prisma:seed`
3. Set up database backups

### Scaling
- Use Redis cluster for caching
- Set up database read replicas
- Configure load balancer
- Monitor performance metrics

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests if applicable
5. Submit a pull request

## 📄 License

This project is licensed under the MIT License.

## 🆘 Support

For issues and questions:
1. Check the documentation
2. Search existing issues
3. Create a new issue with details
4. Include environment details and error logs

---

**Built with ❤️ for modern e-commerce development**
