-- Create Super Admin User for AfroSuperStore
-- Email: info@afrosuperstore.ca
-- Password: Iamtech@100

-- Hash the password (using bcrypt hash for "Iamtech@100")
-- Generated hash: $2b$10$ravrUoIKPiF6uLvznFeIFOu.eqxPKugqCj1lp9rU4BgKsIml4Pr7u
INSERT INTO users (
    id,
    email,
    name,
    password,
    phone,
    emailVerified,
    createdAt,
    updatedAt
) VALUES (
    'admin-001',
    'info@afrosuperstore.ca',
    'Super Admin',
    '$2b$10$ravrUoIKPiF6uLvznFeIFOu.eqxPKugqCj1lp9rU4BgKsIml4Pr7u',
    NULL,
    true,
    CURRENT_TIMESTAMP,
    CURRENT_TIMESTAMP
) ON CONFLICT (email) DO NOTHING;

-- Alternative for MySQL version if needed:
/*
INSERT INTO users (
    email,
    password_hash,
    first_name,
    last_name,
    role,
    email_verified,
    created_at,
    updated_at
) VALUES (
    'info@afrosuperstore.ca',
    '$2a$10$rOzJqQjQjQjQjQjQjQjQjOzJqQjQjQjQjQjQjQjQjQjQjQjQjQjQjQjQjQjQjO',
    'Super',
    'Admin',
    'admin',
    true,
    CURRENT_TIMESTAMP,
    CURRENT_TIMESTAMP
) ON DUPLICATE KEY UPDATE email=VALUES(email);
*/
