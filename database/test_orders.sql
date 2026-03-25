-- Test Orders for API Development
-- This file creates sample orders to test the admin orders API

-- First, let's create a test customer if it doesn't exist
INSERT INTO users (id, email, password_hash, first_name, last_name, role, email_verified, created_at, updated_at)
VALUES (
  '00000000-0000-0000-0000-000000000001',
  'testcustomer@example.com',
  'hashed_password',
  'Test',
  'Customer',
  'customer',
  true,
  NOW(),
  NOW()
) ON CONFLICT (id) DO NOTHING;
                                          
-- Create sample orders 
INSERT INTO orders (
    id, 
    order_number, 
    customer_id, 
    email, 
    status, 
    currency, 
    subtotal, 
    tax_amount, 
    shipping_amount, 
    discount_amount, 
    total_amount, 
    payment_status, 
    payment_method, 
    created_at, 
    updated_at
) VALUES 
(
    '10000000-0000-0000-0000-000000000001',
    'ORD-2024-001',
    '00000000-0000-0000-0000-000000000001',
    'testcustomer@example.com',
    'pending',
    'USD',
    99.99,
    8.00,
    10.00,
    0.00,
    117.99,
    'pending',
    'stripe',
    NOW() - INTERVAL '1 day',
    NOW() - INTERVAL '1 day'
),
(
    '10000000-0000-0000-0000-000000000002',
    'ORD-2024-002',
    '00000000-0000-0000-0000-000000000001',
    'testcustomer@example.com',
    'confirmed',
    'USD',
    149.99,
    12.00,
    10.00,
    10.00,
    161.99,
    'paid',
    'stripe',
    NOW() - INTERVAL '2 days',
    NOW() - INTERVAL '2 days'
),
(
    '10000000-0000-0000-0000-000000000003',
    'ORD-2024-003',
    '00000000-0000-0000-0000-000000000001',
    'testcustomer@example.com',
    'processing',
    'USD',
    79.99,
    6.40,
    10.00,
    0.00,
    96.39,
    'paid',
    'paypal',
    NOW() - INTERVAL '3 days',
    NOW() - INTERVAL '3 days'
),
(
    '10000000-0000-0000-0000-000000000004',
    'ORD-2024-004',
    '00000000-0000-0000-0000-000000000001',
    'testcustomer@example.com',
    'shipped',
    'USD',
    199.99,
    16.00,
    15.00,
    20.00,
    210.99,
    'paid',
    'stripe',
    NOW() - INTERVAL '5 days',
    NOW() - INTERVAL '4 days'
),
(
    '10000000-0000-0000-0000-000000000005',
    'ORD-2024-005',
    '00000000-0000-0000-0000-000000000001',
    'testcustomer@example.com',
    'delivered',
    'USD',
    59.99,
    4.80,
    10.00,
    0.00,
    74.79,
    'paid',
    'stripe',
    NOW() - INTERVAL '7 days',
    NOW() - INTERVAL '6 days'
) ON CONFLICT (id) DO NOTHING;

