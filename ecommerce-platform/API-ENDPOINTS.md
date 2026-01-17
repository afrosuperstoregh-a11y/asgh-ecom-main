# Authentication & User Accounts API Endpoints

## Authentication Endpoints

### POST /api/auth/register
**Purpose**: User registration with email verification
**Rate Limit**: 5 requests per minute per IP

**Request Body**:
```json
{
  "email": "user@example.com",
  "password": "securePassword123",
  "name": "John Doe",
  "phone": "+1234567890"
}
```

**Response (201)**:
```json
{
  "success": true,
  "message": "Registration successful. Please check your email to verify your account.",
  "data": {
    "user": {
      "id": "uuid",
      "email": "user@example.com",
      "name": "John Doe",
      "emailVerified": false,
      "createdAt": "2024-01-01T00:00:00Z"
    }
  }
}
```

**Error Responses**:
- 400: Validation error
- 409: Email already exists
- 429: Rate limit exceeded

---

### POST /api/auth/login
**Purpose**: User authentication with JWT tokens
**Rate Limit**: 10 requests per minute per IP

**Request Body**:
```json
{
  "email": "user@example.com",
  "password": "securePassword123",
  "rememberMe": false
}
```

**Response (200)**:
```json
{
  "success": true,
  "message": "Login successful",
  "data": {
    "user": {
      "id": "uuid",
      "email": "user@example.com",
      "name": "John Doe",
      "emailVerified": true,
      "avatar": "https://example.com/avatar.jpg"
    },
    "tokens": {
      "accessToken": "jwt_access_token",
      "refreshToken": "jwt_refresh_token",
      "expiresIn": 3600
    }
  }
}
```

**Error Responses**:
- 400: Validation error
- 401: Invalid credentials
- 403: Account locked or not verified
- 429: Rate limit exceeded

---

### POST /api/auth/logout
**Purpose**: Invalidate user session
**Authentication**: Required (Bearer token)

**Request Headers**:
```
Authorization: Bearer <access_token>
```

**Response (200)**:
```json
{
  "success": true,
  "message": "Logout successful"
}
```

---

### POST /api/auth/refresh
**Purpose**: Refresh access token using refresh token

**Request Body**:
```json
{
  "refreshToken": "jwt_refresh_token"
}
```

**Response (200)**:
```json
{
  "success": true,
  "data": {
    "accessToken": "new_jwt_access_token",
    "expiresIn": 3600
  }
}
```

---

### POST /api/auth/forgot-password
**Purpose**: Initiate password reset process
**Rate Limit**: 3 requests per hour per email

**Request Body**:
```json
{
  "email": "user@example.com"
}
```

**Response (200)**:
```json
{
  "success": true,
  "message": "Password reset instructions sent to your email"
}
```

---

### POST /api/auth/reset-password
**Purpose**: Reset password with token

**Request Body**:
```json
{
  "token": "reset_token_from_email",
  "newPassword": "newSecurePassword123"
}
```

**Response (200)**:
```json
{
  "success": true,
  "message": "Password reset successful"
}
```

---

### POST /api/auth/verify-email
**Purpose**: Verify email address with token

**Request Body**:
```json
{
  "token": "verification_token_from_email"
}
```

**Response (200)**:
```json
{
  "success": true,
  "message": "Email verified successfully"
}
```

---

### POST /api/auth/resend-verification
**Purpose**: Resend email verification
**Rate Limit**: 3 requests per hour per email

**Request Body**:
```json
{
  "email": "user@example.com"
}
```

---

## Social Authentication Endpoints

### GET /api/auth/social/google
**Purpose**: Initiate Google OAuth flow

**Query Parameters**:
- `redirect_uri`: URL to redirect after authentication

**Response**: Redirect to Google OAuth

---

### GET /api/auth/google/callback
**Purpose**: Handle Google OAuth callback

**Query Parameters**:
- `code`: Authorization code from Google
- `state`: CSRF protection state

**Response**: Redirect with tokens or error

---

### POST /api/auth/social/link
**Purpose**: Link social account to existing user
**Authentication**: Required

**Request Body**:
```json
{
  "provider": "GOOGLE",
  "accessToken": "social_platform_access_token"
}
```

---

### DELETE /api/auth/social/unlink
**Purpose**: Unlink social account
**Authentication**: Required

**Request Body**:
```json
{
  "provider": "GOOGLE"
}
```

---

