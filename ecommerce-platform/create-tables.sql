-- Create UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Create User table
CREATE TABLE IF NOT EXISTS users (
    id TEXT PRIMARY KEY DEFAULT uuid_generate_v4(),
    email TEXT UNIQUE NOT NULL,
    name TEXT,
    password TEXT,
    phone TEXT,
    emailVerified BOOLEAN DEFAULT false,
    emailVerificationToken TEXT,
    emailVerificationExpires TIMESTAMP,
    resetPasswordToken TEXT,
    resetPasswordExpires TIMESTAMP,
    lastLoginAt TIMESTAMP,
    loginAttempts INTEGER DEFAULT 0,
    lockedUntil TIMESTAMP,
    avatar TEXT,
    dateOfBirth DATE,
    gender TEXT,
    timezone TEXT DEFAULT 'UTC',
    language TEXT DEFAULT 'en',
    isActive BOOLEAN DEFAULT true,
    isGuest BOOLEAN DEFAULT false,
    createdAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updatedAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Create Categories table
CREATE TABLE IF NOT EXISTS categories (
    id TEXT PRIMARY KEY DEFAULT uuid_generate_v4(),
    name TEXT UNIQUE NOT NULL,
    slug TEXT UNIQUE NOT NULL,
    description TEXT,
    image TEXT,
    parentId TEXT,
    isActive BOOLEAN DEFAULT true,
    sortOrder INTEGER DEFAULT 0,
    createdAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updatedAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Create Products table
CREATE TABLE IF NOT EXISTS products (
    id TEXT PRIMARY KEY DEFAULT uuid_generate_v4(),
    name TEXT NOT NULL,
    slug TEXT UNIQUE NOT NULL,
    description TEXT,
    shortDesc TEXT,
    sku TEXT UNIQUE NOT NULL,
    price DECIMAL NOT NULL,
    comparePrice DECIMAL,
    cost DECIMAL,
    trackInventory BOOLEAN DEFAULT true,
    stock INTEGER DEFAULT 0,
    weight DECIMAL,
    dimensions JSON,
    images JSON,
    tags JSON,
    status TEXT DEFAULT 'DRAFT',
    featured BOOLEAN DEFAULT false,
    categoryId TEXT NOT NULL,
    createdAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updatedAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (categoryId) REFERENCES categories(id)
);

-- Create Addresses table
CREATE TABLE IF NOT EXISTS addresses (
    id TEXT PRIMARY KEY DEFAULT uuid_generate_v4(),
    userId TEXT NOT NULL,
    type TEXT DEFAULT 'SHIPPING',
    firstName TEXT NOT NULL,
    lastName TEXT NOT NULL,
    company TEXT,
    address1 TEXT NOT NULL,
    address2 TEXT,
    city TEXT NOT NULL,
    province TEXT NOT NULL,
    country TEXT NOT NULL,
    postalCode TEXT NOT NULL,
    phone TEXT,
    isDefault BOOLEAN DEFAULT false,
    createdAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updatedAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (userId) REFERENCES users(id)
);

-- Create Orders table
CREATE TABLE IF NOT EXISTS orders (
    id TEXT PRIMARY KEY DEFAULT uuid_generate_v4(),
    orderNumber TEXT UNIQUE NOT NULL,
    userId TEXT,
    guestEmail TEXT,
    status TEXT DEFAULT 'PENDING',
    currency TEXT DEFAULT 'USD',
    subtotal DECIMAL NOT NULL,
    taxAmount DECIMAL DEFAULT 0,
    shippingAmount DECIMAL DEFAULT 0,
    discountAmount DECIMAL DEFAULT 0,
    total DECIMAL NOT NULL,
    notes TEXT,
    shippingAddress JSON,
    billingAddress JSON,
    paymentStatus TEXT DEFAULT 'PENDING',
    paymentMethod TEXT,
    paymentId TEXT,
    trackingNumber TEXT,
    shippedAt TIMESTAMP,
    deliveredAt TIMESTAMP,
    createdAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updatedAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (userId) REFERENCES users(id)
);

-- Create OrderItems table
CREATE TABLE IF NOT EXISTS order_items (
    id TEXT PRIMARY KEY DEFAULT uuid_generate_v4(),
    orderId TEXT NOT NULL,
    productId TEXT NOT NULL,
    productName TEXT NOT NULL,
    productSku TEXT NOT NULL,
    quantity INTEGER NOT NULL,
    price DECIMAL NOT NULL,
    total DECIMAL NOT NULL,
    createdAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (orderId) REFERENCES orders(id),
    FOREIGN KEY (productId) REFERENCES products(id)
);

-- Create UserSessions table
CREATE TABLE IF NOT EXISTS user_sessions (
    id TEXT PRIMARY KEY DEFAULT uuid_generate_v4(),
    userId TEXT NOT NULL,
    token TEXT UNIQUE NOT NULL,
    refreshToken TEXT UNIQUE,
    deviceInfo JSON,
    isActive BOOLEAN DEFAULT true,
    expiresAt TIMESTAMP NOT NULL,
    lastUsedAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    createdAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (userId) REFERENCES users(id) ON DELETE CASCADE
);

-- Create SocialAccounts table
CREATE TABLE IF NOT EXISTS social_accounts (
    id TEXT PRIMARY KEY DEFAULT uuid_generate_v4(),
    userId TEXT NOT NULL,
    provider TEXT NOT NULL,
    providerId TEXT NOT NULL,
    accessToken TEXT,
    refreshToken TEXT,
    email TEXT,
    name TEXT,
    avatar TEXT,
    createdAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updatedAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (userId) REFERENCES users(id) ON DELETE CASCADE,
    UNIQUE(provider, providerId)
);

-- Create UserTokens table
CREATE TABLE IF NOT EXISTS user_tokens (
    id TEXT PRIMARY KEY DEFAULT uuid_generate_v4(),
    userId TEXT NOT NULL,
    token TEXT UNIQUE NOT NULL,
    type TEXT NOT NULL,
    purpose TEXT,
    expiresAt TIMESTAMP NOT NULL,
    usedAt TIMESTAMP,
    metadata JSON,
    createdAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (userId) REFERENCES users(id) ON DELETE CASCADE
);

-- Create WishlistItems table
CREATE TABLE IF NOT EXISTS wishlist_items (
    id TEXT PRIMARY KEY DEFAULT uuid_generate_v4(),
    userId TEXT NOT NULL,
    productId TEXT NOT NULL,
    addedAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (userId) REFERENCES users(id) ON DELETE CASCADE,
    FOREIGN KEY (productId) REFERENCES products(id) ON DELETE CASCADE,
    UNIQUE(userId, productId)
);

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);
CREATE INDEX IF NOT EXISTS idx_users_emailVerified ON users(emailVerified);
CREATE INDEX IF NOT EXISTS idx_products_categoryId ON products(categoryId);
CREATE INDEX IF NOT EXISTS idx_products_status ON products(status);
CREATE INDEX IF NOT EXISTS idx_orders_userId ON orders(userId);
CREATE INDEX IF NOT EXISTS idx_orders_status ON orders(status);
CREATE INDEX IF NOT EXISTS idx_user_sessions_userId ON user_sessions(userId);
CREATE INDEX IF NOT EXISTS idx_user_sessions_token ON user_sessions(token);
CREATE INDEX IF NOT EXISTS idx_wishlist_items_userId ON wishlist_items(userId);

-- Update updatedAt trigger function
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updatedAt = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Create triggers for updatedAt
CREATE TRIGGER update_users_updated_at BEFORE UPDATE ON users FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_categories_updated_at BEFORE UPDATE ON categories FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_products_updated_at BEFORE UPDATE ON products FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_addresses_updated_at BEFORE UPDATE ON addresses FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_orders_updated_at BEFORE UPDATE ON orders FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_social_accounts_updated_at BEFORE UPDATE ON social_accounts FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
