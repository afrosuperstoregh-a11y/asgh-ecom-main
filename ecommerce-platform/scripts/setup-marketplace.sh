#!/bin/bash

# Multi-Vendor Marketplace Setup Script
# This script sets up the complete marketplace infrastructure

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Function to print colored output
print_status() {
    echo -e "${GREEN}[INFO]${NC} $1"
}

print_warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1"
}

print_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

print_header() {
    echo -e "${BLUE}================================${NC}"
    echo -e "${BLUE}$1${NC}"
    echo -e "${BLUE}================================${NC}"
}

# Check if Docker is installed
check_docker() {
    if ! command -v docker &> /dev/null; then
        print_error "Docker is not installed. Please install Docker first."
        exit 1
    fi
    
    if ! command -v docker-compose &> /dev/null; then
        print_error "Docker Compose is not installed. Please install Docker Compose first."
        exit 1
    fi
    
    print_status "Docker and Docker Compose are installed"
}

# Create necessary directories
create_directories() {
    print_status "Creating necessary directories..."
    
    mkdir -p uploads/products
    mkdir -p uploads/vendors
    mkdir -p uploads/documents
    mkdir -p logs
    mkdir -p nginx/ssl
    mkdir -p monitoring/grafana/dashboards
    mkdir -p monitoring/grafana/datasources
    mkdir -p services/vendor-service
    mkdir -p services/payout-service
    mkdir -p services/search-service
    mkdir -p services/job-processor
    
    # Set permissions
    chmod 755 uploads
    chmod 755 services
    
    print_status "Directories created successfully"
}

# Setup environment files
setup_environment() {
    print_status "Setting up environment files..."
    
    if [ ! -f .env ]; then
        cp .env.marketplace.example .env
        print_warning "Created .env file from template. Please review and update the configuration."
    else
        print_warning ".env file already exists. Skipping environment setup."
    fi
    
    # Generate SSL certificates for development
    if [ ! -f nginx/ssl/cert.pem ]; then
        print_status "Generating development SSL certificates..."
        openssl req -x509 -newkey rsa:4096 -keyout nginx/ssl/key.pem -out nginx/ssl/cert.pem -days 365 -nodes -subj "/C=US/ST=State/L=City/O=Organization/CN=localhost"
        print_status "SSL certificates generated for development"
    fi
}

# Setup microservices
setup_microservices() {
    print_status "Setting up microservices..."
    
    # Vendor Service
    cat > services/vendor-service/package.json << 'EOF'
{
  "name": "vendor-service",
  "version": "1.0.0",
  "description": "Vendor Management Microservice",
  "main": "src/index.js",
  "scripts": {
    "start": "node src/index.js",
    "dev": "nodemon src/index.js"
  },
  "dependencies": {
    "express": "^4.18.2",
    "prisma": "^5.0.0",
    "@prisma/client": "^5.0.0",
    "redis": "^4.6.0",
    "elasticsearch": "^16.7.3",
    "stripe": "^14.0.0",
    "@sendgrid/mail": "^7.7.0",
    "jsonwebtoken": "^9.0.0",
    "bcryptjs": "^2.4.3",
    "zod": "^3.22.0",
    "cors": "^2.8.5",
    "helmet": "^7.0.0",
    "morgan": "^1.10.0"
  },
  "devDependencies": {
    "nodemon": "^3.0.0"
  }
}
EOF

    # Payout Service
    cat > services/payout-service/package.json << 'EOF'
{
  "name": "payout-service",
  "version": "1.0.0",
  "description": "Payout Processing Microservice",
  "main": "src/index.js",
  "scripts": {
    "start": "node src/index.js",
    "dev": "nodemon src/index.js"
  },
  "dependencies": {
    "express": "^4.18.2",
    "prisma": "^5.0.0",
    "@prisma/client": "^5.0.0",
    "redis": "^4.6.0",
    "stripe": "^14.0.0",
    "jsonwebtoken": "^9.0.0",
    "zod": "^3.22.0",
    "cors": "^2.8.5",
    "helmet": "^7.0.0",
    "morgan": "^1.10.0"
  },
  "devDependencies": {
    "nodemon": "^3.0.0"
  }
}
EOF

    # Search Service
    cat > services/search-service/package.json << 'EOF'
{
  "name": "search-service",
  "version": "1.0.0",
  "description": "Search Indexing Microservice",
  "main": "src/index.js",
  "scripts": {
    "start": "node src/index.js",
    "dev": "nodemon src/index.js"
  },
  "dependencies": {
    "express": "^4.18.2",
    "prisma": "^5.0.0",
    "@prisma/client": "^5.0.0",
    "redis": "^4.6.0",
    "elasticsearch": "^16.7.3",
    "zod": "^3.22.0",
    "cors": "^2.8.5",
    "helmet": "^7.0.0",
    "morgan": "^1.10.0"
  },
  "devDependencies": {
    "nodemon": "^3.0.0"
  }
}
EOF

    # Job Processor
    cat > services/job-processor/package.json << 'EOF'
{
  "name": "job-processor",
  "version": "1.0.0",
  "description": "Background Job Processor",
  "main": "src/index.js",
  "scripts": {
    "start": "node src/index.js",
    "dev": "nodemon src/index.js"
  },
  "dependencies": {
    "bull": "^4.11.0",
    "prisma": "^5.0.0",
    "@prisma/client": "^5.0.0",
    "redis": "^4.6.0",
    "elasticsearch": "^16.7.3",
    "stripe": "^14.0.0",
    "@sendgrid/mail": "^7.7.0",
    "jsonwebtoken": "^9.0.0",
    "zod": "^3.22.0"
  },
  "devDependencies": {
    "nodemon": "^3.0.0"
  }
}
EOF

    print_status "Microservices setup completed"
}

