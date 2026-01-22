#!/bin/bash
# MySQL Migration Script for AfroSuperStore
# Traditional DreamHost VPS Deployment

set -e

echo "========================================"
echo "AfroSuperStore MySQL Migration"
echo "========================================"

# Database configuration
DB_HOST="localhost"
DB_PORT="3306"
DB_NAME="afrosuperstore_prod"
DB_USER="afrosuperstore_db"
DB_PASS="SecureMySQLPassword2024!"

# Migration directory
MIGRATION_DIR="/home/afrosuperstore/afrosuperstore.ca/database/migrations"

echo "Database: $DB_NAME"
echo "User: $DB_USER"
echo "Migration directory: $MIGRATION_DIR"

# Check if MySQL client is available
if ! command -v mysql &> /dev/null; then
    echo "ERROR: MySQL client is not installed"
    exit 1
fi

# Test database connection
echo "Testing database connection..."
mysql -h "$DB_HOST" -P "$DB_PORT" -u "$DB_USER" -p"$DB_PASS" -e "SELECT 1;" "$DB_NAME" > /dev/null 2>&1
if [ $? -ne 0 ]; then
    echo "ERROR: Cannot connect to database"
    echo "Please check your database configuration"
    exit 1
fi
echo "Database connection successful!"

# Create migrations table if it doesn't exist
echo "Creating migrations table..."
mysql -h "$DB_HOST" -P "$DB_PORT" -u "$DB_USER" -p"$DB_PASS" "$DB_NAME" << 'EOF'
CREATE TABLE IF NOT EXISTS migrations (
    id INT AUTO_INCREMENT PRIMARY KEY,
    filename VARCHAR(255) NOT NULL UNIQUE,
    executed_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
EOF

# Get list of migration files
if [ ! -d "$MIGRATION_DIR" ]; then
    echo "WARNING: Migration directory does not exist: $MIGRATION_DIR"
    echo "Creating migration directory..."
    mkdir -p "$MIGRATION_DIR"
    
    # Create initial migration
    cat > "$MIGRATION_DIR/001_initial_schema.sql" << 'EOF'
-- AfroSuperStore Initial Schema
-- MySQL Migration

-- Users table
CREATE TABLE IF NOT EXISTS users (
    id INT AUTO_INCREMENT PRIMARY KEY,
    email VARCHAR(255) NOT NULL UNIQUE,
    password_hash VARCHAR(255) NOT NULL,
    first_name VARCHAR(100) NOT NULL,
    last_name VARCHAR(100) NOT NULL,
    phone VARCHAR(20),
    role ENUM('customer', 'admin', 'vendor') DEFAULT 'customer',
    email_verified BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    INDEX idx_users_email (email),
    INDEX idx_users_role (role)
);

-- Categories table
CREATE TABLE IF NOT EXISTS categories (
    id INT AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    slug VARCHAR(100) NOT NULL UNIQUE,
    description TEXT,
    image_url VARCHAR(500),
    parent_id INT,
    sort_order INT DEFAULT 0,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (parent_id) REFERENCES categories(id) ON DELETE SET NULL,
    INDEX idx_categories_slug (slug),
    INDEX idx_categories_parent (parent_id),
    INDEX idx_categories_active (is_active)
);

-- Products table
CREATE TABLE IF NOT EXISTS products (
    id INT AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    slug VARCHAR(255) NOT NULL UNIQUE,
    description TEXT,
    short_description TEXT,
    sku VARCHAR(100) NOT NULL UNIQUE,
    price DECIMAL(10,2) NOT NULL,
    compare_price DECIMAL(10,2),
    cost_price DECIMAL(10,2),
    weight DECIMAL(8,2),
    dimensions VARCHAR(50),
    category_id INT,
    vendor_id INT,
    images JSON,
    tags JSON,
    inventory_quantity INT DEFAULT 0,
    track_inventory BOOLEAN DEFAULT TRUE,
    allow_backorder BOOLEAN DEFAULT FALSE,
    requires_shipping BOOLEAN DEFAULT TRUE,
    is_digital BOOLEAN DEFAULT FALSE,
    status ENUM('active', 'draft', 'archived') DEFAULT 'draft',
    featured BOOLEAN DEFAULT FALSE,
    seo_title VARCHAR(255),
    seo_description TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (category_id) REFERENCES categories(id) ON DELETE SET NULL,
    FOREIGN KEY (vendor_id) REFERENCES users(id) ON DELETE SET NULL,
    INDEX idx_products_slug (slug),
    INDEX idx_products_category (category_id),
    INDEX idx_products_vendor (vendor_id),
    INDEX idx_products_status (status),
    INDEX idx_products_featured (featured),
    INDEX idx_products_sku (sku),
    FULLTEXT idx_products_search (name, description, short_description)
);

-- Orders table
CREATE TABLE IF NOT EXISTS orders (
    id INT AUTO_INCREMENT PRIMARY KEY,
    order_number VARCHAR(50) NOT NULL UNIQUE,
    customer_id INT NOT NULL,
    email VARCHAR(255) NOT NULL,
    status ENUM('pending', 'confirmed', 'processing', 'shipped', 'delivered', 'cancelled', 'refunded') DEFAULT 'pending',
    currency VARCHAR(3) DEFAULT 'USD',
    subtotal DECIMAL(10,2) NOT NULL,
    tax_amount DECIMAL(10,2) DEFAULT 0,
    shipping_amount DECIMAL(10,2) DEFAULT 0,
    discount_amount DECIMAL(10,2) DEFAULT 0,
    total_amount DECIMAL(10,2) NOT NULL,
    payment_status ENUM('pending', 'paid', 'failed', 'refunded') DEFAULT 'pending',
    payment_method VARCHAR(50),
    payment_intent_id VARCHAR(255),
    shipping_address JSON,
    billing_address JSON,
    notes TEXT,
    shipped_at TIMESTAMP NULL,
    delivered_at TIMESTAMP NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (customer_id) REFERENCES users(id) ON DELETE RESTRICT,
    INDEX idx_orders_customer (customer_id),
    INDEX idx_orders_status (status),
    INDEX idx_orders_payment_status (payment_status),
    INDEX idx_orders_created (created_at),
    INDEX idx_orders_number (order_number)
);

-- Order items table
CREATE TABLE IF NOT EXISTS order_items (
    id INT AUTO_INCREMENT PRIMARY KEY,
    order_id INT NOT NULL,
    product_id INT NOT NULL,
    product_name VARCHAR(255) NOT NULL,
    product_sku VARCHAR(100) NOT NULL,
    quantity INT NOT NULL,
    unit_price DECIMAL(10,2) NOT NULL,
    total_price DECIMAL(10,2) NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (order_id) REFERENCES orders(id) ON DELETE CASCADE,
    FOREIGN KEY (product_id) REFERENCES products(id) ON DELETE RESTRICT,
    INDEX idx_order_items_order (order_id),
    INDEX idx_order_items_product (product_id)
);

-- Shopping cart table
CREATE TABLE IF NOT EXISTS cart (
    id INT AUTO_INCREMENT PRIMARY KEY,
    customer_id INT,
    session_id VARCHAR(255),
    product_id INT NOT NULL,
    quantity INT NOT NULL DEFAULT 1,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (customer_id) REFERENCES users(id) ON DELETE CASCADE,
    FOREIGN KEY (product_id) REFERENCES products(id) ON DELETE CASCADE,
    INDEX idx_cart_customer (customer_id),
    INDEX idx_cart_session (session_id),
    UNIQUE KEY unique_cart_item (customer_id, product_id),
    UNIQUE KEY unique_session_item (session_id, product_id)
);

-- Reviews table
CREATE TABLE IF NOT EXISTS reviews (
    id INT AUTO_INCREMENT PRIMARY KEY,
    product_id INT NOT NULL,
    customer_id INT NOT NULL,
    rating INT NOT NULL CHECK (rating >= 1 AND rating <= 5),
    title VARCHAR(255),
    content TEXT,
    verified_purchase BOOLEAN DEFAULT FALSE,
    status ENUM('pending', 'approved', 'rejected') DEFAULT 'pending',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (product_id) REFERENCES products(id) ON DELETE CASCADE,
    FOREIGN KEY (customer_id) REFERENCES users(id) ON DELETE CASCADE,
    INDEX idx_reviews_product (product_id),
    INDEX idx_reviews_customer (customer_id),
    INDEX idx_reviews_rating (rating),
    INDEX idx_reviews_status (status)
);

-- Insert sample data
INSERT INTO categories (name, slug, description, sort_order) VALUES 
('Clothing', 'clothing', 'Afrocentric clothing and apparel', 1),
('Accessories', 'accessories', 'Fashion accessories and jewelry', 2),
('Home & Living', 'home-living', 'Home decor and lifestyle products', 3),
('Art & Crafts', 'art-crafts', 'Traditional and contemporary art pieces', 4)
ON DUPLICATE KEY UPDATE name=VALUES(name);

EOF
fi

# Get list of migration files
echo "Checking for pending migrations..."
cd "$MIGRATION_DIR"
MIGRATION_FILES=$(ls *.sql 2>/dev/null | sort)

if [ -z "$MIGRATION_FILES" ]; then
    echo "No migration files found"
    exit 0
fi

# Run each migration that hasn't been executed yet
for migration_file in $MIGRATION_FILES; do
    echo "Processing migration: $migration_file"
    
    # Check if migration has already been executed
    executed=$(mysql -h "$DB_HOST" -P "$DB_PORT" -u "$DB_USER" -p"$DB_PASS" "$DB_NAME" -sN -e "SELECT COUNT(*) FROM migrations WHERE filename='$migration_file';")
    
    if [ "$executed" -eq 0 ]; then
        echo "Executing migration: $migration_file"
        
        # Execute the migration
        mysql -h "$DB_HOST" -P "$DB_PORT" -u "$DB_USER" -p"$DB_PASS" "$DB_NAME" < "$migration_file"
        
        if [ $? -eq 0 ]; then
            # Record the migration as executed
            mysql -h "$DB_HOST" -P "$DB_PORT" -u "$DB_USER" -p"$DB_PASS" "$DB_NAME" -e "INSERT INTO migrations (filename) VALUES ('$migration_file');"
            echo "Migration $migration_file executed successfully"
        else
            echo "ERROR: Migration $migration_file failed"
            exit 1
        fi
    else
        echo "Migration $migration_file already executed, skipping"
    fi
done

echo ""
echo "========================================"
echo "Migration completed successfully!"
echo "========================================"

# Show current database status
echo ""
echo "Database status:"
mysql -h "$DB_HOST" -P "$DB_PORT" -u "$DB_USER" -p"$DB_PASS" "$DB_NAME" -e "
SELECT 
    TABLE_NAME as 'Table',
    TABLE_ROWS as 'Rows',
    ROUND(((DATA_LENGTH + INDEX_LENGTH) / 1024 / 1024), 2) AS 'Size (MB)'
FROM information_schema.TABLES 
WHERE TABLE_SCHEMA = '$DB_NAME'
ORDER BY TABLE_NAME;
"

echo ""
echo "Executed migrations:"
mysql -h "$DB_HOST" -P "$DB_PORT" -u "$DB_USER" -p"$DB_PASS" "$DB_NAME" -e "SELECT filename, executed_at FROM migrations ORDER BY executed_at;"
