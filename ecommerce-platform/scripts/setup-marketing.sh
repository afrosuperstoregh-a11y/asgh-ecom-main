#!/bin/bash

# Marketing & Automation Setup Script
# This script sets up the marketing automation infrastructure

set -e

echo "🚀 Setting up Marketing & Automation Infrastructure..."

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
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

# Check if Docker is running
if ! docker info > /dev/null 2>&1; then
    print_error "Docker is not running. Please start Docker first."
    exit 1
fi

# Check if docker-compose is available
if ! command -v docker-compose &> /dev/null; then
    print_error "docker-compose is not installed. Please install docker-compose first."
    exit 1
fi

# Create necessary directories
print_status "Creating necessary directories..."
mkdir -p ssl
mkdir -p monitoring/grafana/dashboards
mkdir -p monitoring/grafana/datasources
mkdir -p logs/marketing

# Copy environment file if it doesn't exist
if [ ! -f .env.marketing ]; then
    print_status "Creating .env.marketing file from template..."
    cp .env.marketing.example .env.marketing
    print_warning "Please update .env.marketing with your actual API keys and configuration."
fi

# Build and start services
print_status "Building and starting marketing services..."
docker-compose -f docker-compose.marketing.yml up --build -d

# Wait for services to be ready
print_status "Waiting for services to be ready..."
sleep 30

# Check if services are running
print_status "Checking service health..."

# Check PostgreSQL
if docker-compose -f docker-compose.marketing.yml exec -T postgres pg_isready -U postgres > /dev/null 2>&1; then
    print_status "✅ PostgreSQL is ready"
else
    print_error "❌ PostgreSQL is not ready"
fi

# Check Redis
if docker-compose -f docker-compose.marketing.yml exec -T redis redis-cli ping > /dev/null 2>&1; then
    print_status "✅ Redis is ready"
else
    print_error "❌ Redis is not ready"
fi

# Check Redis Queue
if docker-compose -f docker-compose.marketing.yml exec -T redis-queue redis-cli ping > /dev/null 2>&1; then
    print_status "✅ Redis Queue is ready"
else
    print_error "❌ Redis Queue is not ready"
fi

# Run database migrations
print_status "Running database migrations..."
docker-compose -f docker-compose.marketing.yml exec api npm run prisma:migrate

# Seed database with sample data
print_status "Seeding database with sample marketing data..."
docker-compose -f docker-compose.marketing.yml exec api npm run prisma:seed

# Display service URLs
echo ""
print_status "🎉 Marketing & Automation setup complete!"
echo ""
echo "📊 Service URLs:"
echo "  • Frontend:          http://localhost:3000"
echo "  • API:               http://localhost:3001"
echo "  • Redis Commander:    http://localhost:8081"
echo "  • Prometheus:        http://localhost:9090"
echo "  • Grafana:           http://localhost:3002 (admin/admin)"
echo ""
echo "📚 Useful Commands:"
echo "  • View logs:         docker-compose -f docker-compose.marketing.yml logs -f"
echo "  • Stop services:     docker-compose -f docker-compose.marketing.yml down"
echo "  • Restart services:  docker-compose -f docker-compose.marketing.yml restart"
echo ""
echo "🔧 Next Steps:"
echo "  1. Update .env.marketing with your actual API keys"
echo "  2. Configure SendGrid and Twilio credentials"
echo "  3. Set up CMS integration if needed"
echo "  4. Import or create marketing templates"
echo "  5. Test campaign creation and sending"
echo ""

# Display monitoring setup
print_status "📈 Monitoring Setup:"
echo "  • Grafana dashboards will be auto-configured"
echo "  • Prometheus metrics are collected from all services"
echo "  • Marketing job queue is monitored"
echo ""

# Display security notes
print_warning "🔒 Security Notes:"
echo "  • Change default passwords in production"
echo "  • Use SSL certificates for HTTPS"
echo "  • Configure firewall rules"
echo "  • Set up proper API key rotation"
echo ""

print_status "✅ Setup completed successfully!"