# Setup Nginx configuration
setup_nginx() {
    print_status "Setting up Nginx configuration..."
    
    cat > nginx/marketplace.conf << 'EOF'
events {
    worker_connections 1024;
}

http {
    upstream api_backend {
        server api:3000;
    }
    
    upstream client_backend {
        server client:3000;
    }

    # Rate limiting
    limit_req_zone $binary_remote_addr zone=api:10m rate=10r/s;
    limit_req_zone $binary_remote_addr zone=login:10m rate=1r/s;

    server {
        listen 80;
        server_name localhost;

        # Security headers
        add_header X-Frame-Options "SAMEORIGIN" always;
        add_header X-Content-Type-Options "nosniff" always;
        add_header X-XSS-Protection "1; mode=block" always;
        add_header Referrer-Policy "strict-origin-when-cross-origin" always;

        # API routes
        location /api/ {
            limit_req zone=api burst=20 nodelay;
            proxy_pass http://api_backend;
            proxy_set_header Host $host;
            proxy_set_header X-Real-IP $remote_addr;
            proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
            proxy_set_header X-Forwarded-Proto $scheme;
        }

        # Login endpoints with stricter rate limiting
        location /api/auth/login {
            limit_req zone=login burst=5 nodelay;
            proxy_pass http://api_backend;
            proxy_set_header Host $host;
            proxy_set_header X-Real-IP $remote_addr;
            proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
            proxy_set_header X-Forwarded-Proto $scheme;
        }

        # Client application
        location / {
            proxy_pass http://client_backend;
            proxy_set_header Host $host;
            proxy_set_header X-Real-IP $remote_addr;
            proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
            proxy_set_header X-Forwarded-Proto $scheme;
        }

        # File uploads
        location /uploads/ {
            alias /app/uploads/;
            expires 1y;
            add_header Cache-Control "public, immutable";
        }
    }

    # HTTPS configuration (for production)
    server {
        listen 443 ssl http2;
        server_name localhost;

        ssl_certificate /etc/nginx/ssl/cert.pem;
        ssl_certificate_key /etc/nginx/ssl/key.pem;
        ssl_protocols TLSv1.2 TLSv1.3;
        ssl_ciphers ECDHE-RSA-AES256-GCM-SHA512:DHE-RSA-AES256-GCM-SHA512:ECDHE-RSA-AES256-GCM-SHA384:DHE-RSA-AES256-GCM-SHA384;
        ssl_prefer_server_ciphers off;

        # Same configuration as HTTP
        location /api/ {
            limit_req zone=api burst=20 nodelay;
            proxy_pass http://api_backend;
            proxy_set_header Host $host;
            proxy_set_header X-Real-IP $remote_addr;
            proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
            proxy_set_header X-Forwarded-Proto $scheme;
        }

        location / {
            proxy_pass http://client_backend;
            proxy_set_header Host $host;
            proxy_set_header X-Real-IP $remote_addr;
            proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
            proxy_set_header X-Forwarded-Proto $scheme;
        }
    }
}
EOF

    print_status "Nginx configuration completed"
}

