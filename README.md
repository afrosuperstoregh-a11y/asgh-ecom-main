# Afro Superstore E-commerce Platform

A modern, full-stack e-commerce platform built with Next.js and Node.js, celebrating African culture and heritage.

## 🏗️ Architecture

### Backend (Node.js + Express)
- **Framework**: Express.js
- **Database**: PostgreSQL via Supabase
- **Authentication**: JWT + Supabase Auth
- **File Storage**: Supabase Storage
- **Payment**: Stripe Integration
- **Email**: SendGrid

### Frontend (Next.js)
- **Framework**: Next.js 14 with App Router
- **Styling**: Tailwind CSS
- **State Management**: Zustand
- **Data Fetching**: React Query + Axios
- **UI Components**: Headless UI + Heroicons

## 📁 Project Structure

```
asca_ecom-main/
├── backend/
│   └── src/
│       ├── config/          # Configuration files
│       ├── controllers/     # Route controllers
│       ├── middleware/      # Express middleware
│       ├── routes/          # API routes
│       ├── services/        # Business logic
│       ├── utils/           # Utility functions
│       └── server.js        # Server entry point
├── frontend/
│   ├── app/                # Next.js app directory
│   ├── components/         # React components
│   ├── lib/                # Libraries and configurations
│   ├── hooks/              # Custom React hooks
│   ├── services/           # API services
│   ├── store/              # State management
│   └── styles/             # Global styles
└── database/
    └── migrations/         # Database migrations
```

## 🚀 Quick Start

### Prerequisites
- Node.js 20+
- PostgreSQL (via Supabase)
- Redis (optional, for caching)

### Environment Setup

1. **Backend Environment** (`.env`):
```env
# Server
PORT=3001
NODE_ENV=development

# Supabase
SUPABASE_URL=your_supabase_url
SUPABASE_ANON_KEY=your_supabase_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key

# JWT
JWT_SECRET=your_jwt_secret
JWT_EXPIRES_IN=7d

# Stripe
STRIPE_SECRET_KEY=your_stripe_secret_key
STRIPE_PUBLISHABLE_KEY=your_stripe_publishable_key
STRIPE_WEBHOOK_SECRET=your_webhook_secret

# Email
EMAIL_PROVIDER=sendgrid
EMAIL_API_KEY=your_sendgrid_api_key
FROM_EMAIL=noreply@afrosuperstore.ca

# Frontend URL
FRONTEND_URL=http://localhost:3000
```

2. **Frontend Environment** (`.env.local`):
```env
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
NEXT_PUBLIC_API_URL=http://localhost:3001/api
```

### Installation

1. **Install Backend Dependencies**:
```bash
cd backend
npm install
```

2. **Install Frontend Dependencies**:
```bash
cd frontend
npm install
```

### Running the Application

1. **Start Backend**:
```bash
cd backend
npm run dev
```

2. **Start Frontend**:
```bash
cd frontend
npm run dev
```

The application will be available at:
- Frontend: http://localhost:3000
- Backend API: http://localhost:3001

## 🛠️ Development

### Code Standards

- **Files**: camelCase
- **React Components**: PascalCase
- **API Routes**: kebab-case
- **Database Functions**: snake_case

### API Endpoints

#### Authentication
- `POST /api/auth/login` - User login
- `POST /api/auth/register` - User registration
- `POST /api/auth/logout` - User logout

#### Products
- `GET /api/products` - List products
- `GET /api/products/:id` - Get product details
- `POST /api/products` - Create product (admin)
- `PUT /api/products/:id` - Update product (admin)
- `DELETE /api/products/:id` - Delete product (admin)

#### Orders
- `GET /api/orders` - List user orders
- `GET /api/orders/:id` - Get order details
- `POST /api/orders` - Create order
- `PATCH /api/orders/:id/status` - Update order status

#### Users
- `GET /api/users/profile` - Get user profile
- `PUT /api/users/profile` - Update profile
- `GET /api/users/addresses` - Get user addresses
- `POST /api/users/addresses` - Add address

## 🗄️ Database

The project uses Supabase for database management. Key tables:

- `users` - User accounts and profiles
- `products` - Product catalog
- `categories` - Product categories
- `orders` - Customer orders
- `order_items` - Order line items
- `addresses` - Shipping addresses

## 🔧 Configuration

All configuration is centralized in:
- Backend: `backend/src/config/env.js`
- Frontend: `frontend/lib/supabase.ts`

## 📦 Deployment

### Backend Deployment
1. Set production environment variables
2. Run `npm run build`
3. Deploy to your preferred hosting platform

### Frontend Deployment
1. Set production environment variables
2. Run `npm run build`
3. Deploy to Vercel, Netlify, or similar

## 🧪 Testing

```bash
# Backend tests
cd backend
npm test

# Frontend tests
cd frontend
npm test
```

## 📝 Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests if applicable
5. Submit a pull request

## 📄 License

This project is licensed under the MIT License.

## 🤝 Support

For support and questions:
- Email: support@afrosuperstore.ca
- Documentation: Check the `/docs` folder
- Issues: Create an issue on GitHub

---

Built with ❤️ for the Afro Superstore community
