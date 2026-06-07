# Deployment Checklist - AfroSuperStore E-commerce

**Last Updated:** June 7, 2026

---

## Pre-Deployment Checklist

### Environment Variables

#### Railway (Backend)

- [ ] `SUPABASE_URL` - Set to production Supabase project URL
- [ ] `SUPABASE_ANON_KEY` - Set to production Supabase anon key
- [ ] `SUPABASE_SERVICE_ROLE_KEY` - Set to production Supabase service role key
- [ ] `SUPABASE_DB_URL` - Set to PostgreSQL connection string
- [ ] `NODE_ENV` - Set to `production`
- [ ] `PORT` - Set to `3001` (or desired port)
- [ ] `CORS_ORIGINS` - Set to production frontend URL
- [ ] `FRONTEND_URL` - Set to production frontend URL
- [ ] `STRIPE_SECRET_KEY` - Set to production Stripe secret key
- [ ] `PAYSTACK_SECRET_KEY` - Set to production Paystack secret key
- [ ] `SENDGRID_API_KEY` - Set to production SendGrid API key
- [ ] `SESSION_SECRET` - Set to strong random string (min 32 chars)
- [ ] `REDIS_URL` - Set if using Redis (optional)

#### Vercel (Frontend)

- [ ] `NEXT_PUBLIC_SUPABASE_URL` - Set to production Supabase project URL
- [ ] `NEXT_PUBLIC_SUPABASE_ANON_KEY` - Set to production Supabase anon key
- [ ] `NEXT_PUBLIC_SITE_URL` - Set to production site URL
- [ ] `NEXT_PUBLIC_API_URL` - Set to production backend API URL
- [ ] `NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY` - Set to production Stripe publishable key
- [ ] `NEXT_PUBLIC_PAYSTACK_PUBLIC_KEY` - Set to production Paystack public key
- [ ] `NEXT_PUBLIC_GOOGLE_ANALYTICS_ID` - Set to GA tracking ID (if using)
- [ ] `NEXT_PUBLIC_ENABLE_ANALYTICS` - Set to `true` or `false`

---

## Database Setup

### Supabase Configuration

- [ ] Create Supabase project (if not already created)
- [ ] Enable PostgreSQL database
- [ ] Run all migrations in order:
  - [ ] `001_initial_schema.sql`
  - [ ] `002_add_indexes.sql`
  - [ ] `003_add_password_reset_columns.sql`
  - [ ] `004_remove_legacy_auth_columns.sql`
  - [ ] `007_add_videos_column.sql`
  - [ ] `008_update_orders_schema.sql`
  - [ ] `009_setup_storage_buckets.sql` (after creating buckets)
  - [ ] `20260313162500_crm_final_setup.sql`
- [ ] Verify all tables created successfully
- [ ] Verify RLS policies enabled
- [ ] Verify profiles table exists
- [ ] Verify `handle_new_user()` trigger exists
- [ ] Create storage buckets (see STORAGE_SETUP_GUIDE.md):
  - [ ] Run: `node scripts/create-storage-buckets.js`
  - [ ] OR create manually via Dashboard
- [ ] Configure storage policies (via migration 009)
- [ ] Create admin user via Supabase Auth or backend script

---

## Storage Setup

### Supabase Storage

- [ ] Run automated bucket creation: `node scripts/create-storage-buckets.js`
- [ ] OR create buckets manually via Supabase Dashboard (see STORAGE_SETUP_GUIDE.md)
- [ ] Verify buckets created: `products`, `product-images`, `category-images`, `user-avatars`
- [ ] Apply storage policies: `supabase db push` (runs 009_setup_storage_buckets.sql)
- [ ] Verify bucket policies in Supabase Dashboard
- [ ] Upload placeholder images (automated by script)
- [ ] Test public image access
- [ ] Test admin image upload

---

## Backend Deployment (Railway)

### Build Configuration

- [ ] Set Node.js version in `package.json` (engines field)
- [ ] Verify `npm install` runs successfully
- [ ] Verify build script works: `npm run build`
- [ ] Test locally: `npm start`
- [ ] Configure Railway build command: `npm install && npm run build`
- [ ] Configure Railway start command: `npm start`

### Railway Settings

- [ ] Connect GitHub repository
- [ ] Select branch to deploy (main/master)
- [ ] Configure environment variables (see above)
- [ ] Set health check endpoint (if applicable)
- [ ] Configure auto-deploy on push
- [ ] Set up domain/custom domain (if needed)
- [ ] Enable Railway metrics and logging

### Post-Deployment Verification

- [ ] Check Railway logs for startup errors
- [ ] Test backend health endpoint
- [ ] Test database connection
- [ ] Test Supabase client initialization
- [ ] Verify API endpoints respond correctly
- [ ] Test authentication flow
- [ ] Test file upload to Supabase Storage

---

## Frontend Deployment (Vercel)

### Build Configuration

- [ ] Set Node.js version in `package.json` (engines field)
- [ ] Verify `npm install` runs successfully
- [ ] Verify build script works: `npm run build`
- [ ] Test locally: `npm run dev`
- [ ] Configure Vercel build command: `npm run build`
- [ ] Configure Vercel output directory: `.next` or `out`

### Vercel Settings

- [ ] Connect GitHub repository
- [ ] Select branch to deploy (main/master)
- [ ] Configure environment variables (see above)
- [ ] Set framework preset to Next.js
- [ ] Configure build settings
- [ ] Set up custom domain (if needed)
- [ ] Enable Vercel Analytics (if desired)
- [ ] Configure environment-specific deployments (preview/production)

### Post-Deployment Verification