## User Profile Endpoints

### GET /api/user/profile
**Purpose**: Get current user profile
**Authentication**: Required

**Response (200)**:
```json
{
  "success": true,
  "data": {
    "id": "uuid",
    "email": "user@example.com",
    "name": "John Doe",
    "phone": "+1234567890",
    "avatar": "https://example.com/avatar.jpg",
    "dateOfBirth": "1990-01-01",
    "gender": "male",
    "timezone": "UTC",
    "language": "en",
    "emailVerified": true,
    "createdAt": "2024-01-01T00:00:00Z",
    "lastLoginAt": "2024-01-01T12:00:00Z"
  }
}
```

---

### PUT /api/user/profile
**Purpose**: Update user profile
**Authentication**: Required

**Request Body**:
```json
{
  "name": "John Smith",
  "phone": "+1234567890",
  "dateOfBirth": "1990-01-01",
  "gender": "male",
  "timezone": "America/New_York",
  "language": "en"
}
```

---

### PUT /api/user/password
**Purpose**: Change user password
**Authentication**: Required

**Request Body**:
```json
{
  "currentPassword": "currentPassword123",
  "newPassword": "newPassword123"
}
```

---

### POST /api/user/avatar
**Purpose**: Upload user avatar
**Authentication**: Required
**Content-Type**: multipart/form-data

**Request Body**:
- `avatar`: Image file (max 5MB, jpg/png/webp)

---

### DELETE /api/user/avatar
**Purpose**: Remove user avatar
**Authentication**: Required

---

## Address Management Endpoints

### GET /api/user/addresses
**Purpose**: Get user addresses
**Authentication**: Required

**Response (200)**:
```json
{
  "success": true,
  "data": [
    {
      "id": "uuid",
      "type": "SHIPPING",
      "firstName": "John",
      "lastName": "Doe",
      "company": "Acme Corp",
      "address1": "123 Main St",
      "address2": "Apt 4B",
      "city": "New York",
      "province": "NY",
      "country": "US",
      "postalCode": "10001",
      "phone": "+1234567890",
      "isDefault": true,
      "isVerified": true
    }
  ]
}
```

---

### POST /api/user/addresses
**Purpose**: Create new address
**Authentication**: Required

**Request Body**:
```json
{
  "type": "SHIPPING",
  "firstName": "John",
  "lastName": "Doe",
  "company": "Acme Corp",
  "address1": "123 Main St",
  "address2": "Apt 4B",
  "city": "New York",
  "province": "NY",
  "country": "US",
  "postalCode": "10001",
  "phone": "+1234567890",
  "isDefault": false
}
```

---

### PUT /api/user/addresses/:id
**Purpose**: Update address
**Authentication**: Required

---

### DELETE /api/user/addresses/:id
**Purpose**: Delete address
**Authentication**: Required

---

### PUT /api/user/addresses/:id/default
**Purpose**: Set address as default
**Authentication**: Required

---

## Wishlist Endpoints

### GET /api/user/wishlist
**Purpose**: Get user wishlist
**Authentication**: Required

**Response (200)**:
```json
{
  "success": true,
  "data": [
    {
      "id": "uuid",
      "product": {
        "id": "uuid",
        "name": "Product Name",
        "slug": "product-slug",
        "price": "99.99",
        "comparePrice": "149.99",
        "images": ["https://example.com/image.jpg"],
        "inStock": true
      },
      "addedAt": "2024-01-01T00:00:00Z"
    }
  ],
  "pagination": {
    "page": 1,
    "limit": 20,
    "total": 5,
    "totalPages": 1
  }
}
```

---

### POST /api/user/wishlist
**Purpose**: Add item to wishlist
**Authentication**: Required

**Request Body**:
```json
{
  "productId": "uuid"
}
```

---

### DELETE /api/user/wishlist/:productId
**Purpose**: Remove item from wishlist
**Authentication**: Required

---

### POST /api/user/wishlist/clear
**Purpose**: Clear entire wishlist
**Authentication**: Required

---

## Order History Endpoints

### GET /api/user/orders
**Purpose**: Get user order history
**Authentication**: Required

**Query Parameters**:
- `page`: Page number (default: 1)
- `limit`: Items per page (default: 10)
- `status`: Filter by order status

