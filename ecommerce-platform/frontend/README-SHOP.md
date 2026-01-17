# ShopHub E-Commerce Platform

A complete, responsive e-commerce shop page built with Next.js, React, and Tailwind CSS, running entirely inside a Docker container.

## 🚀 Features

### Core Functionality
- **Product Listing Page** with advanced filtering and sorting
- **Responsive Design** - Mobile-first approach with desktop optimization
- **Search Functionality** - Real-time product search
- **Advanced Filtering** - Category, price, brand, size, color, rating, availability
- **Sorting Options** - Featured, new arrivals, price, rating, name
- **Pagination** - Efficient navigation through large product catalogs

### UI/UX Features
- **Product Cards** with hover effects, image swap, ratings, and quick actions
- **Mobile Filter Drawer** - Optimized mobile filtering experience
- **Desktop Filter Sidebar** - Persistent filtering on larger screens
- **Wishlist & Cart** - Interactive buttons with count badges
- **Loading States** - Skeleton loaders for better perceived performance
- **Empty States** - User-friendly messages when no products are found

### Technical Features
- **Next.js App Router** - Modern React framework with server-side rendering
- **TypeScript** - Type-safe development
- **Tailwind CSS** - Utility-first styling
- **Mock API** - Realistic product data with filtering/sorting endpoints
- **Docker Support** - Containerized deployment ready

## 📁 Project Structure

```
frontend/
├── src/
│   ├── app/
│   │   ├── api/products/route.ts    # Products API endpoint
│   │   ├── layout.tsx               # Root layout with Header/Footer
│   │   ├── page.tsx                 # Home page
│   │   └── shop/page.tsx            # Main shop page
│   ├── components/
│   │   ├── Header.tsx               # Navigation header
│   │   ├── Footer.tsx               # Site footer
│   │   ├── ProductCard.tsx          # Product display card
│   │   ├── FilterSidebar.tsx        # Desktop filters
│   │   ├── MobileFilterDrawer.tsx   # Mobile filters
│   │   ├── SortBar.tsx              # Sorting controls
│   │   └── Pagination.tsx           # Page navigation
│   └── data/
│       └── products.ts               # Mock product data
├── Dockerfile                       # Docker configuration
├── package.json                     # Dependencies
└── README-SHOP.md                   # This file
```

## 🛠 Tech Stack

- **Frontend**: Next.js 16, React 19, TypeScript
- **Styling**: Tailwind CSS 4
- **Icons**: Lucide React
- **Runtime**: Node.js 18 (Alpine Linux for Docker)

## 🚀 Quick Start

### Local Development

1. **Install Dependencies**
   ```bash
   npm install
   ```

2. **Run Development Server**
   ```bash
   npm run dev
   ```

3. **Open Browser**
   Navigate to [http://localhost:3000](http://localhost:3000)

### Docker Deployment

1. **Build Docker Image**
   ```bash
   docker build -t ecommerce-frontend .
   ```

2. **Run Container**
   ```bash
   docker run -p 3000:3000 ecommerce-frontend
   ```

3. **Access Application**
   Navigate to [http://localhost:3000](http://localhost:3000)

## 📱 Responsive Design

### Mobile (< 768px)
- Filter drawer modal
- 2-column product grid
- Sticky sort/filter bar
- Optimized touch interactions

### Desktop (≥ 1024px)
- Persistent sidebar filters
- 4-column product grid
- Hover states and transitions
- Enhanced visual effects

## 🎯 Key Components

### ProductCard Component
- **Image Gallery**: Hover image swap with smooth transitions
- **Product Info**: Name, brand, price, ratings
- **Interactive Elements**: Color swatches, size selection
- **Actions**: Add to cart, wishlist toggle
- **Badges**: New, sale, out of stock indicators

### Filter System
- **Categories**: Dynamic category filtering with product counts
- **Price Range**: Min/max price inputs
- **Brand Filter**: Checkbox selection
- **Color Swatches**: Visual color selection
- **Size Options**: Interactive size buttons
- **Rating Filter**: Star-based rating selection
- **Availability**: Stock and sale filters

### API Integration
- **Endpoint**: `/api/products`
- **Query Parameters**: All filters and sorting options
- **Response**: Paginated product data with metadata
- **Error Handling**: Graceful fallbacks and user feedback

## 🎨 Design Features

### Visual Effects
- **Smooth Transitions**: Hover states, filter animations
- **Loading States**: Skeleton loaders during data fetching
- **Micro-interactions**: Button feedback, card hover effects
- **Responsive Images**: Optimized product images

### Accessibility
- **Semantic HTML**: Proper heading hierarchy and landmarks
- **Keyboard Navigation**: Full keyboard accessibility
- **Screen Reader Support**: ARIA labels and descriptions
- **Focus Management**: Logical tab order and focus indicators

## 📊 Mock Data

The application includes 12 realistic products with:
- **Variety**: Clothing, footwear, electronics, accessories
- **Attributes**: Multiple colors, sizes, price ranges
- **Metadata**: Ratings, reviews, brand information
- **Tags**: New arrival, sale indicators
- **Images**: High-quality placeholder images

## 🔧 Configuration

### Environment Variables
No environment variables required for basic functionality.

### Next.js Configuration
- **Standalone Output**: Optimized for Docker deployment
- **React Compiler**: Enabled for performance
- **TypeScript**: Strict mode enabled

## 🚀 Deployment

### Production Build
```bash
npm run build
npm start
```

### Docker Production
```bash
# Build optimized image
docker build -t ecommerce-frontend:prod .

# Run with production settings
docker run -p 3000:3000 -e NODE_ENV=production ecommerce-frontend:prod
```

## 🧪 Testing

The application has been tested with:
- **Build Process**: Successful production builds
- **Development**: Hot reload and error handling
- **Responsive Design**: Multiple screen sizes
- **Functionality**: All filters, sorting, and interactions

## 📈 Performance

- **Bundle Size**: Optimized with Next.js automatic code splitting
- **Image Optimization**: Next.js Image component usage
- **Loading Performance**: Skeleton loaders and progressive enhancement
- **SEO**: Proper meta tags and semantic structure

## 🤝 Contributing

This is a demonstration project showcasing modern e-commerce development practices. The codebase is clean, well-documented, and ready for extension.

## 📄 License

This project is for educational and demonstration purposes.

---

**Built with ❤️ using Next.js, React, and Tailwind CSS**
