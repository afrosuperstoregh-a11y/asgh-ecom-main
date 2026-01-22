#!/bin/bash
# AfroSuperStore Traditional DreamHost VPS Setup Script
# User: afrosuperstore
# Path: /home/afrosuperstore/afrosuperstore.ca

set -e

echo "========================================"
echo "AfroSuperStore Traditional VPS Setup"
echo "========================================"

# Configuration
USER="afrosuperstore"
DOMAIN="www.afrosuperstore.ca"
BASE_PATH="/home/$USER/afrosuperstore.ca"
LOG_PATH="$BASE_PATH/logs"

echo "Setting up AfroSuperStore for traditional deployment..."
echo "User: $USER"
echo "Domain: $DOMAIN"
echo "Path: $BASE_PATH"

# Create directory structure
echo "Creating directory structure..."
mkdir -p "$BASE_PATH"/{frontend,backend,api,database,scripts,logs,uploads,apache}
mkdir -p "$BASE_PATH/database/migrations"
mkdir -p "$LOG_PATH"

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

# Install Node.js (if not already installed)
echo "Checking Node.js installation..."
if ! command -v node &> /dev/null; then
    echo "Installing Node.js 18.x..."
    curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
    sudo apt-get install -y nodejs
else
    echo "Node.js is already installed: $(node --version)"
fi

# Install PM2 globally
echo "Installing PM2..."
if ! command -v pm2 &> /dev/null; then
    sudo npm install -g pm2
else
    echo "PM2 is already installed: $(pm2 --version)"
fi

# Setup PM2 startup script
echo "Setting up PM2 startup..."
pm2 startup
env PATH=$PATH:/usr/bin pm2 startup systemd -u $USER --hp $HOME

# Install MySQL client
echo "Installing MySQL client..."
sudo apt-get update
sudo apt-get install -y mysql-client

# Install Redis client
echo "Installing Redis client..."
sudo apt-get install -y redis-tools

# Check Apache status
echo "Checking Apache status..."
if systemctl is-active --quiet apache2; then
    echo "Apache is running"
else
    echo "Apache is not running, starting..."
    sudo systemctl start apache2
    sudo systemctl enable apache2
fi

# Enable required Apache modules
echo "Enabling Apache modules..."
sudo a2enmod proxy
sudo a2enmod proxy_http
sudo a2enmod proxy_balancer
sudo a2enmod lbmethod_byrequests
sudo a2enmod rewrite
sudo a2enmod headers
sudo a2enmod ssl
sudo a2enmod deflate

# Restart Apache to apply changes
sudo systemctl restart apache2

# Create log files
echo "Creating log files..."
touch "$LOG_PATH"/{apache_access.log,apache_error.log,apache_ssl_access.log,apache_ssl_error.log}
touch "$LOG_PATH"/{frontend.log,backend.log,api.log}
touch "$LOG_PATH"/{frontend-out.log,frontend-error.log,backend-out.log,backend-error.log,api-out.log,api-error.log}
touch "$LOG_PATH"/{pm2.log,pm2-out.log,pm2-error.log}

# Set log permissions
chmod 644 "$LOG_PATH"/*.log

# Create health check script
echo "Creating health check script..."
cat > "$BASE_PATH/scripts/health-check.sh" << 'EOF'
#!/bin/bash
# Health Check Script for AfroSuperStore

BASE_PATH="/home/afrosuperstore/afrosuperstore.ca"
LOG_PATH="$BASE_PATH/logs"

echo "========================================"
echo "AfroSuperStore Health Check"
echo "========================================"
echo "Timestamp: $(date)"
echo ""

# Check PM2 processes
echo "PM2 Process Status:"
pm2 status
echo ""

# Check Apache status
echo "Apache Status:"
systemctl is-active apache2
echo ""

# Check Node.js processes
echo "Node.js Processes:"
pgrep -f "node" || echo "No Node.js processes found"
echo ""

# Check MySQL connection
echo "MySQL Connection Test:"
mysql -h localhost -u afrosuperstore_db -pSecureMySQLPassword2024! -e "SELECT 1;" 2>/dev/null && echo "MySQL: OK" || echo "MySQL: FAILED"
echo ""

# Check Redis connection
echo "Redis Connection Test:"
redis-cli -a SecureRedisPassword2024! ping 2>/dev/null || echo "Redis: FAILED"
echo ""

# Check disk space
echo "Disk Space:"
df -h "$BASE_PATH"
echo ""

# Check memory usage
echo "Memory Usage:"
free -h
echo ""

echo "Health check completed."
EOF

chmod +x "$BASE_PATH/scripts/health-check.sh"

# Create restart script
echo "Creating restart script..."
cat > "$BASE_PATH/scripts/restart-services.sh" << 'EOF'
#!/bin/bash
# Restart Services Script for AfroSuperStore

echo "Restarting AfroSuperStore services..."

# Restart PM2 processes
pm2 restart all

# Restart Apache
sudo systemctl restart apache2

echo "Services restarted. Check status with: pm2 status"
EOF

chmod +x "$BASE_PATH/scripts/restart-services.sh"

echo ""
echo "========================================"
echo "Traditional VPS Setup Completed!"
echo "========================================"
echo ""
echo "Next steps:"
echo "1. Upload your application files to the appropriate directories"
echo "2. Configure MySQL database and user"
echo "3. Configure Redis if needed"
echo "4. Install dependencies: npm install"
echo "5. Build frontend: cd frontend && npm run build"
echo "6. Start services: pm2 start ecosystem.config.js"
echo "7. Configure Apache virtual host"
echo "8. Test your application at: https://www.afrosuperstore.ca"
echo ""
echo "Health check: $BASE_PATH/scripts/health-check.sh"
echo "Restart services: $BASE_PATH/scripts/restart-services.sh"
echo ""
