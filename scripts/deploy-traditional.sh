#!/bin/bash
# AfroSuperStore Traditional Deployment Script for DreamHost VPS
# User: afrosuperstore
# Path: /home/afrosuperstore/afrosuperstore.ca

set -e

echo "========================================"
echo "AfroSuperStore Traditional Deployment"
echo "========================================"

# Configuration
LOCAL_PATH="$(pwd)"
REMOTE_USER="afrosuperstore"
REMOTE_HOST="vps68200.dreamhostps.com"
REMOTE_PATH="/home/$REMOTE_USER/afrosuperstore.ca"
DOMAIN="www.afrosuperstore.ca"

echo "Local path: $LOCAL_PATH"
echo "Remote user: $REMOTE_USER"
echo "Remote host: $REMOTE_HOST"
echo "Remote path: $REMOTE_PATH"
echo "Domain: $DOMAIN"

# Function to run remote command
run_remote() {
    echo "Running: $1"
    ssh "$REMOTE_USER@$REMOTE_HOST" "$1"
}

# Function to copy files
copy_files() {
    echo "Copying: $1 -> $2"
    scp -r "$1" "$REMOTE_USER@$REMOTE_HOST:$2"
}

echo ""
echo "Step 1: Preparing local files..."
echo "================================"

# Create local build directory
BUILD_DIR="$LOCAL_PATH/build"
rm -rf "$BUILD_DIR"
mkdir -p "$BUILD_DIR"

# Copy application files
echo "Copying application files..."
cp -r "$LOCAL_PATH/ecommerce-platform/frontend" "$BUILD_DIR/"
cp -r "$LOCAL_PATH/ecommerce-platform/backend" "$BUILD_DIR/"
cp -r "$LOCAL_PATH/ecommerce-platform/api" "$BUILD_DIR/"
cp -r "$LOCAL_PATH/database" "$BUILD_DIR/"
cp -r "$LOCAL_PATH/scripts" "$BUILD_DIR/"
cp "$LOCAL_PATH/.env.production" "$BUILD_DIR/.env"
cp "$LOCAL_PATH/ecosystem.config.js" "$BUILD_DIR/"

# Create Apache config directory
mkdir -p "$BUILD_DIR/apache"
cp "$LOCAL_PATH/apache/afrosuperstore.conf" "$BUILD_DIR/apache/"

echo ""
echo "Step 2: Uploading files to server..."
echo "================================"

# Create remote directory structure
run_remote "mkdir -p $REMOTE_PATH/{frontend,backend,api,database,scripts,logs,uploads,apache}"

# Copy files to server
copy_files "$BUILD_DIR/"* "$REMOTE_PATH/"

echo ""
echo "Step 3: Installing dependencies..."
echo "================================"

# Install frontend dependencies
run_remote "cd $REMOTE_PATH/frontend && npm ci --production"

# Install backend dependencies
run_remote "cd $REMOTE_PATH/backend && npm ci --production"

# Install API dependencies
run_remote "cd $REMOTE_PATH/api && npm ci --production"

echo ""
echo "Step 4: Building frontend..."
echo "================================"

# Build frontend for production
run_remote "cd $REMOTE_PATH/frontend && npm run build"

echo ""
echo "Step 5: Setting up database..."
echo "================================"

# Create database and user (if they don't exist)
run_remote "mysql -u root -p -e 'CREATE DATABASE IF NOT EXISTS afrosuperstore_prod;' || true"
run_remote "mysql -u root -p -e \"CREATE USER IF NOT EXISTS 'afrosuperstore_db'@'localhost' IDENTIFIED BY 'SecureMySQLPassword2024!';\" || true"
run_remote "mysql -u root -p -e 'GRANT ALL PRIVILEGES ON afrosuperstore_prod.* TO afrosuperstore_db@localhost;' || true"
run_remote "mysql -u root -p -e 'FLUSH PRIVILEGES;' || true"

# Run database migrations
run_remote "cd $REMOTE_PATH/database && chmod +x migrate.sh && ./migrate.sh"

echo ""
echo "Step 6: Configuring Apache..."
echo "================================"

# Copy Apache configuration
run_remote "sudo cp $REMOTE_PATH/apache/afrosuperstore.conf /etc/apache2/sites-available/afrosuperstore.conf"

# Enable the site
run_remote "sudo a2ensite afrosuperstore.conf"

# Disable default site if it exists
run_remote "sudo a2dissite 000-default.conf || true"

# Test Apache configuration
run_remote "sudo apache2ctl configtest"

# Restart Apache
run_remote "sudo systemctl restart apache2"

echo ""
echo "Step 7: Starting Node.js services..."
echo "================================"

# Start PM2 processes
run_remote "cd $REMOTE_PATH && pm2 start ecosystem.config.js --env production"

# Save PM2 configuration
run_remote "pm2 save"

echo ""
echo "Step 8: Setting up monitoring..."
echo "================================"

# Setup log rotation
run_remote "cat > /tmp/afrosuperstore-logrotate << 'EOF'
$REMOTE_PATH/logs/*.log {
    daily
    missingok
    rotate 30
    compress
    delaycompress
    notifempty
    create 644 $REMOTE_USER $REMOTE_USER
    postrotate
        pm2 reload all
    endscript
}
EOF"

run_remote "sudo cp /tmp/afrosuperstore-logrotate /etc/logrotate.d/afrosuperstore"

# Setup cron job for health checks
run_remote "(crontab -l 2>/dev/null; echo '*/5 * * * * $REMOTE_PATH/scripts/health-check.sh >> $REMOTE_PATH/logs/health-check.log 2>&1') | crontab -"

echo ""
echo "========================================"
echo "Deployment Completed Successfully!"
echo "========================================"
echo ""
echo "Your AfroSuperStore is now deployed at: https://$DOMAIN"
echo ""
echo "Useful commands:"
echo "- Check status: ssh $REMOTE_USER@$REMOTE_HOST 'pm2 status'"
echo "- View logs: ssh $REMOTE_USER@$REMOTE_HOST 'pm2 logs'"
echo "- Health check: ssh $REMOTE_USER@$REMOTE_HOST '$REMOTE_PATH/scripts/health-check.sh'"
echo "- Restart services: ssh $REMOTE_USER@$REMOTE_HOST '$REMOTE_PATH/scripts/restart-services.sh'"
echo ""
echo "Next steps:"
echo "1. Configure your production Stripe keys in .env"
echo "2. Set up email configuration"
echo "3. Configure SSL certificates (DreamHost managed)"
echo "4. Test all functionality"
echo "5. Set up monitoring and alerts"
echo ""
