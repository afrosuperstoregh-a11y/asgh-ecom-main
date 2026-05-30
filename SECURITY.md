# Security Documentation

## Overview

This document outlines the security measures implemented in the Afro Superstore e-commerce platform to protect against common vulnerabilities and ensure production-ready security standards.

## Security Fixes Implemented

### 1. Authentication & Authorization

#### Removed Hardcoded Admin Backdoors
- **Files Modified**: `backend/src/routes/admin.js`, `backend/src/middleware/auth.js`
- **Changes**: 
  - Removed hardcoded admin credentials (`admin@afrosuperstore.ca` / `Admin123!`)
  - Removed hardcoded UUID bypass (`00000000-0000-0000-0000-000000000001`)
  - Removed mock data bypass in admin dashboard
- **Impact**: All admin authentication now requires valid database-backed accounts with proper password verification

#### Environment Validation
- **File Modified**: `backend/src/config/env.js`
- **Changes**:
  - Removed default secrets (JWT_SECRET, SESSION_SECRET)
  - Added minimum length validation (32 characters for secrets)
  - Added strict validation for required environment variables
  - Application fails startup if required variables are missing or invalid
- **Required Variables**:
  - `JWT_SECRET` (min 32 chars)
  - `SESSION_SECRET` (min 32 chars)
  - `SUPABASE_URL` (min 10 chars)
  - `SUPABASE_ANON_KEY` (min 20 chars)
  - `SUPABASE_SERVICE_ROLE_KEY` (min 20 chars)
  - `NODE_ENV`

### 2. SQL Injection Prevention

#### Parameterized Queries
- **File Modified**: `backend/src/services/crmService.js`
- **Changes**:
  - Added column whitelist for sortBy parameter
  - Added validation for sortOrder (ASC/DESC only)
  - All queries use parameterized statements
- **Impact**: Prevents SQL injection through user input in sorting and filtering

### 3. Content Security Policy (CSP)

#### Removed Unsafe Directives
- **File Modified**: `backend/src/server.js`
- **Changes**:
  - Removed `'unsafe-inline'` from scriptSrc
  - Removed `'unsafe-eval'` from scriptSrc
  - Removed `'unsafe-inline'` from styleSrc
  - Added `frame-ancestors 'none'` to prevent clickjacking
  - Added `base-uri 'self'` to prevent base tag attacks
- **Impact**: Prevents XSS attacks through inline scripts and styles

### 4. Secure Script Injection

#### Replaced dangerouslySetInnerHTML
- **File Modified**: `frontend/app/layout.tsx`
- **Changes**:
  - Replaced Google Analytics injection with Next.js `<Script />` component
  - Used safe strategy (`afterInteractive`)
  - Kept JSON-LD structured data (static, no user input)
- **Impact**: Prevents XSS through unsafe HTML injection

### 5. Next.js Configuration Security

#### Image Optimization
- **File Modified**: `frontend/next.config.js`
- **Changes**:
  - Enabled image optimization (`unoptimized: false`)
  - Disabled `dangerouslyAllowSVG` (set to `false`)
- **Impact**: Prevents XSS attacks through SVG files and improves performance

### 6. CORS Configuration

#### Environment-Based Origins
- **Files Modified**: `backend/src/config/env.js`, `backend/src/server.js`
- **Changes**:
  - Production: Only allows approved domains (afrosuperstore.ca)
  - Development: Allows localhost for testing
  - Added origin validation function to reject unauthorized origins
- **Impact**: Prevents CORS bypass attacks

### 7. Error Handling

#### Information Leakage Prevention
- **File Modified**: `backend/src/middleware/apiResponse.js`
- **Changes**:
  - Removed stack traces from production error responses
  - Added correlation IDs for tracking
  - Sanitized error messages
  - Generic error messages for 5xx errors
- **Impact**: Prevents exposure of internal system details

### 8. Security Middleware

#### Cookie Parser
- **File Modified**: `backend/src/server.js`
- **Changes**:
  - Added cookie-parser middleware
  - Configured with SESSION_SECRET for signed cookies
- **Impact**: Enables secure cookie handling for future httpOnly cookie implementation

### 9. Git Security

#### Environment Files
- **File Modified**: `.gitignore`
- **Changes**:
  - Added `.env.production` to gitignore
  - Ensures production secrets are never committed
- **Impact**: Prevents accidental commit of production credentials

### 10. Removed Insecure Files

#### Testing HTML Files
- **Files Removed**: `public/set-token.html`
- **Reason**: Contained hardcoded JWT tokens and admin credentials
- **Impact**: Eliminates backdoor access points

## Security Best Practices

### Environment Variables

All sensitive configuration must be set via environment variables:

