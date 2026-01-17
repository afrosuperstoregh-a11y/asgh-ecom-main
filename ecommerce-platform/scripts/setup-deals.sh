#!/bin/bash

# Deals Page Setup Script
echo "🚀 Setting up Deals Page for E-commerce Platform..."

# Check if Docker is installed
if ! command -v docker &> /dev/null; then
    echo "❌ Docker is not installed. Please install Docker first."
    exit 1
fi

# Check if Docker Compose is installed
if ! command -v docker-compose &> /dev/null; then
    echo "❌ Docker Compose is not installed. Please install Docker Compose first."
    exit 1
fi

# Create necessary directories
echo "📁 Creating directories..."
mkdir -p nginx/ssl
mkdir -p logs/frontend
mkdir -p logs/api

# Generate self-signed SSL certificate for development
echo "🔐 Generating SSL certificate..."
openssl req -x509 -nodes -days 365 -newkey rsa:2048 \
    -keyout nginx/ssl/nginx.key \
    -out nginx/ssl/nginx.crt \
    -subj "/C=US/ST=State/L=City/O=Organization/CN=localhost" 2>/dev/null || \
    echo "⚠️  OpenSSL not found. SSL certificate generation skipped."

# Create Nginx configuration
echo "⚙️  Creating Nginx configuration..."
cat > nginx/nginx.conf << 'EOF'
events {
    worker_connections 1024;
}

http {
    upstream frontend {
        server frontend:3000;
    }

    upstream api {
        server api:5000;
    }

    server {
        listen 80;
        server_name localhost;
        return 301 https://$server_name$request_uri;
    }

    server {
        listen 443 ssl http2;
        server_name localhost;

        ssl_certificate /etc/nginx/ssl/nginx.crt;
        ssl_certificate_key /etc/nginx/ssl/nginx.key;
        ssl_protocols TLSv1.2 TLSv1.3;
        ssl_ciphers HIGH:!aNULL:!MD5;

        # Frontend
        location / {
            proxy_pass http://frontend;
            proxy_set_header Host $host;
            proxy_set_header X-Real-IP $remote_addr;
            proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
            proxy_set_header X-Forwarded-Proto $scheme;
        }

        # API
        location /api/ {
            proxy_pass http://api;
            proxy_set_header Host $host;
            proxy_set_header X-Real-IP $remote_addr;
            proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
            proxy_set_header X-Forwarded-Proto $scheme;
        }

        # Health check
        location /health {
            access_log off;
            return 200 "healthy\n";
            add_header Content-Type text/plain;
        }
    }
}
EOF

# Create environment file
echo "📝 Creating environment file..."
cat > .env.deals << 'EOF'
# Environment Configuration for Deals Page
NODE_ENV=development

# Frontend Configuration
NEXT_PUBLIC_API_URL=http://localhost:5000
NEXT_PUBLIC_SITE_URL=http://localhost:3000
NEXT_PUBLIC_APP_NAME=ShopHub Deals
NEXT_PUBLIC_APP_DESCRIPTION=Amazing deals and discounts on quality products

# API Configuration
API_PORT=5000
DATABASE_URL=postgresql://postgres:password@localhost:5432/ecommerce
REDIS_URL=redis://localhost:6379
JWT_SECRET=your-super-secret-jwt-key-change-in-production

# Stripe Configuration (for payments)
STRIPE_SECRET_KEY=sk_test_your-stripe-secret-key
STRIPE_PUBLISHABLE_KEY=pk_test_your-stripe-publishable-key

# Email Configuration (for notifications)
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=your-email@gmail.com
SMTP_PASS=your-app-password

# Monitoring
LOG_LEVEL=info
ENABLE_METRICS=true
EOF

# Install frontend dependencies
echo "📦 Installing frontend dependencies..."
cd frontend
npm install
cd ..

# Install API dependencies if they exist
if [ -d "api" ]; then
    echo "📦 Installing API dependencies..."
    cd api
    npm install
    cd ..
fi

# Create startup script
echo "🚀 Creating startup script..."
cat > start-deals.sh << 'EOF'
#!/bin/bash

echo "🛍️  Starting ShopHub Deals Platform..."

# Stop any running containers
docker-compose -f docker-compose.deals.yml down

# Build and start services
echo "🔨 Building and starting services..."
docker-compose -f docker-compose.deals.yml up --build -d

# Wait for services to be ready
echo "⏳ Waiting for services to be ready..."
sleep 30

# Check if services are running
echo "🔍 Checking service status..."
docker-compose -f docker-compose.deals.yml ps

# Display URLs
echo ""
echo "✅ Services are ready!"
echo "🌐 Frontend (Deals Page): http://localhost:3000/deals"
echo "🛠️  API: http://localhost:5000"
echo "🔐 HTTPS (via Nginx): https://localhost/deals"
echo ""
echo "📊 To view logs:"
echo "  docker-compose -f docker-compose.deals.yml logs -f frontend"
echo "  docker-compose -f docker-compose.deals.yml logs -f api"
echo ""
echo "🛑 To stop services:"
echo "  docker-compose -f docker-compose.deals.yml down"
EOF

chmod +x start-deals.sh

# Create development script
echo "🔧 Creating development script..."
cat > dev-deals.sh << 'EOF'
#!/bin/bash

echo "🔧 Starting development environment..."

# Start only frontend in development mode
cd frontend
npm run dev
EOF

chmod +x dev-deals.sh

echo ""
echo "✅ Setup complete!"
echo ""
echo "🚀 To start the Deals Page platform:"
echo "  ./start-deals.sh"
echo ""
echo "🔧 For development only (frontend):"
echo "  ./dev-deals.sh"
echo ""
echo "📁 Files created:"
echo "  - frontend/src/app/deals/page.tsx (Main deals page)"
echo "  - frontend/src/components/DealsHero.tsx (Hero section)"
echo "  - frontend/src/components/DealsFilterBar.tsx (Filter/sort bar)"
echo "  - frontend/src/components/DealProductCard.tsx (Product card)"
echo "  - frontend/src/data/deals.json (Dummy deals data)"
echo "  - docker-compose.deals.yml (Docker configuration)"
echo "  - nginx/nginx.conf (Nginx configuration)"
echo "  - .env.deals (Environment variables)"
echo ""
echo "🛍️  Features included:"
echo "  ✅ Responsive design"
echo "  ✅ Hero section with stats"
echo "  ✅ Advanced filtering and sorting"
echo "  ✅ Grid/List view toggle"
echo "  ✅ Product cards with deal badges"
echo "  ✅ Search functionality"
echo "  ✅ Stock indicators"
echo "  ✅ Deal countdown timers"
echo "  ✅ Newsletter signup"
echo "  ✅ Docker setup"
echo ""
echo "🎯 Access the deals page at: http://localhost:3000/deals"
