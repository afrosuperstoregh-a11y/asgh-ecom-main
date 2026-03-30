# Authentication Debug Guide

## Issue: 401 Unauthorized for /api/admin/products/178

### Root Cause Analysis
The error suggests that authentication is failing. Based on the code analysis:

1. **Token Format**: Expected format is `prod-jwt-token-admin-{timestamp}`
2. **Password Mismatch**: Login page shows `Admin123!` but validation expects `admin123`
3. **Missing Token**: If user isn't properly logged in, no token is sent

### Debug Steps

#### 1. Check if User is Logged In
Open browser console and run:
```javascript
// Check if token exists
localStorage.getItem('adminToken')
document.cookie

// Check token format
const token = localStorage.getItem('adminToken');
console.log('Token:', token);
console.log('Valid format:', token && token.startsWith('prod-jwt-token-admin-'));
```

#### 2. Test Login Process
1. Go to `/admin/login`
2. Use credentials:
   - Email: `admin@afrosuperstore.ca`
   - Password: `admin123` (note: lowercase)
3. Check console for debug logs
4. After login, check if token is stored

#### 3. Manual Token Test
If login fails, manually set a token:
```javascript
const token = `prod-jwt-token-admin-${Date.now()}`;
localStorage.setItem('adminToken', token);
document.cookie = `admin-token=${token}; path=/; max-age=86400`;
```

#### 4. Test API Call
```javascript
fetch('/api/admin/products/178', {
  headers: {
    'Authorization': `Bearer ${localStorage.getItem('adminToken')}`,
    'Content-Type': 'application/json'
  }
})
.then(res => res.json())
.then(console.log);
```

### Expected Server Logs
With the enhanced logging, you should see:
```
[DEBUG] === SINGLE PRODUCT API ROUTE CALLED ===
[DEBUG] Product ID from params: 178
[DEBUG] Auth header: { 
  hasAuth: true, 
  authPreview: "Bearer prod-jwt-token-ad...", 
  method: "GET", 
  url: "http://localhost:3000/api/admin/products/178" 
}
[DEBUG] Token validation result: { valid: true, user: {...} }
[DEBUG] Admin authenticated: info@afrosuperstore.ca
```

### If You See:
- `hasAuth: false` → Token not being sent
- `authPreview: "none"` → No Authorization header
- `Token validation result: { valid: false }` → Token format/expiry issue

### Quick Fix
1. **Fix Password**: Update login page default password to match validation
2. **Clear Storage**: Remove old tokens and re-login
3. **Check Network**: Ensure no middleware is stripping headers

### Test Commands
```bash
# Test with curl (replace TOKEN with actual token)
curl -H "Authorization: Bearer prod-jwt-token-admin-$(date +%s)000" \
     http://localhost:3000/api/admin/products/178
```