```bash
# Backend (.env)
JWT_SECRET=your_jwt_secret_minimum_32_characters
SESSION_SECRET=your_session_secret_minimum_32_characters
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_ANON_KEY=your_supabase_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_supabase_service_role_key
NODE_ENV=production
```

### Password Security

- Minimum 32 characters for JWT_SECRET and SESSION_SECRET
- Use cryptographically secure random strings
- Rotate secrets regularly
- Never commit secrets to version control

### Database Security

- Use parameterized queries for all database operations
- Validate and sanitize all user input
- Use column whitelists for dynamic sorting/filtering
- Implement proper database user permissions

### API Security

- Validate all input data
- Use rate limiting to prevent abuse
- Implement proper error handling
- Never expose stack traces in production
- Use correlation IDs for debugging

### Content Security

- No unsafe-inline or unsafe-eval in CSP
- Use Next.js Script component for third-party scripts
- Sanitize all user-generated content
- Use httpOnly cookies for sensitive data

## Deployment Security Checklist

Before deploying to production:

- [ ] All environment variables set with strong secrets
- [ ] No hardcoded credentials in code
- [ ] CSP configured without unsafe directives
- [ ] CORS restricted to production domains only
- [ ] Error handling prevents information leakage
- [ ] Database queries use parameterized statements
- [ ] Image optimization enabled
- [ ] SVG uploads disabled or sanitized
- [ ] Rate limiting configured
- [ ] Security headers (Helmet) properly configured
- [ ] HTTPS enforced
- [ ] Session cookies configured as httpOnly and secure
- [ ] .env files in .gitignore
- [ ] No testing backdoors in production code
- [ ] Dependencies audited for vulnerabilities
- [ ] Logging configured without sensitive data

## Credential Rotation

If credentials were compromised, rotate them immediately:

```bash
# Generate new secrets
openssl rand -base64 32

# Update environment variables
# Restart all services
# Invalidate all existing sessions
# Notify users of password reset requirement
```

## Git History Cleanup

If secrets were accidentally committed:

```bash
# Remove sensitive files from history
git filter-branch --force --index-filter \
  "git rm --cached --ignore-unmatch .env.production" \
  --prune-empty --tag-name-filter cat -- --all

# Force push to remote (use with caution)
git push origin --force --all

# Rotate all exposed secrets immediately
```

## Monitoring & Alerts

Implement monitoring for:

- Failed authentication attempts
- Rate limit violations
- SQL injection attempts
- XSS attack patterns
- Unusual API usage patterns
- Error rate spikes

## Recommended Production Environment Variables

```bash
# Server
NODE_ENV=production
PORT=3001

# Authentication
JWT_SECRET=<generate with openssl rand -base64 32>
SESSION_SECRET=<generate with openssl rand -base64 32>

# Supabase
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_ANON_KEY=your_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key

# Payment
STRIPE_SECRET_KEY=sk_live_...
STRIPE_WEBHOOK_SECRET=whsec_...

# CORS
FRONTEND_URL=https://www.afrosuperstore.ca

# Redis (if enabled)
REDIS_URL=redis://user:password@host:port
REDIS_ENABLED=true

# Rate Limiting
RATE_LIMIT_WINDOW_MS=900000
RATE_LIMIT_MAX=100
```

## Security Testing

Run security tests before deployment:

```bash
# Backend
cd backend
npm test
npm audit

# Frontend
cd frontend
npm test
npm audit
npm run build
```

## Additional Security Measures to Implement

### Future Enhancements

1. **httpOnly Cookie Authentication**
   - Replace localStorage with httpOnly cookies
   - Implement cookie-based session management
   - Add SameSite protection

2. **CSRF Protection**
   - Implement CSRF token validation
   - Use double-submit cookie pattern
   - Protect state-changing operations

3. **Security Headers**
   - Implement Permissions-Policy header
   - Add Referrer-Policy header
   - Configure X-Content-Type-Options

4. **Input Validation**
   - Add comprehensive input validation schemas
   - Implement request size limits
   - Sanitize file uploads

5. **Logging & Monitoring**
   - Implement structured logging (Winston/Pino)
   - Add security event logging
   - Set up alerting for suspicious activity

6. **Dependency Scanning**
   - Automated dependency vulnerability scanning
   - Regular security updates
   - Supply chain security (SBOM)

## Contact

For security concerns or vulnerabilities, contact the security team immediately.

## Version History

- **v1.0** (2026-05-29): Initial security remediation
  - Removed all hardcoded credentials and backdoors
  - Implemented environment validation
  - Fixed SQL injection vulnerabilities
  - Hardened CSP and CORS configurations
  - Improved error handling
  - Added security middleware
