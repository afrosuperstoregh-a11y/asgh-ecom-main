# E-commerce Frontend

A modern, responsive e-commerce frontend built with Next.js, React, Tailwind CSS, and Docker.

## 🚀 Features

- **Modern Stack**: Next.js 16, React 19, TypeScript, Tailwind CSS 4
- **Responsive Design**: Mobile-first approach with Tailwind CSS
- **Product Catalog**: Grid layout with filtering and sorting
- **Interactive Components**: Hero section, product cards, filter bar
- **Performance Optimized**: Image optimization, lazy loading, code splitting
- **Docker Ready**: Production-ready Docker configuration
- **Accessible**: Semantic HTML and ARIA labels

## 📁 Project Structure

```
frontend/
├── src/
│   ├── app/
│   │   ├── about/
│   │   │   └── page.tsx          # About page with product grid
│   │   └── layout.tsx            # Root layout
│   ├── components/
│   │   ├── about/
│   │   │   ├── HeroSection.tsx    # Hero banner component
│   │   │   ├── FilterSortBar.tsx  # Filter and sort controls
│   │   │   ├── ProductCard.tsx    # Individual product card
│   │   │   └── ProductGrid.tsx    # Product grid container
│   │   └── ui/
│   │       └── Button.tsx         # Reusable button component
│   └── data/
│       └── products.ts            # Dummy product data
├── Dockerfile                     # Multi-stage Docker build
├── package.json                   # Dependencies and scripts
├── tailwind.config.ts             # Tailwind CSS configuration
└── tsconfig.json                  # TypeScript configuration
```

## 🛠️ Tech Stack

- **Framework**: Next.js 16 with App Router
- **Language**: TypeScript
- **Styling**: Tailwind CSS 4
- **Icons**: Lucide React
- **Container**: Docker with multi-stage builds
- **Package Manager**: npm

## 🚦 Quick Start

### Prerequisites

- Node.js 18+ 
- Docker & Docker Compose
- npm or yarn

### Using Docker (Recommended)

1. **Clone and setup**:
   ```bash
   git clone <repository-url>
   cd ecommerce-platform
   chmod +x scripts/setup-frontend.sh
   ./scripts/setup-frontend.sh
   ```

2. **Visit the application**:
   - Frontend: http://localhost:3000
   - About Page: http://localhost:3000/about

3. **Development commands**:
   ```bash
   # Start frontend
   docker-compose -f docker-compose.frontend.yml up -d frontend
   
   # View logs
   docker-compose -f docker-compose.frontend.yml logs -f frontend
   
   # Stop services
   docker-compose -f docker-compose.frontend.yml down
   ```

### Local Development

1. **Install dependencies**:
   ```bash
   cd frontend
   npm install
   ```

2. **Run development server**:
   ```bash
   npm run dev
   ```

3. **Build for production**:
   ```bash
   npm run build
   npm start
   ```

## 📄 About Page Features

The About page (`/about`) includes:

### Hero Section
- Eye-catching banner with call-to-action
- Responsive design with overlay for text readability
- Customizable title, subtitle, and background image

### Filter & Sort Bar
- **Category Filtering**: Filter products by category (All, Clothing, Footwear, etc.)
- **Sorting Options**: 
  - Featured (default)
  - Price: Low to High / High to Low
  - Name: A to Z / Z to A
  - Highest Rated
- **Responsive Design**: Mobile-friendly with dropdown menus

### Product Grid
- **Responsive Layout**: 1-4 columns based on screen size
- **Product Cards** with:
  - Product images with hover effects
  - Discount badges and out-of-stock indicators
  - Product name, brand, and category
  - Star ratings with review count
  - Original and discounted prices
  - Color swatches
  - "Buy Now" button with stock status
- **Loading States**: Skeleton loaders during data fetching
- **Empty States**: Friendly message when no products found

