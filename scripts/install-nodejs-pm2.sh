#!/bin/bash
# Install Node.js and PM2 for AfroSuperStore
# DreamHost VPS Setup Script

set -e

echo "========================================"
echo "Installing Node.js and PM2"
echo "========================================"

# Check if running as correct user
if [ "$(whoami)" != "afrosuperstore" ]; then
    echo "ERROR: This script must be run as user 'afrosuperstore'"
    echo "Current user: $(whoami)"
    exit 1
fi

echo "User: $(whoami)"
echo "Home: $HOME"
echo ""

# Update package lists
echo "Updating package lists..."
sudo apt update

# Install prerequisites
echo "Installing prerequisites..."
sudo apt install -y curl wget gnupg2 software-properties-common apt-transport-https ca-certificates

# Install Node.js 18.x
echo "Installing Node.js 18.x..."
curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
sudo apt install -y nodejs

# Verify Node.js installation
echo "Verifying Node.js installation..."
node_version=$(node --version)
npm_version=$(npm --version)
echo "Node.js: $node_version"
echo "npm: $npm_version"

# Install PM2 globally
echo "Installing PM2 globally..."
sudo npm install -g pm2

# Verify PM2 installation
echo "Verifying PM2 installation..."
pm2_version=$(pm2 --version)
echo "PM2: $pm2_version"

# Setup PM2 startup script
echo "Setting up PM2 startup..."
pm2 startup
echo "PM2 startup configured. Please run the following command to enable startup:"
echo "sudo env PATH=$PATH:/usr/bin $HOME/.pm2/pm2 startup systemd -u afrosuperstore --hp $HOME"

# Install additional useful packages
echo "Installing additional useful packages..."
sudo apt install -y mysql-client redis-tools git

# Verify installations
echo ""
echo "========================================"
echo "Installation Complete!"
echo "========================================"
echo ""
echo "Node.js: $(node --version)"
echo "npm: $(npm --version)"
echo "PM2: $(pm2 --version)"
echo "MySQL client: $(mysql --version)"
echo "Redis client: $(redis-cli --version)"
echo ""

# Test PM2
echo "Testing PM2..."
pm2 list

echo ""
echo "Next steps:"
echo "1. Enable PM2 startup (run the command shown above)"
echo "2. Navigate to your application directory"
echo "3. Start your services: pm2 start ecosystem.config.js"
echo ""