-- Create sample order items (we'll need sample products first)
-- Let's create a couple of sample products
INSERT INTO products (
    id, 
    name, 
    slug, 
    description, 
    sku, 
    price, 
    category_id, 
    inventory_quantity, 
    status, 
    created_at, 
    updated_at
) VALUES 
(
    '20000000-0000-0000-0000-000000000001',
    'Afro Print T-Shirt',
    'afro-print-t-shirt',
    'Beautiful Afro-inspired print t-shirt made from premium cotton.',
    'TSHIRT-001',
    29.99,
    (SELECT id FROM categories WHERE slug = 'clothing' LIMIT 1),
    100,
    'active',
    NOW(),
    NOW()
),
(
    '20000000-0000-0000-0000-000000000002',
    'Ankara Backpack',
    'ankara-backpack',
    'Stylish backpack featuring traditional Ankara fabric patterns.',
    'BACKPACK-001',
    49.99,
    (SELECT id FROM categories WHERE slug = 'accessories' LIMIT 1),
    50,
    'active',
    NOW(),
    NOW()
) ON CONFLICT (id) DO NOTHING;

-- Create order items for the sample orders
INSERT INTO order_items (
    id, 
    order_id, 
    product_id, 
    product_name, 
    product_sku, 
    quantity, 
    unit_price, 
    total_price, 
    created_at
) VALUES 
-- Order 1 items
(
    '30000000-0000-0000-0000-000000000001',
    '10000000-0000-0000-0000-000000000001',
    '20000000-0000-0000-0000-000000000001',
    'Afro Print T-Shirt',
    'TSHIRT-001',
    2,
    29.99,
    59.98,
    NOW() - INTERVAL '1 day'
),
(
    '30000000-0000-0000-0000-000000000002',
    '10000000-0000-0000-0000-000000000001',
    '20000000-0000-0000-0000-000000000002',
    'Ankara Backpack',
    'BACKPACK-001',
    1,
    49.99,
    49.99,
    NOW() - INTERVAL '1 day'
),
-- Order 2 items
(
    '30000000-0000-0000-0000-000000000003',
    '10000000-0000-0000-0000-000000000002',
    '20000000-0000-0000-0000-000000000001',
    'Afro Print T-Shirt',
    'TSHIRT-001',
    3,
    29.99,
    89.97,
    NOW() - INTERVAL '2 days'
),
(
    '30000000-0000-0000-0000-000000000004',
    '10000000-0000-0000-0000-000000000002',
    '20000000-0000-0000-0000-000000000002',
    'Ankara Backpack',
    'BACKPACK-001',
    2,
    49.99,
    99.98,
    NOW() - INTERVAL '2 days'
),
-- Order 3 items
(
    '30000000-0000-0000-0000-000000000005',
    '10000000-0000-0000-0000-000000000003',
    '20000000-0000-0000-0000-000000000001',
    'Afro Print T-Shirt',
    'TSHIRT-001',
    1,
    29.99,
    29.99,
    NOW() - INTERVAL '3 days'
),
(
    '30000000-0000-0000-0000-000000000006',
    '10000000-0000-0000-0000-000000000003',
    '20000000-0000-0000-0000-000000000002',
    'Ankara Backpack',
    'BACKPACK-001',
    1,
    49.99,
    49.99,
    NOW() - INTERVAL '3 days'
) ON CONFLICT (id) DO NOTHING;

-- Create sample payments
INSERT INTO payments (
    id, 
    order_id, 
    amount, 
    currency, 
    status, 
    payment_method, 
    payment_intent_id, 
    created_at, 
    updated_at
) VALUES 
(
    '40000000-0000-0000-0000-000000000001',
    '10000000-0000-0000-0000-000000000001',
    117.99,
    'USD',
    'pending',
    'stripe',
    'pi_test_001',
    NOW() - INTERVAL '1 day',
    NOW() - INTERVAL '1 day'
),
(
    '40000000-0000-0000-0000-000000000002',
    '10000000-0000-0000-0000-000000000002',
    161.99,
    'USD',
    'succeeded',
    'stripe',
    'pi_test_002',
    NOW() - INTERVAL '2 days',
    NOW() - INTERVAL '2 days'
),
(
    '40000000-0000-0000-0000-000000000003',
    '10000000-0000-0000-0000-000000000003',
    96.39,
    'USD',
    'succeeded',
    'paypal',
    'paypal_test_003',
    NOW() - INTERVAL '3 days',
    NOW() - INTERVAL '3 days'
),
(
    '40000000-0000-0000-0000-000000000004',
    '10000000-0000-0000-0000-000000000004',
    210.99,
    'USD',
    'succeeded',
    'stripe',
    'pi_test_004',
    NOW() - INTERVAL '5 days',
    NOW() - INTERVAL '4 days'
),
(
    '40000000-0000-0000-0000-000000000005',
    '10000000-0000-0000-0000-000000000005',
    74.79,
    'USD',
    'succeeded',
    'stripe',
    'pi_test_005',
    NOW() - INTERVAL '7 days',
    NOW() - INTERVAL '6 days'
) ON CONFLICT (id) DO NOTHING;

COMMIT;
