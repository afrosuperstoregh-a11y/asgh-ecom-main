# 🚀 Deployment Guide

This guide covers deploying the e-commerce platform to production.

## 📋 Prerequisites

- Node.js 18+
- Docker & Docker Compose
- PostgreSQL 15+
- Redis 7+
- SSL certificate
- Domain name
- Stripe account (production mode)

## 🐳 Docker Production Deployment

### 1. Environment Configuration

Create a production `.env` file:

```env
# Application
NODE_ENV=production
PORT=3001

# Database (use production database)
DATABASE_URL="postgresql://username:password@your-db-host:5432/ecommerce_prod"

# Redis (use production Redis)
REDIS_URL="redis://username:password@your-redis-host:6379"

# JWT (use strong secret)
JWT_SECRET="your-super-strong-jwt-secret-key-here"
JWT_EXPIRES_IN="7d"

# Stripe (production keys)
STRIPE_SECRET_KEY="sk_live_..."
STRIPE_PUBLISHABLE_KEY="pk_live_..."
STRIPE_WEBHOOK_SECRET="whsec_..."

# Typesense (production)
TYPESENSE_API_KEY="your-production-typesense-key"
TYPESENSE_HOST="your-typesense-host"
TYPESENSE_PORT="8108"
TYPESENSE_PROTOCOL="https"

# CORS (your production domains)
ALLOWED_ORIGINS="https://yourdomain.com,https://www.yourdomain.com"

# Logging
LOG_LEVEL="info"
```

### 2. Production Docker Compose

Create `docker-compose.prod.yml`:

```yaml
version: '3.8'

services:
  # Client Application
  client:
    build:
      context: ./client
      dockerfile: Dockerfile.prod
    ports:
      - "80:80"
      - "443:443"
    environment:
      - NODE_ENV=production
      - NEXT_PUBLIC_API_URL=https://api.yourdomain.com
    volumes:
      - ./ssl-certs:/etc/ssl-certs:ro
    depends_on:
      - api
    networks:
      - ecommerce-network

  # API Server
  api:
    build:
      context: ./api
      dockerfile: Dockerfile.prod
    environment:
      - NODE_ENV=production
      - DATABASE_URL=${DATABASE_URL}
      - REDIS_URL=${REDIS_URL}
      - JWT_SECRET=${JWT_SECRET}
      - STRIPE_SECRET_KEY=${STRIPE_SECRET_KEY}
      - STRIPE_WEBHOOK_SECRET=${STRIPE_WEBHOOK_SECRET}
      - TYPESENSE_API_KEY=${TYPESENSE_API_KEY}
      - TYPESENSE_HOST=${TYPESENSE_HOST}
      - TYPESENSE_PORT=${TYPESENSE_PORT}
      - ALLOWED_ORIGINS=${ALLOWED_ORIGINS}
    volumes:
      - ./logs:/app/logs
    depends_on:
      - db
      - redis
      - typesense
    networks:
      - ecommerce-network

  # Database
  db:
    image: postgres:15-alpine
    environment:
      POSTGRES_USER: ${DB_USER}
      POSTGRES_PASSWORD: ${DB_PASSWORD}
      POSTGRES_DB: ${DB_NAME}
    volumes:
      - postgres_data:/var/lib/postgresql/data
      - ./backups:/backups
    networks:
      - ecommerce-network
    restart: unless-stopped

  # Redis
  redis:
    image: redis:7-alpine
    command: redis-server --requirepass ${REDIS_PASSWORD}
    volumes:
      - redis_data:/data
      - ./redis.conf:/usr/local/etc/redis/redis.conf:ro
    networks:
      - ecommerce-network
    restart: unless-stopped

  # Typesense
  typesense:
    image: typesense/typesense:0.24.1
    environment:
      - TYPESENSE_API_KEY=${TYPESENSE_API_KEY}
      - TYPESENSE_DATA_DIR=/data
    volumes:
      - typesense_data:/data
    networks:
      - ecommerce-network
    restart: unless-stopped

volumes:
  postgres_data:
  redis_data:
  typesense_data:
  ssl-certs:

networks:
  ecommerce-network:
    driver: bridge
```

### 3. SSL Certificate Setup

