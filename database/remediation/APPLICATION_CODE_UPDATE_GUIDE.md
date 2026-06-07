# Application Code Update Guide
**AfroSuperStore Database Remediation**
**Date:** June 2, 2026

---

## Overview

This guide provides detailed instructions for updating application code to work with the new canonical database schema after the remediation migration.

---

## Breaking Changes Summary

### Column Renames

| Table | Old Column | New Column | Type | Impact |
|-------|------------|------------|------|--------|
| orders | customer_id | user_id | UUID | HIGH - all order queries |
| orders | email | guest_email | TEXT | MEDIUM - guest orders |
| orders | total_amount | total | DECIMAL | HIGH - all order calculations |
| order_items | unit_price | price | DECIMAL | MEDIUM - order item display |
| order_items | total_price | total | DECIMAL | MEDIUM - order item totals |
| payments | payment_method | provider | TEXT | MEDIUM - payment processing |
| payments | payment_intent_id | provider_id | TEXT | MEDIUM - payment tracking |

### Table Changes

| Action | Table | Details |
|--------|-------|---------|
| Removed | users | Replaced by profiles |
| Added | profiles | Extends auth.users |
| Added | admin_users | Admin-specific data |
| Added | deleted_at | All major tables (soft delete) |

### New Columns

| Table | New Column | Type | Purpose |
|-------|------------|------|---------|
| orders | payment_provider | TEXT | Payment provider name |
| orders | payment_details | JSONB | Payment metadata |
| orders | payment_reference | TEXT | Payment reference ID |
| all major tables | deleted_at | TIMESTAMPTZ | Soft delete timestamp |

---

## TypeScript/JavaScript Updates

### Backend API Updates

#### Order Model

```typescript
// BEFORE
interface Order {
  id: string;
  customer_id: string;
  email: string;
  total_amount: number;
  // ...
}

// AFTER
interface Order {
  id: string;
  user_id: string;
  guest_email: string | null;
  total: number;
  payment_provider: string | null;
  payment_details: Record<string, any> | null;
  payment_reference: string | null;
  deleted_at: string | null;
  // ...
}
```

#### Order Item Model

```typescript
// BEFORE
interface OrderItem {
  id: string;
  order_id: string;
  product_id: string;
  unit_price: number;
  total_price: number;
  quantity: number;
  // ...
}

// AFTER
interface OrderItem {
  id: string;
  order_id: string;
  product_id: string;
  price: number;
  total: number;
  quantity: number;
  // ...
}
```

#### Payment Model

```typescript
// BEFORE
interface Payment {
  id: string;
  order_id: string;
  payment_method: string;
  payment_intent_id: string;
  // ...
}

// AFTER
interface Payment {
  id: string;
  order_id: string;
  provider: string;
  provider_id: string;
  // ...
}
```

#### User/Profile Model

```typescript
// BEFORE
interface User {
  id: string;
  email: string;
  password_hash: string;
  first_name: string;
  last_name: string;
  role: string;
  // ...
}

// AFTER
interface Profile {
  id: string;
  user_id: string; // References auth.users
  first_name: string;
  last_name: string;
  phone: string | null;
  role: string;
  email_verified: boolean;
  avatar_url: string | null;
  deleted_at: string | null;
  // ...
}
```

### Database Query Updates

#### Order Queries

```typescript
// BEFORE
const orders = await db.query(
  'SELECT * FROM orders WHERE customer_id = $1',
  [userId]
);

// AFTER
const orders = await db.query(
  'SELECT * FROM orders WHERE user_id = $1 AND deleted_at IS NULL',
  [userId]
);
```

#### Cart Queries

```typescript
// BEFORE
const cart = await db.query(
  'SELECT * FROM cart WHERE customer_id = $1',
  [userId]
);

// AFTER
const cart = await db.query(
  'SELECT * FROM cart WHERE user_id = $1',
  [userId]
);
```

#### Review Queries

```typescript
// BEFORE
const reviews = await db.query(
  'SELECT * FROM reviews WHERE customer_id = $1',
  [userId]
);

// AFTER
const reviews = await db.query(
  'SELECT * FROM reviews WHERE user_id = $1',
  [userId]
);
```

### API Response Updates

#### Order Response

```typescript
// BEFORE
{
  "id": "uuid",
  "customer_id": "uuid",
  "email": "user@example.com",
  "total_amount": 100.00,
  "payment_method": "stripe",
  "payment_intent_id": "pi_123"
}

// AFTER
{
  "id": "uuid",
  "user_id": "uuid",
  "guest_email": "user@example.com",
  "total": 100.00,
  "payment_provider": "stripe",
  "payment_details": {...},
  "payment_reference": "pi_123"
}
```