### Features Section
- Why Shop With Us section
- Fast shipping, quality guarantee, 24/7 support
- Icon-based presentation

## 🎨 Styling & Design

- **Design System**: Consistent spacing, colors, and typography
- **Responsive Breakpoints**:
  - Mobile: < 640px
  - Tablet: 640px - 1024px  
  - Desktop: 1024px - 1280px
  - Large Desktop: > 1280px
- **Color Palette**: Blue primary, gray neutrals, semantic colors
- **Typography**: System fonts with proper hierarchy
- **Animations**: Smooth transitions and hover effects

## 📦 Dummy Data

The frontend uses dummy product data from `src/data/products.ts`:

```typescript
interface Product {
  id: string;
  name: string;
  brand: string;
  category: string;
  price: number;
  discountPrice?: number;
  rating: number;
  reviewCount: number;
  colors: string[];
  sizes: string[];
  images: string[];
  inStock: boolean;
  tags: string[];
  description: string;
}
```

Includes 12 sample products across categories like clothing, footwear, electronics, and accessories.

## 🐳 Docker Configuration

### Multi-stage Build
- **Base**: Node.js Alpine image
- **Deps**: Install dependencies
- **Builder**: Build application
- **Runner**: Production runtime

### Production Features
- **Nginx Proxy**: Optional Nginx with SSL termination
- **Security Headers**: XSS protection, content security policy
- **Rate Limiting**: API and general request limiting
- **Gzip Compression**: Automatic compression for text assets
- **Static File Caching**: Long-term caching for assets

### Environment Variables
```bash
NODE_ENV=production
NEXT_PUBLIC_API_URL=http://localhost:8000
NEXT_PUBLIC_SITE_URL=http://localhost:3000
```

## 🔧 Configuration Files

- **Dockerfile**: Multi-stage build for production
- **docker-compose.frontend.yml**: Development and production setup
- **nginx/frontend.conf**: Nginx configuration with security
- **tailwind.config.ts**: Tailwind CSS customization
- **tsconfig.json**: TypeScript configuration

## 🚀 Performance Optimizations

- **Code Splitting**: Automatic route-based splitting
- **Image Optimization**: Next.js Image component with lazy loading
- **Static Generation**: Pre-rendered pages where possible
- **Bundle Analysis**: Optimized dependencies
- **Caching Strategy**: Browser and CDN caching headers

## 🔒 Security Features

- **Content Security Policy**: Prevents XSS attacks
- **XSS Protection**: Browser XSS filters
- **Frame Options**: Prevents clickjacking
- **Rate Limiting**: API abuse prevention
- **HTTPS Ready**: SSL/TLS configuration included

## 📱 Responsive Design

The application is fully responsive with:

- **Mobile (< 640px)**: Single column, touch-friendly controls
- **Tablet (640px - 1024px)**: 2-3 column grid, adapted navigation
- **Desktop (1024px+)**: 4 column grid, full feature set

## 🧪 Testing & Quality

- **TypeScript**: Type safety throughout the application
- **ESLint**: Code quality and consistency
- **Responsive Testing**: Mobile-first development approach
- **Accessibility**: Semantic HTML and ARIA labels

## 📈 Monitoring & Analytics

Ready for integration with:
- Google Analytics
- Performance monitoring
- Error tracking
- User behavior analytics

## 🔄 CI/CD Ready

The Docker configuration is designed for:
- Automated builds
- Multi-stage deployments
- Environment-specific configurations
- Health checks and monitoring

## 🤝 Contributing

1. Follow the existing code style
2. Use TypeScript for all new components
3. Ensure responsive design
4. Test on multiple screen sizes
5. Update documentation as needed

## 📞 Support

For issues and questions:
- Check the Docker logs: `docker-compose logs frontend`
- Verify environment variables in `.env.frontend`
- Ensure all dependencies are installed
- Check network connectivity for API calls

---

Built with ❤️ using Next.js, React, Tailwind CSS, and Docker
