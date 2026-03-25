-- Test Orders for API Development
-- This file creates sample orders to test the admin orders API

-- First, let's create a test customer profile if it doesn't exist
INSERT INTO profiles (id, email, first_name, last_name, created_at, updated_at)
VALUES (
  '00000000-0000-0000-0000-000000000001',
  'testcustomer@example.com',
  'Test',
  'Customer',
  NOW(),
  NOW()
) ON CONFLICT (id) DO NOTHING;

-- Create sample orders
INSERT INTO orders (
    id, 
    order_number, 
    user_id, 
    guest_email, 
    status, 
    currency, 
    subtotal, 
    tax_amount, 
    shipping_amount, 
    total, 
    payment_status, 
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
    117.99,
    'pending',
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
    161.99,
    'paid',
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
    96.39,
    'paid',
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
    210.99,
    'paid',
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
    74.79,
    'paid',
    NOW() - INTERVAL '7 days',
    NOW() - INTERVAL '6 days'
) ON CONFLICT (id) DO NOTHING;