- [ ] Check Vercel deployment logs
- [ ] Test frontend loads in browser
- [ ] Test navigation between pages
- [ ] Test product browsing
- [ ] Test shopping cart
- [ ] Test checkout flow
- [ ] Test user authentication
- [ ] Test admin panel (if applicable)
- [ ] Verify images load from Supabase Storage
- [ ] Test responsive design on mobile

---

## Security Verification

### Backend Security

- [ ] Verify CORS origins set correctly
- [ ] Verify rate limiting enabled
- [ ] Verify input validation on all endpoints
- [ ] Verify SQL injection protection (Supabase client handles this)
- [ ] Verify XSS protection
- [ ] Verify HTTPS enforced in production
- [ ] Verify sensitive data not logged
- [ ] Verify error messages don't expose sensitive info

### Frontend Security

- [ ] Verify HTTPS enforced
- [ ] Verify Content Security Policy configured
- [ ] Verify no sensitive data in client-side code
- [ ] Verify API calls use HTTPS
- [ ] Verify authentication tokens stored securely (httpOnly cookies)
- [ ] Verify CSRF protection enabled

### Supabase Security

- [ ] Verify RLS policies enabled on all tables
- [ ] Verify service role key not exposed in frontend
- [ ] Verify anon key used in frontend (appropriate)
- [ ] Verify storage policies configured
- [ ] Verify auth providers configured (email, OAuth if needed)
- [ ] Verify password requirements set
- [ ] Verify email confirmation enabled
- [ ] Enable Supabase audit logs

---

## Performance Optimization

### Backend

- [ ] Enable Redis caching (if configured)
- [ ] Configure database connection pooling
- [ ] Enable response compression
- [ ] Optimize database queries
- [ ] Add appropriate indexes
- [ ] Configure CDN for static assets
- [ ] Enable gzip/brotli compression

### Frontend

- [ ] Enable image optimization (Next.js Image component)
- [ ] Configure lazy loading for images
- [ ] Enable code splitting
- [ ] Optimize bundle size
- [ ] Configure CDN for static assets
- [ ] Enable caching headers
- [ ] Preload critical resources

---

## Monitoring & Logging

### Backend Monitoring

- [ ] Configure Railway metrics
- [ ] Set up error tracking (Sentry, etc.)
- [ ] Configure application logging
- [ ] Set up uptime monitoring
- [ ] Configure database performance monitoring
- [ ] Set up alerting for critical errors

### Frontend Monitoring

- [ ] Enable Vercel Analytics
- [ ] Configure error tracking
- [ ] Set up performance monitoring
- [ ] Configure user analytics (if compliant)
- [ ] Set up uptime monitoring

### Supabase Monitoring

- [ ] Enable Supabase dashboard monitoring
- [ ] Configure database usage alerts
- [ ] Monitor storage usage
- [ ] Track API request counts
- [ ] Set up backup verification

---

## Testing Checklist

### Pre-Deployment Testing

- [ ] Run all unit tests
- [ ] Run integration tests
- [ ] Test authentication flow end-to-end
- [ ] Test product creation/deletion
- [ ] Test order processing
- [ ] Test payment integration (Stripe/Paystack)
- [ ] Test file uploads
- [ ] Test email notifications
- [ ] Test admin panel functionality
- [ ] Load test API endpoints
- [ ] Test error handling

### Post-Deployment Testing

- [ ] Smoke test all critical user flows
- [ ] Test authentication in production
- [ ] Test checkout with real payment (small amount)
- [ ] Test admin panel access
- [ ] Verify data persistence
- [ ] Test file uploads to production storage
- [ ] Verify email delivery
- [ ] Test mobile responsiveness
- [ ] Verify SEO meta tags
- [ ] Test social sharing

---

## Backup & Recovery

### Database Backups

- [ ] Enable Supabase automated backups
- [ ] Configure backup retention period
- [ ] Test backup restoration process
- [ ] Document recovery procedures
- [ ] Set up backup monitoring

### Code Backups

- [ ] Ensure code pushed to GitHub
- [ ] Tag release version
- [ ] Document deployment rollback procedure
- [ ] Test rollback process

---

## Documentation

- [ ] Update README with deployment instructions
- [ ] Document environment variables
- [ ] Document API endpoints
- [ ] Document database schema
- [ ] Create runbook for common issues
- [ ] Document escalation procedures
- [ ] Update contact information

---

## Final Verification

- [ ] All environment variables configured
- [ ] All migrations run successfully
- [ ] All storage buckets created
- [ ] Admin user created
- [ ] SSL certificates valid
- [ ] DNS configured correctly
- [ ] Monitoring enabled
- [ ] Backups configured
- [ ] Documentation updated
- [ ] Team notified of deployment
- [ ] Rollback plan documented

---

## Post-Deployment Tasks

- [ ] Monitor error logs for 24 hours
- [ ] Check performance metrics
- [ ] Verify user sign-up flow works
- [ ] Test customer support channels
- [ ] Update deployment documentation
- [ ] Schedule post-deployment review meeting
- [ ] Plan next iteration/sprint

---

## Emergency Contacts

- [ ] DevOps lead: [Name, Email, Phone]
- [ ] Backend lead: [Name, Email, Phone]
- [ ] Frontend lead: [Name, Email, Phone]
- [ ] Database admin: [Name, Email, Phone]
- [ ] Supabase support: [Link to support portal]
- [ ] Railway support: [Link to support portal]
- [ ] Vercel support: [Link to support portal]

---

## Notes

- This checklist should be reviewed and updated before each deployment
- Use environment-specific checklists for staging vs production
- Always test in staging environment before production deployment
- Keep a record of all deployments with timestamps and changes