# Setup monitoring
setup_monitoring() {
    print_status "Setting up monitoring configuration..."
    
    # Prometheus configuration
    cat > monitoring/prometheus.yml << 'EOF'
global:
  scrape_interval: 15s
  evaluation_interval: 15s

rule_files:
  - "rules/*.yml"

scrape_configs:
  - job_name: 'marketplace-api'
    static_configs:
      - targets: ['api:3000']
    metrics_path: '/api/metrics'
    
  - job_name: 'vendor-service'
    static_configs:
      - targets: ['vendor-service:3001']
    metrics_path: '/metrics'
    
  - job_name: 'payout-service'
    static_configs:
      - targets: ['payout-service:3002']
    metrics_path: '/metrics'
    
  - job_name: 'search-service'
    static_configs:
      - targets: ['search-service:3003']
    metrics_path: '/metrics'
    
  - job_name: 'postgres'
    static_configs:
      - targets: ['postgres:5432']
      
  - job_name: 'redis'
    static_configs:
      - targets: ['redis:6379']
      
  - job_name: 'elasticsearch'
    static_configs:
      - targets: ['elasticsearch:9200']
EOF

    # Grafana datasource configuration
    mkdir -p monitoring/grafana/datasources
    cat > monitoring/grafana/datasources/prometheus.yml << 'EOF'
apiVersion: 1

datasources:
  - name: Prometheus
    type: prometheus
    access: proxy
    url: http://prometheus:9090
    isDefault: true
EOF

    print_status "Monitoring configuration completed"
}

# Database setup
setup_database() {
    print_status "Setting up database..."
    
    # Wait for database to be ready
    print_status "Waiting for database to be ready..."
    sleep 10
    
    # Run database migrations
    docker-compose -f docker-compose.marketplace.yml exec -T api npx prisma migrate deploy
    docker-compose -f docker-compose.marketplace.yml exec -T api npx prisma generate
    
    # Seed database with initial data
    if [ -f api/prisma/seed.ts ]; then
        docker-compose -f docker-compose.marketplace.yml exec -T api npx tsx api/prisma/seed.ts
        print_status "Database seeded successfully"
    fi
    
    print_status "Database setup completed"
}

# Start services
start_services() {
    print_status "Starting marketplace services..."
    
    # Start core services first
    docker-compose -f docker-compose.marketplace.yml up -d postgres redis elasticsearch
    
    # Wait for core services
    print_status "Waiting for core services to be ready..."
    sleep 30
    
    # Start application services
    docker-compose -f docker-compose.marketplace.yml up -d api vendor-service payout-service search-service job-processor
    
    # Wait for application services
    print_status "Waiting for application services to be ready..."
    sleep 20
    
    # Start client and load balancer
    docker-compose -f docker-compose.marketplace.yml up -d client nginx
    
    # Start monitoring
    docker-compose -f docker-compose.marketplace.yml up -d prometheus grafana
    
    print_status "All services started successfully"
}

# Show service status
show_status() {
    print_header "Service Status"
    docker-compose -f docker-compose.marketplace.yml ps
    
    print_header "Access Information"
    echo "🌐 Client Application: http://localhost"
    echo "🔧 API Documentation: http://localhost/api/docs"
    echo "📊 Grafana Dashboard: http://localhost:3002 (admin/admin)"
    echo "📈 Prometheus: http://localhost:9090"
    echo "🔍 Redis Commander: http://localhost:8081"
    echo "🗄️  Adminer: http://localhost:8080"
    
    print_header "Next Steps"
    echo "1. Update .env file with your actual configuration"
    echo "2. Set up Stripe Connect for vendor payouts"
    echo "3. Configure SendGrid for email notifications"
    echo "4. Review vendor approval workflows"
    echo "5. Test the marketplace functionality"
}

# Main execution
main() {
    print_header "Multi-Vendor Marketplace Setup"
    
    check_docker
    create_directories
    setup_environment
    setup_microservices
    setup_nginx
    setup_monitoring
    
    print_status "Configuration completed. Starting services..."
    
    # Build and start services
    docker-compose -f docker-compose.marketplace.yml build
    start_services
    
    # Setup database after services are up
    setup_database
    
    show_status
    
    print_header "Setup Complete!"
    print_status "Your multi-vendor marketplace is now running!"
    print_warning "Remember to update the .env file with your production values."
}

# Run main function
main "$@"
