#!/bin/bash

# Frontend Setup Script for E-commerce Platform
# This script sets up the frontend development environment

set -e

echo "🚀 Setting up Frontend for E-commerce Platform..."

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

# Create environment file if it doesn't exist
if [ ! -f .env.frontend ]; then
    echo "📝 Creating frontend environment file..."
    cp .env.frontend.example .env.frontend
    echo "✅ Environment file created. Please edit .env.frontend with your configuration."
fi

# Build and start frontend
echo "🔨 Building frontend Docker image..."
docker-compose -f docker-compose.frontend.yml build frontend

echo "🚀 Starting frontend services..."
docker-compose -f docker-compose.frontend.yml up -d frontend

# Wait for frontend to be ready
echo "⏳ Waiting for frontend to start..."
sleep 10

# Check if frontend is running
if curl -f http://localhost:3000 &> /dev/null; then
    echo "✅ Frontend is running successfully!"
    echo "🌐 Frontend URL: http://localhost:3000"
    echo "📱 About Page: http://localhost:3000/about"
else
    echo "❌ Frontend failed to start. Check the logs:"
    docker-compose -f docker-compose.frontend.yml logs frontend
    exit 1
fi

echo "🎉 Frontend setup completed successfully!"
echo ""
echo "📋 Next Steps:"
echo "1. Visit http://localhost:3000/about to see the About page"
echo "2. Edit .env.frontend to customize your environment"
echo "3. Use 'docker-compose -f docker-compose.frontend.yml logs -f frontend' to view logs"
echo "4. Use 'docker-compose -f docker-compose.frontend.yml down' to stop services"
echo ""
echo "🔧 Development Commands:"
echo "docker-compose -f docker-compose.frontend.yml up -d frontend  # Start frontend"
echo "docker-compose -f docker-compose.frontend.yml logs frontend   # View logs"
echo "docker-compose -f docker-compose.frontend.yml down           # Stop services"
echo "docker-compose -f docker-compose.frontend.yml restart frontend # Restart frontend"
