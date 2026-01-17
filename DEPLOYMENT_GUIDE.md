# AfroSuperStore DreamHost VPS Deployment Guide

Complete guide to deploy AfroSuperStore on DreamHost VPS with domain `www.afrosuperstore.ca`

## 📋 Table of Contents

1. [Prerequisites](#prerequisites)
2. [Initial Server Setup](#initial-server-setup)
3. [Configuration](#configuration)
4. [Deployment](#deployment)
5. [SSL Setup](#ssl-setup)
6. [Database Migration](#database-migration)
7. [Monitoring](#monitoring)
8. [Troubleshooting](#troubleshooting)

## 🚀 Prerequisites

### Required:
- DreamHost VPS with Ubuntu 20.04+ or CentOS 8+
- Domain `www.afrosuperstore.ca` pointing to your VPS IP
- SSH access to VPS
- Docker and Docker Compose installed on VPS
- Git installed locally

### Recommended:
- SSL certificate (Let's Encrypt recommended)
- Monitoring setup (Uptime, alerts)
- Backup strategy

## 🔧 Initial Server Setup

### 1. Run Initial Setup Script
```bash
# Make setup script executable
chmod +x scripts/setup-dreamhost.sh

# Run initial server setup
./scripts/setup-dreamhost.sh
```

This script will:
- Update system packages
- Install Docker and Docker Compose
- Configure firewall (UFW)
- Create directory structure
- Set up automatic backups
- Configure basic monitoring

### 2. Configure SSH Access
```bash
# Generate SSH key for deployment
./scripts/setup-dreamhost.sh

# Add the generated public key to your DreamHost account
# Update scripts with your DreamHost credentials
```

### 3. Update Configuration Files

Edit the following files with your actual credentials:

#### Environment Variables (.env.dreamhost)
```bash
# Update these values in .env.dreamhost
DREAMHOST_USER=your_actual_dreamhost_username
DREAMHOST_SERVER=your_actual_server.dreamhost.com
POSTGRES_PASSWORD=your_secure_postgres_password
JWT_SECRET=your_very_secure_jwt_secret
STRIPE_PUBLISHABLE_KEY=pk_live_your_actual_key
STRIPE_SECRET_KEY=sk_live_your_actual_secret
```

#### Deployment Scripts
Update these variables in:
- `scripts/deploy-dreamhost.sh`
- `scripts/setup-dreamhost.sh`
- `scripts/monitoring.sh`

## ⚙️ Configuration

### Environment Variables
Copy and configure the production environment file:
```bash
cp .env.dreamhost .env.production
```

Edit `.env.production` with your actual values:
- Database credentials
- Stripe keys
- Email settings
- Domain URLs
- API keys

### Docker Compose Configuration
The `docker-compose.dreamhost.yml` includes:
- **Frontend**: Next.js application (Port 3000)
- **Backend**: NestJS API (Port 3001)
- **API Service**: Express API (Port 3002)
- **Nginx**: Reverse proxy (Ports 80, 443)
- **PostgreSQL**: Database (Port 5432)
- **Redis**: Cache (Port 6379)

### Nginx Configuration
Features included in `nginx/nginx.conf`:
- HTTPS redirection
- SSL termination
- Load balancing
- Rate limiting
- Security headers
- Static file caching
- API routing
- Health checks

## 🚀 Deployment

### 1. Deploy Application
```bash
# Make deployment script executable
chmod +x scripts/deploy-dreamhost.sh

# Run deployment
./scripts/deploy-dreamhost.sh
```

This script will:
- Create backup of existing deployment
- Deploy all application files
- Set up SSL certificates
- Start all services
- Perform health checks
- Clean up old Docker resources

### 2. Database Migration
```bash
# Make migration script executable
chmod +x database/migrate.sh

# Run database migrations
./database/migrate.sh migrate
```

### 3. Verify Deployment
```bash
# Check service status
./scripts/monitoring.sh health

# Check website accessibility
./scripts/monitoring.sh website

# Generate full report
./scripts/monitoring.sh report
```

## 🔒 SSL Setup

### Option 1: Let's Encrypt (Recommended)
```bash
# Install Let's Encrypt certificates
./scripts/setup-ssl.sh letsencrypt
```

### Option 2: Manual Certificates
```bash
# Install from local certificate files
./scripts/setup-ssl.sh manual
```

### Option 3: Self-Signed (Testing Only)
```bash
# Generate self-signed certificates
./scripts/setup-ssl.sh self-signed
```

### SSL Auto-Renewal
Let's Encrypt certificates are automatically configured for renewal via cron:
```bash
# Check renewal schedule
ssh your_dreamhost_user@your_server.dreamhost.com "crontab -l | grep certbot"
```

## 🗄️ Database Migration

### Migration Files
- `001_initial_schema.sql`: Initial database schema
- `002_add_indexes.sql`: Performance indexes

### Migration Commands
```bash
# Run all pending migrations
./database/migrate.sh migrate

# Check migration status
./database/migrate.sh status

# Create backup before migration
./database/migrate.sh backup

# Rollback to specific version (DANGEROUS)
./database/migrate.sh rollback 001
```

### Database Schema Includes
- Users and authentication
- Products, categories, brands
- Shopping cart and orders
- Reviews and ratings
- Wishlist functionality
- Comprehensive indexing

## 📊 Monitoring

### Monitoring Script Features
```bash
# Check all services
./scripts/monitoring.sh health

# Check website accessibility
./scripts/monitoring.sh website

# Check SSL certificate
./scripts/monitoring.sh ssl

# Check system resources
./scripts/monitoring.sh disk
./scripts/monitoring.sh memory

# Check error logs
./scripts/monitoring.sh logs

# Generate full report
./scripts/monitoring.sh report
```

### Monitoring Includes
- Service health checks
- Website accessibility
- SSL certificate expiry
- Disk space monitoring
- Memory usage tracking
- Database connection monitoring
- Error log analysis
- Performance metrics
- Docker container status

### Alert Configuration
Configure alerts in `scripts/monitoring.sh`:
- Email notifications
- Slack webhook integration
- Discord webhook integration
- Custom alert thresholds

## 🔧 Troubleshooting

### Common Issues

#### 1. Services Won't Start
```bash
# Check Docker logs
ssh user@server "docker-compose logs -f"

# Check container status
ssh user@server "docker-compose ps"

# Restart specific service
ssh user@server "docker-compose restart frontend"
```

#### 2. Website Not Accessible
```bash
# Check Nginx status
ssh user@server "docker exec afrosuperstore_nginx nginx -t"

# Check Nginx logs
ssh user@server "docker logs afrosuperstore_nginx"

# Test SSL certificate
./scripts/monitoring.sh ssl
```

#### 3. Database Connection Issues
```bash
# Check database container
ssh user@server "docker exec afrosuperstore_postgres psql -U postgres -d afrosuperstore -c 'SELECT 1;'"

# Check database logs
ssh user@server "docker logs afrosuperstore_postgres"
```

#### 4. High Resource Usage
```bash
# Check system resources
./scripts/monitoring.sh disk
./scripts/monitoring.sh memory

# Check Docker resource usage
ssh user@server "docker stats"
```

### Log Locations
```bash
# Application logs
ssh user@server "ls -la /home/user/afrosuperstore/logs/"

# Nginx logs
ssh user@server "docker logs afrosuperstore_nginx"

# Database logs
ssh user@server "docker logs afrosuperstore_postgres"
```

### Backup and Recovery
```bash
# Create manual backup
ssh user@server "cd /home/user/afrosuperstore && ./backup-script.sh"

# List available backups
ssh user@server "ls -la /home/user/afrosuperstore/backups/"

# Restore from backup
# 1. Stop services
ssh user@server "cd /home/user/afrosuperstore && docker-compose down"

# 2. Restore database
ssh user@server "docker exec -i afrosuperstore_postgres psql -U postgres -d afrosuperstore < backup-file.sql"

# 3. Restart services
ssh user@server "cd /home/user/afrosuperstore && docker-compose up -d"
```

## 🌐 DNS Configuration

### Required DNS Records
```
A Record: www.afrosuperstore.ca -> YOUR_VPS_IP
A Record: afrosuperstore.ca -> YOUR_VPS_IP
AAAA Record: www.afrosuperstore.ca -> YOUR_IPV6_ADDRESS (optional)
MX Record: afrosuperstore.ca -> your.mail.server (for email)
```

### SSL Certificate DNS
Let's Encrypt will automatically configure DNS for validation.

## 🔐 Security Considerations

### Firewall Rules
```bash
# Check firewall status
ssh user@server "sudo ufw status verbose"

# Allowed ports:
# 22  - SSH
# 80  - HTTP
# 443 - HTTPS
```

### Security Headers
The Nginx configuration includes:
- HSTS (HTTP Strict Transport Security)
- X-Frame-Options
- X-Content-Type-Options
- XSS Protection

### Regular Security Tasks
```bash
# Update system packages
ssh user@server "sudo apt update && sudo apt upgrade -y"

# Check for security updates
ssh user@server "sudo apt list --upgradable"

# Rotate passwords regularly
# Update database, SSH, and application passwords
```

## 📈 Performance Optimization

### Database Optimization
- Connection pooling configured
- Indexes optimized for queries
- Query performance monitoring

### Caching Strategy
- Redis for session storage
- Nginx static file caching
- Application-level caching

### CDN Configuration (Optional)
```bash
# Update environment variables for CDN
NEXT_PUBLIC_CDN_URL=https://cdn.afrosuperstore.ca
```

## 🔄 Maintenance

### Regular Tasks
1. **Daily**: Monitor system resources and logs
2. **Weekly**: Update system packages, check SSL expiry
3. **Monthly**: Review performance metrics, cleanup old logs
4. **Quarterly**: Security audit, backup verification

### Automated Tasks
- Database backups (daily)
- Log rotation (weekly)
- SSL renewal (automatic)
- Container health checks (continuous)

## 📞 Support

### Getting Help
1. Check this documentation first
2. Review monitoring logs
3. Check DreamHost documentation
4. Contact DreamHost support

### Useful Commands
```bash
# Quick health check
./scripts/monitoring.sh all

# Redeploy application
./scripts/deploy-dreamhost.sh

# Check recent logs
ssh user@server "tail -50 /home/user/afrosuperstore/logs/frontend/*.log"

# Monitor real-time logs
ssh user@server "cd /home/user/afrosuperstore && docker-compose logs -f"
```

## 🎯 Success Criteria

Your deployment is successful when:
- ✅ All Docker containers are running
- ✅ Website responds to HTTPS requests
- ✅ SSL certificate is valid
- ✅ Database migrations are applied
- ✅ Monitoring shows healthy status
- ✅ No critical errors in logs

## 📚 Additional Resources

- [DreamHost Documentation](https://help.dreamhost.com/)
- [Docker Documentation](https://docs.docker.com/)
- [Nginx Documentation](https://nginx.org/en/docs/)
- [PostgreSQL Documentation](https://www.postgresql.org/docs/)
- [Let's Encrypt](https://letsencrypt.org/)

---

**Deployment completed! 🎉 Your AfroSuperStore should now be live at https://www.afrosuperstore.ca**
