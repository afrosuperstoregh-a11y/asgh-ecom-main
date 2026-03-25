-- Simple test data
INSERT INTO profiles (id, email, first_name, last_name, created_at, updated_at)
VALUES (
  '00000000-0000-0000-0000-000000000001',
  'testcustomer@example.com',
  'Test',
  'Customer',
  NOW(),
  NOW()
) ON CONFLICT (id) DO NOTHING;
