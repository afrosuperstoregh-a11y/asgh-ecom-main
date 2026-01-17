#!/bin/bash

# Phase 7: Advanced Commerce Features - Setup Script
# This script sets up all Phase 7 services and configurations

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Logging functions
log_info() {
    echo -e "${BLUE}[INFO]${NC} $1"
}

log_success() {
    echo -e "${GREEN}[SUCCESS]${NC} $1"
}

log_warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1"
}

log_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

# Check if Docker is running
check_docker() {
    if ! docker info > /dev/null 2>&1; then
        log_error "Docker is not running. Please start Docker first."
        exit 1
    fi
    log_success "Docker is running"
}

# Check if Docker Compose is available
check_docker_compose() {
    if ! command -v docker-compose &> /dev/null; then
        log_error "Docker Compose is not installed. Please install Docker Compose first."
        exit 1
    fi
    log_success "Docker Compose is available"
}

# Create necessary directories
create_directories() {
    log_info "Creating necessary directories..."
    
    mkdir -p logs/{subscription-billing,loyalty,affiliate,phase7-jobs,phase7-analytics}
    mkdir -p config/{nginx,redis}
    mkdir -p monitoring/{prometheus,grafana}
    mkdir -p services/{subscription-billing,loyalty,affiliate,phase7-jobs,phase7-analytics}
    mkdir -p scripts/phase7
    
    log_success "Directories created"
}

# Copy environment configuration
setup_environment() {
    log_info "Setting up environment configuration..."
    
    if [ ! -f .env ]; then
        if [ -f .env.phase7.example ]; then
            cp .env.phase7.example .env
            log_warning "Environment file created from Phase 7 example. Please review and update the values."
        else
            log_error "Environment example file not found. Please create .env file manually."
            exit 1
        fi
    else
        log_warning "Environment file already exists. Please ensure it includes Phase 7 variables."
    fi
    
    log_success "Environment configuration setup completed"
}

# Create Nginx configuration for Phase 7
setup_nginx() {
    log_info "Setting up Nginx configuration for Phase 7..."
    
    cat > config/nginx/phase7-upstreams.conf << 'EOF'
# Phase 7 Service Upstreams
upstream subscription_billing {
    server subscription-billing:3005;
    keepalive 32;
}

upstream loyalty_service {
    server loyalty-service:3006;
    keepalive 32;
}

upstream affiliate_service {
    server affiliate-service:3007;
    keepalive 32;
}

upstream phase7_analytics {
    server phase7-analytics:3008;
    keepalive 32;
}
EOF

    cat > config/nginx/phase7-ratelimit.conf << 'EOF'
# Phase 7 Rate Limiting
limit_req_zone $binary_remote_addr zone=subscription_api:10m rate=10r/s;
limit_req_zone $binary_remote_addr zone=loyalty_api:10m rate=20r/s;
limit_req_zone $binary_remote_addr zone=affiliate_api:10m rate=15r/s;
limit_req_zone $binary_remote_addr zone=phase7_analytics:10m rate=5r/s;
EOF

    log_success "Nginx configuration created"
}

# Create Redis configuration for Phase 7
setup_redis() {
    log_info "Setting up Redis configuration for Phase 7..."
    
    cat > config/redis-phase7.conf << 'EOF'
# Phase 7 Redis Configuration
maxmemory 512mb
maxmemory-policy allkeys-lru
save 900 1
save 300 10
save 60 10000
appendonly yes
appendfsync everysec
EOF

    log_success "Redis configuration created"
}