---

## SQL Query Updates

### Direct SQL Queries

#### Order Queries

```sql
-- BEFORE
SELECT * FROM orders WHERE customer_id = $1;

-- AFTER
SELECT * FROM orders WHERE user_id = $1 AND deleted_at IS NULL;
```

#### Order Creation

```sql
-- BEFORE
INSERT INTO orders (customer_id, email, total_amount, payment_method)
VALUES ($1, $2, $3, $4);

-- AFTER
INSERT INTO orders (user_id, guest_email, total, payment_provider, payment_details, payment_reference)
VALUES ($1, $2, $3, $4, $5, $6);
```

#### Order Item Creation

```sql
-- BEFORE
INSERT INTO order_items (order_id, product_id, unit_price, total_price, quantity)
VALUES ($1, $2, $3, $4, $5);

-- AFTER
INSERT INTO order_items (order_id, product_id, price, total, quantity)
VALUES ($1, $2, $3, $4, $5);
```

#### Payment Processing

```sql
-- BEFORE
INSERT INTO payments (order_id, payment_method, payment_intent_id, amount)
VALUES ($1, $2, $3, $4);

-- AFTER
INSERT INTO payments (order_id, provider, provider_id, amount)
VALUES ($1, $2, $3, $4);
```

---

## Frontend Updates

### React Components

#### Order Display

```typescript
// BEFORE
const OrderCard = ({ order }) => (
  <div>
    <p>Order ID: {order.id}</p>
    <p>Customer: {order.customer_id}</p>
    <p>Email: {order.email}</p>
    <p>Total: ${order.total_amount}</p>
    <p>Payment: {order.payment_method}</p>
  </div>
);

// AFTER
const OrderCard = ({ order }) => (
  <div>
    <p>Order ID: {order.id}</p>
    <p>User: {order.user_id}</p>
    <p>Guest Email: {order.guest_email}</p>
    <p>Total: ${order.total}</p>
    <p>Payment: {order.payment_provider}</p>
  </div>
);
```

#### Cart Display

```typescript
// BEFORE
const CartItem = ({ item }) => (
  <div>
    <p>Product: {item.product_name}</p>
    <p>Price: ${item.unit_price}</p>
    <p>Total: ${item.total_price}</p>
  </div>
);

// AFTER
const CartItem = ({ item }) => (
  <div>
    <p>Product: {item.product_name}</p>
    <p>Price: ${item.price}</p>
    <p>Total: ${item.total}</p>
  </div>
);
```

### API Calls

#### Order API

```typescript
// BEFORE
const response = await fetch('/api/orders', {
  method: 'POST',
  body: JSON.stringify({
    customer_id: userId,
    email: userEmail,
    total_amount: total,
    payment_method: 'stripe'
  })
});

// AFTER
const response = await fetch('/api/orders', {
  method: 'POST',
  body: JSON.stringify({
    user_id: userId,
    guest_email: userEmail,
    total: total,
    payment_provider: 'stripe',
    payment_details: {...},
    payment_reference: reference
  })
});
```

---

## Supabase Client Updates

### Authentication

```typescript
// BEFORE - Using custom users table
const { data, error } = await supabase
  .from('users')
  .select('*')
  .eq('id', userId)
  .single();

// AFTER - Using profiles table
const { data, error } = await supabase
  .from('profiles')
  .select('*')
  .eq('user_id', userId)
  .single();
```

### Order Queries

```typescript
// BEFORE
const { data, error } = await supabase
  .from('orders')
  .select('*')
  .eq('customer_id', userId);

// AFTER
const { data, error } = await supabase
  .from('orders')
  .select('*')
  .eq('user_id', userId)
  .is('deleted_at', null);
```

---

## Environment Variables

### New Required Variables

```bash
# Admin User Creation
ADMIN_EMAIL=admin@yourdomain.com
ADMIN_PASSWORD=secure_password_here
ADMIN_FIRST_NAME=Admin
ADMIN_LAST_NAME=User
```

---

## File-by-File Update Checklist

### Backend Files

- [ ] `backend/api/orders.ts` - Update order queries and responses
- [ ] `backend/api/products.ts` - Update product queries (add deleted_at filter)
- [ ] `backend/api/categories.ts` - Update category queries (add deleted_at filter)
- [ ] `backend/api/cart.ts` - Update cart queries (customer_id → user_id)
- [ ] `backend/api/reviews.ts` - Update review queries (customer_id → user_id)
- [ ] `backend/api/payments.ts` - Update payment queries (provider, provider_id)
- [ ] `backend/models/Order.ts` - Update Order interface
- [ ] `backend/models/OrderItem.ts` - Update OrderItem interface
- [ ] `backend/models/Payment.ts` - Update Payment interface
- [ ] `backend/models/User.ts` - Update User/Profile interface
- [ ] `backend/lib/database.ts` - Update connection and query functions
- [ ] `backend/middleware/auth.ts` - Update auth to use profiles

