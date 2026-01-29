# Super Admin Setup - AfroSuperStore

## ⚠️ SECURITY NOTICE

This documentation has been sanitized for production security.
All hardcoded credentials have been removed from the codebase.

## Secure Setup Instructions

### Environment Variables Required

Create a `.env` file in the backend directory with:

```bash
# Database Configuration
DATABASE_URL=your_production_database_url

# JWT Configuration  
JWT_SECRET=your_strong_jwt_secret_key_here
JWT_EXPIRES_IN=7d

# Supabase (Optional - only if needed)
SUPABASE_URL=your_supabase_url
SUPABASE_SERVICE_ROLE_KEY=your_supabase_service_role_key
```

### Creating Super Admin User

1. Run the database migrations:
```bash
npm run migrate
```

2. Use the secure admin creation script:
```bash
node scripts/create-admin.js
```

3. Or create directly in database with hashed password:
```sql
INSERT INTO users (
    email,
    password_hash,
    first_name,
    last_name,
    role,
    email_verified
) VALUES (
    'admin@yourdomain.com',
    '$2a$10$your_bcrypt_hashed_password',
    'Super',
    'Admin',
    'super_admin',
    true
);
```

### Security Best Practices

- **Never** commit credentials to version control
- Use strong, unique passwords
- Rotate JWT secrets regularly
- Enable database connection encryption
- Use environment-specific configurations
- Monitor admin access logs

### Authentication Flow

1. Admin users authenticate via `/api/admin/auth/login`
2. JWT tokens are generated using `JWT_SECRET`
3. All admin routes require valid JWT tokens
4. Role-based access control enforced at middleware level

### Migration Files
- `database/migrations/003_create_super_admin.sql` - Reference only (credentials removed)

### Next Steps
1. Configure environment variables
2. Run database migrations
3. Create super admin user with secure password
4. Test authentication flow
5. Verify admin permissions

---
*Security hardening completed* 
*Hardcoded credentials removed from production codebase*
