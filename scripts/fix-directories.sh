#!/bin/bash
# Fix directory structure for AfroSuperStore deployment
# This script ensures the correct directory structure exists

set -e

echo "========================================"
echo "AfroSuperStore Directory Structure Fix"
echo "========================================"

# Configuration
BASE_PATH="/home/afrosuperstore/afrosuperstore.ca"
USER="afrosuperstore"

echo "Base path: $BASE_PATH"
echo "User: $USER"
echo ""

# Create base directory structure
echo "Creating directory structure..."
mkdir -p "$BASE_PATH"
mkdir -p "$BASE_PATH"/{frontend,backend,api,database,scripts,logs,uploads,apache}
mkdir -p "$BASE_PATH/database/migrations"
mkdir -p "$BASE_PATH/logs"

# Set proper permissions
echo "Setting permissions..."
chmod 755 "$BASE_PATH"
chmod -R 755 "$BASE_PATH/frontend"
chmod -R 755 "$BASE_PATH/backend"
chmod -R 755 "$BASE_PATH/api"
chmod -R 755 "$BASE_PATH/database"
chmod -R 755 "$BASE_PATH/scripts"
chmod -R 755 "$BASE_PATH/logs"
chmod -R 755 "$BASE_PATH/uploads"
chmod -R 755 "$BASE_PATH/apache"

# Create log files
echo "Creating log files..."
touch "$BASE_PATH/logs"/{apache_access.log,apache_error.log,apache_ssl_access.log,apache_ssl_error.log}
touch "$BASE_PATH/logs"/{frontend.log,backend.log,api.log}
touch "$BASE_PATH/logs"/{frontend-out.log,frontend-error.log,backend-out.log,backend-error.log,api-out.log,api-error.log}
touch "$BASE_PATH/logs"/{pm2.log,pm2-out.log,pm2-error.log}

# Set log permissions
chmod 644 "$BASE_PATH/logs"/*.log

# Verify structure
echo ""
echo "Directory structure created:"
ls -la "$BASE_PATH"

echo ""
echo "Database directory:"
ls -la "$BASE_PATH/database"

echo ""
echo "Migration files:"
ls -la "$BASE_PATH/database/migrations"

echo ""
echo "========================================"
echo "Directory structure fix completed!"
echo "========================================"
echo ""
echo "Next steps:"
echo "1. Upload your application files to the appropriate directories"
echo "2. Run database migrations: cd $BASE_PATH/database && ./migrate.sh"
echo "3. Start services: cd $BASE_PATH && pm2 start ecosystem.config.js"
echo ""