#### Option A: Let's Encrypt (Recommended)
```bash
# Install certbot
sudo apt-get install certbot

# Generate certificate
sudo certbot certonly --standalone -d yourdomain.com -d www.yourdomain.com

# Copy certificates
sudo cp /etc/letsencrypt/live/yourdomain.com/fullchain.pem ./ssl-certs/
sudo cp /etc/letsencrypt/live/yourdomain.com/privkey.pem ./ssl-certs/
```

#### Option B: Self-signed (for testing)
```bash
openssl req -x509 -nodes -days 365 -newkey rsa:2048 \
  -keyout ssl-certs/privkey.pem \
  -out ssl-certs/fullchain.pem
```

### 4. Deploy Commands

```bash
# Build and start services
docker-compose -f docker-compose.prod.yml up -d --build

# Run database migrations
docker-compose -f docker-compose.prod.yml exec api npm run prisma:migrate

# Seed initial data (optional)
docker-compose -f docker-compose.prod.yml exec api npm run prisma:seed

# Check logs
docker-compose -f docker-compose.prod.yml logs -f api
```

## 🌐 Nginx Reverse Proxy

Create `nginx.conf`:

```nginx
events {
    worker_connections 1024;
}

http {
    upstream api {
        server api:3001;
    }

    upstream client {
        server client:80;
    }

    # Rate limiting
    limit_req_zone $binary_remote_addr zone=api:10m rate=10r/s;
    limit_req_zone $binary_remote_addr zone=login:10m rate=1r/s;

    server {
        listen 443 ssl http2;
        server_name yourdomain.com www.yourdomain.com;

        # SSL configuration
        ssl_certificate /etc/ssl-certs/fullchain.pem;
        ssl_certificate_key /etc/ssl-certs/privkey.pem;
        ssl_protocols TLSv1.2 TLSv1.3;
        ssl_ciphers HIGH:!aNULL:!MD5;

        # Security headers
        add_header X-Frame-Options "SAMEORIGIN" always;
        add_header X-XSS-Protection "1; mode=block" always;
        add_header X-Content-Type-Options "nosniff" always;
        add_header Referrer-Policy "no-referrer-when-downgrade" always;
        add_header Content-Security-Policy "default-src 'self' http: https: data: blob: 'unsafe-inline'" always;

        # API routes
        location /api/ {
            limit_req zone=api burst=20 nodelay;
            proxy_pass http://api;
            proxy_set_header Host $host;
            proxy_set_header X-Real-IP $remote_addr;
            proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
            proxy_set_header X-Forwarded-Proto $scheme;
        }

        # Auth endpoints with stricter rate limiting
        location /api/auth/ {
            limit_req zone=login burst=5 nodelay;
            proxy_pass http://api;
            proxy_set_header Host $host;
            proxy_set_header X-Real-IP $remote_addr;
            proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
            proxy_set_header X-Forwarded-Proto $scheme;
        }

        # Client application
        location / {
            proxy_pass http://client;
            proxy_set_header Host $host;
            proxy_set_header X-Real-IP $remote_addr;
            proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
            proxy_set_header X-Forwarded-Proto $scheme;
        }

        # Stripe webhook
        location /api/payments/confirm {
            proxy_pass http://api;
            proxy_set_header Host $host;
            proxy_set_header X-Real-IP $remote_addr;
            proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
            proxy_set_header X-Forwarded-Proto $scheme;
        }
    }

    # Redirect HTTP to HTTPS
    server {
        listen 80;
        server_name yourdomain.com www.yourdomain.com;
        return 301 https://$server_name$request_uri;
    }
}
```

## 🔧 Production Optimizations

### 1. Database Optimization

```sql
-- Create indexes for better performance
CREATE INDEX idx_products_status ON products(status);
CREATE INDEX idx_products_category ON products(categoryId);
CREATE INDEX idx_products_featured ON products(featured) WHERE featured = true;
CREATE INDEX idx_orders_user ON orders(userId);
CREATE INDEX idx_orders_status ON orders(status);
CREATE INDEX idx_cart_user ON cart(userId);
```

### 2. Redis Configuration

Create `redis.conf`:

```conf
# Memory
maxmemory 256mb
maxmemory-policy allkeys-lru

# Persistence
save 900 1
save 300 10
save 60 10000

# Security
requirepass your-redis-password

# Performance
tcp-keepalive 300
timeout 0
```

