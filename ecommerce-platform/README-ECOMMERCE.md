# E-commerce Homepage Platform

A fully responsive e-commerce homepage built with Next.js, React, and Tailwind CSS, running in Docker containers.

## 🚀 Quick Start

```bash
docker compose up --build
```

The application will be available at:
- **Frontend**: http://localhost:3000
- **API**: http://localhost:3001

## 📱 Features

### Frontend (Next.js + React + Tailwind CSS)
- **Responsive Design**: Mobile-first approach with hamburger menu
- **Component Architecture**: Modular React components
- **Modern UI**: Clean, professional design with Tailwind CSS
- **Interactive Elements**: Functional buttons, forms, and navigation

### Homepage Sections
1. **Header/Navigation**: Logo, navigation links, search, cart icon
2. **Hero Section**: Marketing headline with CTA buttons
3. **Trust Bar**: Reviews, shipping, security, returns info
4. **Featured Categories**: Dynamic category cards from API
5. **Product Grid**: Best sellers with ratings and add-to-cart
6. **Promo Banner**: Sale announcements
7. **Why Choose Us**: Value propositions
8. **Testimonials**: Customer reviews with avatars
9. **Newsletter**: Email subscription form
10. **Footer**: Links, contact info, payment methods

### Backend (Express.js API)
- **RESTful API**: Clean JSON endpoints
- **CORS Enabled**: Cross-origin requests supported
- **Dummy Data**: No database required
- **Error Handling**: Proper HTTP status codes

### API Endpoints
- `GET /api/products` - Returns product catalog
- `GET /api/categories` - Returns category data
- `GET /api/testimonials` - Returns customer reviews
- `GET /health` - Health check endpoint

## 🛠️ Technology Stack

### Frontend
- **Next.js 16** - React framework
- **React 19** - UI library
- **Tailwind CSS** - Utility-first CSS framework
- **Lucide React** - Icon library
- **TypeScript** - Type safety

### Backend
- **Node.js 20** - Runtime environment
- **Express.js** - Web framework
- **CORS** - Cross-origin resource sharing
- **JavaScript** - API logic

### Infrastructure
- **Docker** - Containerization
- **Docker Compose** - Multi-container orchestration
- **Alpine Linux** - Lightweight base images

## 📁 Project Structure

```
ecommerce-platform/
├── frontend/                 # Next.js frontend application
│   ├── src/
│   │   ├── components/        # React components
│   │   │   ├── Header.tsx
│   │   │   ├── Hero.tsx
│   │   │   ├── TrustBar.tsx
│   │   │   ├── Categories.tsx
│   │   │   ├── ProductGrid.tsx
│   │   │   ├── PromoBanner.tsx
│   │   │   ├── WhyChooseUs.tsx
│   │   │   ├── Testimonials.tsx
│   │   │   ├── Newsletter.tsx
│   │   │   └── Footer.tsx
│   │   └── app/
│   │       ├── page.tsx       # Main homepage
│   │       └── globals.css    # Global styles
│   ├── package.json
│   └── Dockerfile
├── api/                     # Express.js backend API
│   ├── src/
│   │   ├── data/            # Dummy data files
│   │   │   ├── products.js
│   │   │   ├── categories.js
│   │   │   └── testimonials.js
│   │   ├── routes/          # API route handlers
│   │   │   ├── products.js
│   │   │   ├── categories.js
│   │   │   └── testimonials.js
│   │   └── index.js        # Express server setup
│   ├── package.json
│   └── Dockerfile
└── docker-compose.yml        # Container orchestration
```

## 🎨 Design Features

### Responsive Behavior
- **Mobile (< 768px)**: Single column layout, hamburger menu
- **Tablet (768px - 1024px)**: Two-column product grid
- **Desktop (> 1024px)**: Full multi-column layout

### Interactive Elements
- **Hover Effects**: Smooth transitions on cards and buttons
- **Loading States**: Skeleton loaders while fetching data
- **Form Validation**: Newsletter subscription with feedback
- **Cart Counter**: Visual indicator for cart items

### Accessibility
- **Semantic HTML**: Proper heading hierarchy
- **ARIA Labels**: Screen reader friendly
- **Keyboard Navigation**: Tab order and focus states
- **Color Contrast**: WCAG compliant color schemes

## 🔧 Development

### Environment Variables
- `NEXT_PUBLIC_API_URL=http://api:3001` - Frontend API endpoint
- `NODE_ENV=development` - Development mode

### Available Scripts
```bash
# Frontend
npm run dev          # Start development server
npm run build        # Build for production
npm run start        # Start production server

# Backend
npm run dev          # Start API server
npm run start        # Start production API server
```

## 📊 Data Structure

### Products
```json
{
  "id": 1,
  "name": "Product Name",
  "price": 99.99,
  "description": "Product description",
  "image": "https://example.com/image.jpg",
  "category": "Category Name",
  "rating": 4.5,
  "reviews": 128
}
```

### Categories
```json
{
  "id": 1,
  "name": "Category Name",
  "description": "Category description",
  "image": "https://example.com/image.jpg",
  "productCount": 245
}
```

### Testimonials
```json
{
  "id": 1,
  "name": "Customer Name",
  "rating": 5,
  "comment": "Customer review",
  "location": "City, State",
  "avatar": "https://example.com/avatar.jpg"
}
```

## 🚀 Deployment

### Production Build
```bash
docker compose -f docker-compose.yml -f docker-compose.prod.yml up --build
```

### Environment Setup
1. **Development**: Uses hot reload and verbose logging
2. **Production**: Optimized builds and minimal logging
3. **Staging**: Production-like environment for testing

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Test thoroughly
5. Submit a pull request

## 📝 License

This project is licensed under the MIT License.

## 🙏 Acknowledgments

- **Unsplash** - For high-quality placeholder images
- **Lucide Icons** - For beautiful icon sets
- **Tailwind CSS** - For utility-first CSS framework
- **Next.js Team** - For the excellent React framework