# Create Prometheus configuration for Phase 7
setup_prometheus() {
    log_info "Setting up Prometheus configuration for Phase 7..."
    
    cat > monitoring/prometheus-phase7.yml << 'EOF'
# Phase 7 Prometheus Configuration
global:
  scrape_interval: 15s
  evaluation_interval: 15s

rule_files:
  - "rules/phase7-alerts.yml"

scrape_configs:
  - job_name: 'subscription-billing'
    static_configs:
      - targets: ['subscription-billing:3005']
    metrics_path: '/metrics'
    scrape_interval: 30s

  - job_name: 'loyalty-service'
    static_configs:
      - targets: ['loyalty-service:3006']
    metrics_path: '/metrics'
    scrape_interval: 30s

  - job_name: 'affiliate-service'
    static_configs:
      - targets: ['affiliate-service:3007']
    metrics_path: '/metrics'
    scrape_interval: 30s

  - job_name: 'phase7-analytics'
    static_configs:
      - targets: ['phase7-analytics:3008']
    metrics_path: '/metrics'
    scrape_interval: 30s

  - job_name: 'phase7-jobs'
    static_configs:
      - targets: ['phase7-jobs:3009']
    metrics_path: '/metrics'
    scrape_interval: 30s
EOF

    # Create Phase 7 alert rules
    mkdir -p monitoring/rules
    cat > monitoring/rules/phase7-alerts.yml << 'EOF'
# Phase 7 Alert Rules
groups:
  - name: phase7.rules
    rules:
      # Subscription Billing Alerts
      - alert: SubscriptionServiceDown
        expr: up{job="subscription-billing"} == 0
        for: 1m
        labels:
          severity: critical
        annotations:
          summary: "Subscription billing service is down"
          description: "Subscription billing service has been down for more than 1 minute."

      - alert: HighSubscriptionChurnRate
        expr: subscription_churn_rate > 0.10
        for: 5m
        labels:
          severity: warning
        annotations:
          summary: "High subscription churn rate detected"
          description: "Subscription churn rate is {{ $value }}% which is above the 10% threshold."

      # Loyalty Program Alerts
      - alert: LoyaltyServiceDown
        expr: up{job="loyalty-service"} == 0
        for: 1m
        labels:
          severity: critical
        annotations:
          summary: "Loyalty service is down"
          description: "Loyalty service has been down for more than 1 minute."

      - alert: LowLoyaltyEngagement
        expr: loyalty_engagement_rate < 0.50
        for: 10m
        labels:
          severity: warning
        annotations:
          summary: "Low loyalty program engagement"
          description: "Loyalty program engagement rate is {{ $value }}% which is below the 50% threshold."

      # Affiliate Program Alerts
      - alert: AffiliateServiceDown
        expr: up{job="affiliate-service"} == 0
        for: 1m
        labels:
          severity: critical
        annotations:
          summary: "Affiliate service is down"
          description: "Affiliate service has been down for more than 1 minute."

      - alert: LowAffiliateConversionRate
        expr: affiliate_conversion_rate < 0.02
        for: 15m
        labels:
          severity: warning
        annotations:
          summary: "Low affiliate conversion rate"
          description: "Affiliate conversion rate is {{ $value }}% which is below the 2% threshold."
EOF

    log_success "Prometheus configuration created"
}

# Create Phase 7 service health check scripts
create_health_checks() {
    log_info "Creating health check scripts..."
    
    # Subscription billing health check
    cat > services/subscription-billing/healthcheck.js << 'EOF'
const http = require('http');

const options = {
  hostname: 'localhost',
  port: process.env.PORT || 3005,
  path: '/health',
  method: 'GET',
  timeout: 3000
};

const req = http.request(options, (res) => {
  if (res.statusCode === 200) {
    process.exit(0);
  } else {
    process.exit(1);
  }
});

req.on('error', () => {
  process.exit(1);
});

req.on('timeout', () => {
  req.destroy();
  process.exit(1);
});

req.end();
EOF

    # Loyalty service health check
    cat > services/loyalty/healthcheck.js << 'EOF'
const http = require('http');

const options = {
  hostname: 'localhost',
  port: process.env.PORT || 3006,
  path: '/health',
  method: 'GET',
  timeout: 3000
};

const req = http.request(options, (res) => {
  if (res.statusCode === 200) {
    process.exit(0);
  } else {
    process.exit(1);
  }
});

req.on('error', () => {
  process.exit(1);
});

req.on('timeout', () => {
  req.destroy();
  process.exit(1);
});

req.end();
EOF

    # Affiliate service health check
    cat > services/affiliate/healthcheck.js << 'EOF'
const http = require('http');

const options = {
  hostname: 'localhost',
  port: process.env.PORT || 3007,
  path: '/health',
  method: 'GET',
  timeout: 3000
};

const req = http.request(options, (res) => {
  if (res.statusCode === 200) {
    process.exit(0);
  } else {
    process.exit(1);
  }
});

req.on('error', () => {
  process.exit(1);
});

req.on('timeout', () => {
  req.destroy();
  process.exit(1);
});

req.end();
EOF

    log_success "Health check scripts created"
}

# Build and start Phase 7 services
build_services() {
    log_info "Building Phase 7 services..."
    
    # Build Phase 7 services
    docker-compose -f docker-compose.yml -f docker-compose.phase7.yml build
    
    log_success "Phase 7 services built successfully"
}

# Start Phase 7 services
start_services() {
    log_info "Starting Phase 7 services..."
    
    # Start Phase 7 services
    docker-compose -f docker-compose.yml -f docker-compose.phase7.yml up -d
    
    log_success "Phase 7 services started"
}