### 3. Application Performance

```bash
# Enable clustering
pm2 start ecosystem.config.js

# Monitor performance
pm2 monit

# View logs
pm2 logs
```

## 📊 Monitoring & Logging

### 1. Application Monitoring

```javascript
// Add to your monitoring service
const winston = require('winston');

const logger = winston.createLogger({
  level: 'info',
  format: winston.format.combine(
    winston.format.timestamp(),
    winston.format.json()
  ),
  transports: [
    new winston.transports.File({ filename: 'logs/error.log', level: 'error' }),
    new winston.transports.File({ filename: 'logs/combined.log' }),
    new winston.transports.Console()
  ]
});
```

### 2. Database Monitoring

```bash
# Enable slow query logging
ALTER SYSTEM SET log_min_duration_statement = 1000;
ALTER SYSTEM SET log_statement = 'all';

# Monitor connections
SELECT * FROM pg_stat_activity;
```

### 3. Health Checks

```bash
# API health
curl https://api.yourdomain.com/api/health

# Database health
docker-compose exec db pg_isready

# Redis health
docker-compose exec redis redis-cli ping
```

## 🔒 Security Hardening

### 1. Network Security

```bash
# Firewall rules
ufw allow 22/tcp    # SSH
ufw allow 80/tcp    # HTTP
ufw allow 443/tcp   # HTTPS
ufw enable
```

### 2. Application Security

- Use environment variables for secrets
- Enable rate limiting
- Implement request validation
- Use HTTPS everywhere
- Regular security updates
- Monitor for vulnerabilities

### 3. Database Security

```sql
-- Create read-only user for reporting
CREATE USER readonly_user WITH PASSWORD 'secure_password';
GRANT CONNECT ON DATABASE ecommerce_prod TO readonly_user;
GRANT USAGE ON SCHEMA public TO readonly_user;
GRANT SELECT ON ALL TABLES IN SCHEMA public TO readonly_user;
```

## 🔄 CI/CD Pipeline

### GitHub Actions Example

```yaml
name: Deploy to Production

on:
  push:
    branches: [main]

jobs:
  deploy:
    runs-on: ubuntu-latest
    steps:
    - uses: actions/checkout@v2
    
    - name: Deploy to server
      uses: appleboy/ssh-action@v0.1.4
      with:
        host: ${{ secrets.HOST }}
        username: ${{ secrets.USERNAME }}
        key: ${{ secrets.SSH_KEY }}
        script: |
          cd /path/to/app
          git pull origin main
          docker-compose -f docker-compose.prod.yml down
          docker-compose -f docker-compose.prod.yml up -d --build
          docker-compose -f docker-compose.prod.yml exec api npm run prisma:migrate
```

## 📈 Scaling Considerations

### 1. Horizontal Scaling

- Load balancer with multiple API instances
- Database read replicas
- Redis cluster
- CDN for static assets

### 2. Vertical Scaling

- Increase server resources
- Optimize database queries
- Implement caching strategies
- Use connection pooling

## 🚨 Troubleshooting

### Common Issues

1. **Database Connection Failed**
   - Check DATABASE_URL
   - Verify database is running
   - Check network connectivity

2. **Redis Connection Failed**
   - Check REDIS_URL
   - Verify Redis is running
   - Check firewall settings

3. **Stripe Webhook Issues**
   - Verify webhook URL is accessible
   - Check webhook secret
   - Review Stripe logs

4. **High Memory Usage**
   - Monitor Redis memory
   - Check for memory leaks
   - Optimize database queries

### Log Analysis

```bash
# View error logs
tail -f logs/error.log

# Monitor API performance
grep "POST /api" logs/combined.log | tail -20

# Database slow queries
grep "slow query" logs/postgres.log
```

## 📞 Support

### Health Check Endpoints

- API: `https://api.yourdomain.com/api/health`
- Database: `https://api.yourdomain.com/api/health/db`
- Redis: `https://api.yourdomain.com/api/health/redis`

### Monitoring Dashboards

- Application metrics
- Database performance
- Redis statistics
- Error rates

---

**Remember to test thoroughly in staging before deploying to production!**
