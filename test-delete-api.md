# DELETE API Authentication Fix - Test Guide

## Problem Fixed
DELETE requests to `/api/admin/products/:id` were returning 401 Unauthorized while GET requests worked fine.

## Root Cause
There were two conflicting DELETE endpoints:
1. `/api/admin/products/route.ts` - Expected ID in query params (`?id=123`)
2. `/api/admin/products/[id]/route.ts` - Expected ID in URL params (`/123`)

The frontend was calling `/api/admin/products/123` but the main route.ts was looking for query parameters.

## Solution Applied
- Removed the conflicting DELETE method from `/api/admin/products/route.ts`
- Enhanced logging in `/api/admin/products/[id]/route.ts` for debugging
- The `[id]/route.ts` now handles all DELETE requests correctly

## Test Commands

### 1. Test Authentication Flow
```bash
# First login to get a token
curl -X POST http://localhost:3000/api/admin/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"admin@afrosuperstore.ca","password":"admin123"}'

# Extract token from response and use it for DELETE test
TOKEN="prod-jwt-token-admin-$(date +%s)000"

# Test DELETE with proper authentication
curl -X DELETE http://localhost:3000/api/admin/products/123 \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -v
```

### 2. Test Without Authentication (Should Return 401)
```bash
curl -X DELETE http://localhost:3000/api/admin/products/123 \
  -H "Content-Type: application/json" \
  -v
```

### 3. Test With Invalid Token (Should Return 401)
```bash
curl -X DELETE http://localhost:3000/api/admin/products/123 \
  -H "Authorization: Bearer invalid-token" \
  -H "Content-Type: application/json" \
  -v
```

## Expected Results

### ✅ Successful DELETE (200 OK)
```json
{
  "success": true,
  "message": "Product deleted successfully"
}
```

### ❌ Failed Authentication (401 Unauthorized)
```json
{
  "success": false,
  "message": "Unauthorized - Invalid admin token"
}
```

## Debug Logs
The enhanced DELETE endpoint now logs:
- Authentication header presence
- Token validation results
- Request method and URL
- Detailed error messages

Check the server logs for these debug messages when testing.

## Frontend Usage
The frontend API client now works correctly:
```typescript
// This now works as expected
adminApi.products.delete('123')
// Makes DELETE request to /api/admin/products/123
// Includes Authorization: Bearer <token> header
```

## Verification Checklist
- [ ] DELETE requests include Authorization header
- [ ] Token format is "Bearer prod-jwt-token-*"
- [ ] Server logs show authentication success
- [ ] Response returns 200 OK for valid requests
- [ ] Response returns 401 for invalid/missing tokens
- [ ] Product is actually deleted from database
- [ ] Other HTTP methods (GET, POST, PUT) still work
