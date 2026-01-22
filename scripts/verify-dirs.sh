#!/bin/bash
echo "=== Directory Verification Script ==="
echo "Checking if directories exist..."

# Check base directory
if [ -d "~/afrosuperstore.ca" ]; then
    echo "✓ Base directory exists: ~/afrosuperstore.ca"
else
    echo "✗ Base directory missing: ~/afrosuperstore.ca"
    echo "Creating base directory..."
    mkdir -p ~/afrosuperstore.ca
fi

# Check and create subdirectories
directories=("nginx" "nginx/ssl" "logs" "database")
for dir in "${directories[@]}"; do
    if [ -d "~/afrosuperstore.ca/$dir" ]; then
        echo "✓ Directory exists: ~/afrosuperstore.ca/$dir"
    else
        echo "✗ Directory missing: ~/afrosuperstore.ca/$dir"
        echo "Creating directory: ~/afrosuperstore.ca/$dir"
        mkdir -p ~/afrosuperstore.ca/$dir
    fi
done

echo ""
echo "=== Final Directory Structure ==="
ls -la ~/afrosuperstore.ca/
echo ""
echo "=== Verification Complete ==="