### Frontend Files

- [ ] `frontend/components/OrderCard.tsx` - Update field names
- [ ] `frontend/components/CartItem.tsx` - Update field names
- [ ] `frontend/components/CheckoutForm.tsx` - Update API calls
- [ ] `frontend/components/OrderHistory.tsx` - Update API calls
- [ ] `frontend/pages/orders/[id].tsx` - Update data fetching
- [ ] `frontend/pages/cart.tsx` - Update data fetching
- [ ] `frontend/lib/api.ts` - Update API functions
- [ ] `frontend/types/index.ts` - Update TypeScript interfaces

---

## Testing Checklist

### Unit Tests

- [ ] Update order model tests
- [ ] Update order item model tests
- [ ] Update payment model tests
- [ ] Update user/profile model tests
- [ ] Update API endpoint tests
- [ ] Update database query tests

### Integration Tests

- [ ] Test order creation with new schema
- [ ] Test order retrieval with new schema
- [ ] Test cart operations with new schema
- [ ] Test payment processing with new schema
- [ ] Test user authentication with profiles
- [ ] Test admin operations with new schema

### E2E Tests

- [ ] Test complete checkout flow
- [ ] Test user registration and login
- [ ] Test order history display
- [ ] Test cart management
- [ ] Test admin panel functionality

---

## Migration Script for Code

### Automated Find and Replace

```bash
# Create a script to automate common replacements
# Replace customer_id with user_id
find . -type f -name "*.ts" -o -name "*.tsx" -o -name "*.js" -o -name "*.jsx" | \
  xargs sed -i 's/customer_id/user_id/g'

# Replace total_amount with total
find . -type f -name "*.ts" -o -name "*.tsx" -o -name "*.js" -o -name "*.jsx" | \
  xargs sed -i 's/total_amount/total/g'

# Replace unit_price with price
find . -type f -name "*.ts" -o -name "*.tsx" -o -name "*.js" -o -name "*.jsx" | \
  xargs sed -i 's/unit_price/price/g'

# Replace payment_method with provider
find . -type f -name "*.ts" -o -name "*.tsx" -o -name "*.js" -o -name "*.jsx" | \
  xargs sed -i 's/payment_method/provider/g'

# Replace payment_intent_id with provider_id
find . -type f -name "*.ts" -o -name "*.tsx" -o -name "*.js" -o -name "*.jsx" | \
  xargs sed -i 's/payment_intent_id/provider_id/g'
```

**Warning:** Review all automated replacements manually to ensure correctness.

---

## Rollback Plan for Code

If issues are found after migration:

1. **Revert Code Changes**
   ```bash
   git revert <commit-hash>
   ```

2. **Restore Database**
   ```bash
   psql afrosuperstore < backup_YYYYMMDD.sql
   ```

3. **Redeploy Application**
   ```bash
   npm run build
   npm run deploy
   ```

---

## Validation After Code Updates

### Compile Check

```bash
npm run build
```

**Expected:** No compilation errors

### Type Check

```bash
npm run type-check
```

**Expected:** No type errors

### Lint Check

```bash
npm run lint
```

**Expected:** No lint errors

### Test Suite

```bash
npm run test
```

**Expected:** All tests pass

---

## Estimated Effort

| Task | Estimated Hours |
|------|-----------------|
| Backend model updates | 2-3 hours |
| Backend API updates | 4-6 hours |
| Frontend component updates | 3-4 hours |
| Frontend API call updates | 2-3 hours |
| Test updates | 3-4 hours |
| Validation and testing | 2-3 hours |
| **Total** | **16-23 hours** |

---

## Success Criteria

- [ ] All TypeScript files compile without errors
- [ ] All type checks pass
- [ ] All lint checks pass
- [ ] All unit tests pass
- [ ] All integration tests pass
- [ ] All E2E tests pass
- [ ] Application runs without errors
- [ ] API endpoints return correct data
- [ ] Frontend displays data correctly

---

## Next Steps

1. Review this guide with development team
2. Assign tasks to developers
3. Create feature branch for code updates
4. Implement changes following checklist
5. Run automated find/replace where appropriate
6. Manual review of all changes
7. Update tests
8. Run test suite
9. Code review
10. Merge to main branch
11. Deploy to staging
12. Validate with staging database
13. Deploy to production after migration

---

**Last Updated:** June 2, 2026