**Response (200)**:
```json
{
  "success": true,
  "data": [
    {
      "id": "uuid",
      "orderNumber": "ORD-2024-001",
      "status": "DELIVERED",
      "total": "199.98",
      "currency": "USD",
      "createdAt": "2024-01-01T00:00:00Z",
      "items": [
        {
          "productName": "Product Name",
          "quantity": 2,
          "price": "99.99",
          "total": "199.98"
        }
      ]
    }
  ],
  "pagination": {
    "page": 1,
    "limit": 10,
    "total": 25,
    "totalPages": 3
  }
}
```

---

### GET /api/user/orders/:id
**Purpose**: Get specific order details
**Authentication**: Required

---

## Session Management Endpoints

### GET /api/user/sessions
**Purpose**: Get active user sessions
**Authentication**: Required

**Response (200)**:
```json
{
  "success": true,
  "data": [
    {
      "id": "uuid",
      "deviceInfo": {
        "userAgent": "Mozilla/5.0...",
        "ip": "192.168.1.1",
        "device": "Desktop",
        "browser": "Chrome",
        "os": "Windows"
      },
      "isActive": true,
      "lastUsedAt": "2024-01-01T12:00:00Z",
      "createdAt": "2024-01-01T00:00:00Z",
      "isCurrent": true
    }
  ]
}
```

---

### DELETE /api/user/sessions/:id
**Purpose**: Revoke specific session
**Authentication**: Required

---

### DELETE /api/user/sessions
**Purpose**: Revoke all sessions except current
**Authentication**: Required

---

## Two-Factor Authentication (Optional Enhancement)

### POST /api/auth/2fa/enable
**Purpose**: Enable 2FA for user
**Authentication**: Required

**Request Body**:
```json
{
  "password": "currentPassword123"
}
```

**Response (200)**:
```json
{
  "success": true,
  "data": {
    "qrCode": "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAA...",
    "secret": "JBSWY3DPEHPK3PXP",
    "backupCodes": ["12345678", "87654321", ...]
  }
}
```

---

### POST /api/auth/2fa/verify
**Purpose**: Verify and complete 2FA setup
**Authentication**: Required

**Request Body**:
```json
{
  "token": "123456"
}
```

---

### POST /api/auth/2fa/disable
**Purpose**: Disable 2FA
**Authentication**: Required

**Request Body**:
```json
{
  "password": "currentPassword123",
  "token": "123456"
}
```

---

## Security & Monitoring Endpoints

### GET /api/auth/security/check
**Purpose**: Check security status
**Authentication**: Required

**Response (200)**:
```json
{
  "success": true,
  "data": {
    "emailVerified": true,
    "twoFactorEnabled": false,
    "activeSessions": 2,
    "lastPasswordChange": "2024-01-01T00:00:00Z",
    "securityScore": 75
  }
}
```

---

### POST /api/auth/security/audit-log
**Purpose**: Get security audit log
**Authentication**: Required

**Request Body**:
```json
{
  "startDate": "2024-01-01",
  "endDate": "2024-01-31",
  "events": ["login", "password_change", "profile_update"]
}
```

---

## Error Response Format

All error responses follow this format:

```json
{
  "success": false,
  "error": {
    "code": "VALIDATION_ERROR",
    "message": "Invalid input data",
    "details": [
      {
        "field": "email",
        "message": "Email is required"
      }
    ]
  }
}
```

## Common Error Codes

- `VALIDATION_ERROR`: Invalid input data
- `UNAUTHORIZED`: Authentication required
- `FORBIDDEN`: Insufficient permissions
- `NOT_FOUND`: Resource not found
- `CONFLICT`: Resource already exists
- `RATE_LIMIT_EXCEEDED`: Too many requests
- `ACCOUNT_LOCKED`: User account is locked
- `EMAIL_NOT_VERIFIED`: Email verification required
- `INVALID_TOKEN`: Invalid or expired token
- `WEAK_PASSWORD`: Password doesn't meet security requirements

## Rate Limiting

- **Authentication endpoints**: 5-10 requests per minute per IP
- **Password reset**: 3 requests per hour per email
- **Email verification**: 3 requests per hour per email
- **Profile updates**: 20 requests per minute per user
- **General API**: 100 requests per minute per user

## Security Headers

All responses include these security headers:
- `X-Content-Type-Options: nosniff`
- `X-Frame-Options: DENY`
- `X-XSS-Protection: 1; mode=block`
- `Strict-Transport-Security: max-age=31536000; includeSubDomains`
- `Content-Security-Policy: default-src 'self'`
