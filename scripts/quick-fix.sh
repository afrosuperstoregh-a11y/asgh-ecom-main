#!/bin/bash
# Quick Fix for AfroSuperStore Deployment Issues
# Fixes common problems: PM2 not found, directory structure, etc.

set -e

echo "========================================"
echo "AfroSuperStore Quick Fix Script"
echo "========================================"

# Configuration
BASE_PATH="/home/afrosuperstore/afrosuperstore.ca"
USER="afrosuperstore"

echo "User: $(whoami)"
echo "Base path: $BASE_PATH"
echo ""

# Check if running as correct user
if [ "$(whoami)" != "afrosuperstore" ]; then
    echo "WARNING: Not running as 'afrosuperstore' user"
    echo "Current user: $(whoami)"
    echo "Some operations may fail..."
    echo ""
fi

# Fix 1: Install Node.js and PM2 if not found
echo "=== FIX 1: Checking Node.js and PM2 ==="
if ! command -v node &> /dev/null; then
    echo "Node.js not found. Installing..."
    curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
    sudo apt install -y nodejs
    echo "Node.js installed: $(node --version)"
else
    echo "Node.js found: $(node --version)"
fi

if ! command -v pm2 &> /dev/null; then
    echo "PM2 not found. Installing..."
    sudo npm install -g pm2
    echo "PM2 installed: $(pm2 --version)"
else
    echo "PM2 found: $(pm2 --version)"
fi

# Fix 2: Create proper directory structure
echo ""
echo "=== FIX 2: Creating Directory Structure ==="
mkdir -p "$BASE_PATH"
mkdir -p "$BASE_PATH"/{frontend,backend,api,database,scripts,logs,uploads,apache}
mkdir -p "$BASE_PATH/database/migrations"
mkdir -p "$BASE_PATH/logs"

echo "Directory structure created:"
ls -la "$BASE_PATH"

# Fix 3: Set proper permissions
echo ""
echo "=== FIX 3: Setting Permissions ==="
chmod 755 "$BASE_PATH"
chmod -R 755 "$BASE_PATH/frontend"
chmod -R 755 "$BASE_PATH/backend"
chmod -R 755 "$BASE_PATH/api"
chmod -R 755 "$BASE_PATH/database"
chmod -R 755 "$BASE_PATH/scripts"
chmod -R 755 "$BASE_PATH/logs"
chmod -R 755 "$BASE_PATH/uploads"
chmod -R 755 "$BASE_PATH/apache"

# Fix 4: Create log files
echo ""
echo "=== FIX 4: Creating Log Files ==="
touch "$BASE_PATH/logs"/{apache_access.log,apache_error.log,apache_ssl_access.log,apache_ssl_error.log}
touch "$BASE_PATH/logs"/{frontend.log,backend.log,api.log}
touch "$BASE_PATH/logs"/{frontend-out.log,frontend-error.log,backend-out.log,backend-error.log,api-out.log,api-error.log}
touch "$BASE_PATH/logs"/{pm2.log,pm2-out.log,pm2-error.log}

chmod 644 "$BASE_PATH/logs"/*.log

echo "Log files created:"
ls -la "$BASE_PATH/logs"

# Fix 5: Check database connectivity
echo ""
echo "=== FIX 5: Checking Database Connectivity ==="
if command -v mysql &> /dev/null; then
    echo "MySQL client found: $(mysql --version)"
    
    # Test MySQL connection
    if mysql -h localhost -u afrosuperstore_db -pSecureMySQLPassword2024! -e "SELECT 1;" afrosuperstore_prod &>/dev/null; then
        echo "MySQL connection: SUCCESS ✓"
    else
        echo "MySQL connection: FAILED ✗"
        echo "Please check database credentials and ensure MySQL is running"
    fi
else
    echo "MySQL client not found. Installing..."
    sudo apt install -y mysql-client
fi

# Fix 6: Check Redis connectivity
echo ""
echo "=== FIX 6: Checking Redis Connectivity ==="
if command -v redis-cli &> /dev/null; then
    echo "Redis client found"
    
    # Test Redis connection
    if redis-cli -a SecureRedisPassword2024! ping &>/dev/null; then
        echo "Redis connection: SUCCESS ✓"
    else
        echo "Redis connection: FAILED ✗"
        echo "Please check Redis is running and password is correct"
    fi
else
    echo "Redis client not found. Installing..."
    sudo apt install -y redis-tools
fi

# Fix 7: Setup PM2 startup
echo ""
echo "=== FIX 7: PM2 Startup Configuration ==="
if command -v pm2 &> /dev/null; then
    echo "Configuring PM2 startup..."
    pm2 startup systemd -u afrosuperstore --hp $HOME --skip-env
    echo "PM2 startup configured"
    echo "Save PM2 configuration: pm2 save"
else
    echo "PM2 not available, skipping startup configuration"
fi

# Final status check
echo ""
echo "========================================"
echo "QUICK FIX COMPLETED!"
echo "========================================"
echo ""
echo "System Status:"
echo "- Node.js: $(node --version 2>/dev/null || echo 'Not installed')"
echo "- npm: $(npm --version 2>/dev/null || echo 'Not installed')"
echo "- PM2: $(pm2 --version 2>/dev/null || echo 'Not installed')"
echo "- MySQL client: $(mysql --version 2>/dev/null | head -1 || echo 'Not installed')"
echo "- Redis client: $(redis-cli --version 2>/dev/null || echo 'Not installed')"
echo ""
echo "Directory Structure:"
echo "- Base directory: $BASE_PATH"
echo "- Exists: $([ -d "$BASE_PATH" ] && echo 'YES ✓' || echo 'NO ✗')"
echo "- Writable: $([ -w "$BASE_PATH" ] && echo 'YES ✓' || echo 'NO ✗')"
echo ""
echo "Next steps:"
echo "1. Upload your application files to: $BASE_PATH"
echo "2. Install dependencies: cd $BASE_PATH/frontend && npm install --production"
echo "3. Build frontend: cd $BASE_PATH/frontend && npm run build"
echo "4. Start services: cd $BASE_PATH && pm2 start ecosystem.config.js"
echo "5. Save PM2 config: pm2 save"
echo ""
