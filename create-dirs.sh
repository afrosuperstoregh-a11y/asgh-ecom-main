#!/bin/bash
# Create directory structure on DreamHost server
echo "Creating afrosuperstore.ca directory structure..."

# Create base directory
mkdir -p ~/afrosuperstore.ca
echo "Base directory created"

# Create subdirectories
mkdir -p ~/afrosuperstore.ca/nginx
mkdir -p ~/afrosuperstore.ca/nginx/ssl
mkdir -p ~/afrosuperstore.ca/logs
mkdir -p ~/afrosuperstore.ca/database
mkdir -p ~/afrosuperstore.ca/ecommerce-platform
echo "All subdirectories created"

# Set permissions
chmod 755 ~/afrosuperstore.ca
chmod 755 ~/afrosuperstore.ca/nginx
chmod 755 ~/afrosuperstore.ca/nginx/ssl
chmod 755 ~/afrosuperstore.ca/logs
chmod 755 ~/afrosuperstore.ca/database
chmod 755 ~/afrosuperstore.ca/ecommerce-platform
echo "Permissions set"

# Verify
echo "Directory structure:"
ls -la ~/afrosuperstore.ca/
echo "Directory creation completed successfully!"
