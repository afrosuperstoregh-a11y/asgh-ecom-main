#!/bin/bash

# Afro Superstore Production Deployment Script
# This script prepares and deploys the application to production

echo "🚀 Starting Afro Superstore Production Deployment..."

# Check if we're in the right directory
if [ ! -f "package.json" ]; then
    echo "❌ Error: package.json not found. Please run this script from the frontend directory."
    exit 1
fi

# Install dependencies
echo "📦 Installing dependencies..."
npm install --production

# Build the application
echo "🔨 Building production application..."
npm run build

if [ $? -ne 0 ]; then
    echo "❌ Build failed! Please check the errors above."
    exit 1
fi

# Run production server
echo "🌐 Starting production server..."
npm run start

echo "✅ Afro Superstore is now running in production mode!"
echo "📍 Frontend: http://localhost:3000"
echo "📍 Products: http://localhost:3000/products"
echo "📍 Admin: http://localhost:3000/admin"
echo ""
echo "🎯 Production Features:"
echo "  - Real Supabase product and category images"
echo "  - Production environment variables"
echo "  - Optimized build with image optimization"
echo "  - All development links replaced with production URLs"
