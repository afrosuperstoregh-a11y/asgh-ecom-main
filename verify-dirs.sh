#!/bin/bash
echo "Checking directory structure..."
echo "Base directory:"
ls -la ~/afrosuperstore.ca 2>/dev/null || echo "Base directory not found"
echo ""
echo "Creating directories if needed..."
mkdir -p ~/afrosuperstore.ca
mkdir -p ~/afrosuperstore.ca/nginx
mkdir -p ~/afrosuperstore.ca/nginx/ssl
mkdir -p ~/afrosuperstore.ca/logs
mkdir -p ~/afrosuperstore.ca/database
mkdir -p ~/afrosuperstore.ca/ecommerce-platform
echo ""
echo "Final directory structure:"
ls -la ~/afrosuperstore.ca/
echo "Directory verification completed!"