# Wait for services to be ready
wait_for_services() {
    log_info "Waiting for services to be ready..."
    
    local services=("subscription-billing:3005" "loyalty-service:3006" "affiliate-service:3007")
    local max_attempts=30
    local attempt=1
    
    while [ $attempt -le $max_attempts ]; do
        local all_ready=true
        
        for service in "${services[@]}"; do
            local service_name=$(echo $service | cut -d: -f1)
            local port=$(echo $service | cut -d: -f2)
            
            if ! curl -f -s http://localhost:$port/health > /dev/null 2>&1; then
                all_ready=false
                break
            fi
        done
        
        if [ "$all_ready" = true ]; then
            log_success "All Phase 7 services are ready"
            return 0
        fi
        
        log_info "Attempt $attempt/$max_attempts: Waiting for services..."
        sleep 10
        ((attempt++))
    done
    
    log_error "Services did not become ready within the expected time"
    return 1
}

# Run database migrations
run_migrations() {
    log_info "Running Phase 7 database migrations..."
    
    # Wait for database to be ready
    docker-compose exec -T postgres pg_isready -U postgres
    
    # Run migrations
    docker-compose exec -T api npx prisma migrate deploy
    
    # Generate Prisma client
    docker-compose exec -T api npx prisma generate
    
    log_success "Database migrations completed"
}

# Seed Phase 7 data
seed_data() {
    log_info "Seeding Phase 7 data..."
    
    # Seed Phase 7 specific data
    docker-compose exec -T api npx prisma db seed -- --phase7
    
    log_success "Phase 7 data seeded successfully"
}

# Verify setup
verify_setup() {
    log_info "Verifying Phase 7 setup..."
    
    # Check service health
    local services=("subscription-billing:3005" "loyalty-service:3006" "affiliate-service:3007")
    
    for service in "${services[@]}"; do
        local service_name=$(echo $service | cut -d: -f1)
        local port=$(echo $service | cut -d: -f2)
        
        if curl -f -s http://localhost:$port/health > /dev/null 2>&1; then
            log_success "$service_name is healthy"
        else
            log_error "$service_name is not responding"
            return 1
        fi
    done
    
    # Check database connectivity
    if docker-compose exec -T postgres pg_isready -U postgres > /dev/null 2>&1; then
        log_success "Database is accessible"
    else
        log_error "Database is not accessible"
        return 1
    fi
    
    log_success "Phase 7 setup verification completed"
}

# Display setup summary
display_summary() {
    log_success "Phase 7 setup completed successfully!"
    echo
    echo "🎉 Phase 7: Advanced Commerce Features is now ready!"
    echo
    echo "📋 Services:"
    echo "  • Subscription Billing: http://localhost:3005"
    echo "  • Loyalty Service:    http://localhost:3006"
    echo "  • Affiliate Service:  http://localhost:3007"
    echo "  • Phase 7 Analytics:  http://localhost:3008"
    echo
    echo "📊 Monitoring:"
    echo "  • Prometheus: http://localhost:9090"
    echo "  • Grafana:    http://localhost:3001"
    echo
    echo "📚 Documentation:"
    echo "  • Phase 7 Guide: README-PHASE7.md"
    echo "  • API Docs:     http://localhost:3005/api/docs"
    echo
    echo "🔧 Next Steps:"
    echo "  1. Review and update .env file with your configuration"
    echo "  2. Configure Stripe webhooks for subscription billing"
    echo "  3. Set up SendGrid templates for notifications"
    echo "  4. Configure affiliate program settings"
    echo "  5. Test all Phase 7 features"
    echo
}

# Main execution
main() {
    echo "🚀 Setting up Phase 7: Advanced Commerce Features"
    echo "=================================================="
    echo
    
    # Check prerequisites
    check_docker
    check_docker_compose
    
    # Setup Phase 7
    create_directories
    setup_environment
    setup_nginx
    setup_redis
    setup_prometheus
    create_health_checks
    
    # Build and start services
    build_services
    start_services
    
    # Wait for services
    if wait_for_services; then
        # Database setup
        run_migrations
        seed_data
        
        # Verify setup
        if verify_setup; then
            display_summary
        else
            log_error "Setup verification failed"
            exit 1
        fi
    else
        log_error "Services failed to start properly"
        exit 1
    fi
}

# Handle script interruption
trap 'log_warning "Setup interrupted"; exit 1' INT TERM

# Run main function
main "$@"
