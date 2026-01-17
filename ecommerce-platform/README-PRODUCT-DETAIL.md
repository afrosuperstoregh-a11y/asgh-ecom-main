# E-commerce Product Detail Page

A production-ready e-commerce platform with Next.js frontend and Node.js backend API.

## 🚀 Features

- **Product Detail Page** with complete functionality
- **Responsive Design** - Mobile-first approach
- **Image Gallery** with thumbnails and navigation
- **Variant Selection** (colors, sizes)
- **Reviews & Ratings** system
- **Related Products** carousel
- **Shopping Cart** functionality
- **Wishlist** feature
- **Trust Badges** and security indicators
- **Dockerized** deployment

## 🛠 Tech Stack

### Frontend
- **Next.js 14** (App Router)
- **React 18**
- **Tailwind CSS**
- **Lucide React** (icons)
- **Axios** (API client)

### Backend
- **Node.js**
- **Express.js**
- **CORS** enabled
- **In-memory** JSON data (no database)

### Infrastructure
- **Docker** & **Docker Compose**
- **Production-ready** configuration

## 📁 Project Structure

```
ecommerce-platform/
├── client/                 # Next.js frontend
│   ├── app/
│   │   ├── product/[id]/   # Product detail page
│   │   ├── layout.jsx      # Root layout
│   │   ├── page.jsx        # Homepage
│   │   └── globals.css     # Global styles
│   ├── components/         # React components
│   │   ├── Header.jsx
│   │   ├── Footer.jsx
│   │   ├── ProductGallery.jsx
│   │   ├── ProductInfo.jsx
│   │   ├── VariantSelector.jsx
│   │   ├── Tabs.jsx
│   │   ├── Reviews.jsx
│   │   └── RelatedProducts.jsx
│   ├── services/           # API services
│   │   └── api.js
│   ├── Dockerfile
│   ├── package.json
│   └── tailwind.config.js
├── api/                   # Express.js backend
│   ├── src/
│   │   ├── routes/
│   │   │   └── products.js
│   │   ├── data/
│   │   │   └── products.js
│   │   └── index.js
│   ├── Dockerfile
│   └── package.json
└── docker-compose.yml     # Container orchestration
```

## 🏃‍♂️ Quick Start

### Prerequisites
- Docker and Docker Compose installed
- Node.js 18+ (for local development)

### Using Docker (Recommended)

1. **Clone and navigate to the project:**
   ```bash
   cd ecommerce-platform
   ```

2. **Build and start all services:**
   ```bash
   docker compose up --build
   ```

3. **Access the application:**
   - Frontend: http://localhost:3000
   - API: http://localhost:3001
   - Product Detail: http://localhost:3000/product/1

### Local Development

1. **Start the API:**
   ```bash
   cd api
   npm install
   npm start
   ```

2. **Start the Frontend:**
   ```bash
   cd client
   npm install
   npm run dev
   ```

## 📱 Product Detail Page Features

### Above the Fold
- **Image Gallery** with thumbnail navigation
- **Product Information** (name, brand, SKU, rating)
- **Pricing** with discount badges
- **Stock Status** indicator
- **Variant Selectors** (color, size)
- **Quantity Selector**
- **Action Buttons** (Add to Cart, Buy Now, Wishlist)
- **Trust Badges** (secure checkout, fast shipping)

### Secondary Sections
- **Product Highlights** (bullet points)
- **Tabbed Content:**
  - Description
  - Specifications
  - Shipping & Returns
  - Reviews & Ratings
  - Q&A

### Additional Features
- **Related Products** carousel
- **Recently Viewed** placeholder
- **Breadcrumbs** navigation
- **Mobile-responsive** design

## 🎨 Design Features

- **Mobile-first** responsive design
- **Touch-friendly** interface
- **Accessibility** best practices
- **Loading states** and error handling
- **Smooth transitions** and hover effects
- **Professional** e-commerce layout

## 📊 API Endpoints

### Products
- `GET /api/products` - Get all products
- `GET /api/products/:id` - Get single product with details

### Sample Product Data
The API includes realistic dummy data for:
- Premium Wireless Headphones (ID: 1)
- Organic Cotton T-Shirt (ID: 2)
- Smart Watch Pro (ID: 3)
- And more...

Each product includes:
- Multiple images
- Variants (colors, sizes)
- Reviews and ratings
- Specifications
- Shipping information
- Related products

## 🔧 Configuration

### Environment Variables
- `NODE_ENV` - Environment (development/production)
- `PORT` - API port (default: 3001)

### Docker Configuration
- Frontend runs on port 3000
- API runs on port 3001
- Uses bridge network for container communication

## 📱 Responsive Breakpoints

- **Mobile:** < 768px
- **Tablet:** 768px - 1024px
- **Desktop:** > 1024px

## 🚀 Deployment

The application is production-ready and can be deployed to:
- **Docker containers** (recommended)
- **VPS** with Docker
- **Cloud platforms** (AWS, Google Cloud, Azure)
- **PaaS** (Heroku, Vercel for frontend)

## 📝 Notes

- Uses in-memory JSON data (no database required)
- Images are from Unsplash (placeholder URLs)
- All components are fully functional
- Includes proper error handling and loading states
- Follows React and Next.js best practices

## 🛠 Troubleshooting

### Common Issues

1. **Port conflicts:** Ensure ports 3000 and 3001 are available
2. **Docker build failures:** Check Docker logs for specific errors
3. **API connection:** Verify network connectivity between containers

### Development Tips

- Use browser DevTools to test responsive design
- Check Network tab for API calls
- Use React DevTools for component debugging

---

**Built with ❤️ for modern e-commerce experiences**
