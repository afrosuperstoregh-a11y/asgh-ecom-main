# AfroSuperStore Traditional Deployment Guide
## DreamHost VPS - Non-Docker Deployment

---

## 🎯 **DEPLOYMENT OVERVIEW**

This guide covers deploying AfroSuperStore to DreamHost VPS using traditional hosting methods (Apache + Node.js + MySQL + Redis).

### **Target Stack**
- **Frontend**: Next.js (production build)
- **Backend/API**: Node.js
- **Database**: MySQL
- **Cache**: Redis
- **Reverse Proxy**: Apache (DreamHost default)
- **Process Management**: PM2
- **Deployment**: Traditional (NO Docker)

---

## 📋 **PREREQUISITES**

### **Local Requirements**
- Windows 10/11 with Git for Windows (includes SSH/SCP)
- Domain: `www.afrosuperstore.ca` pointing to DreamHost VPS
- SSH access to DreamHost VPS
- Production Stripe keys
- Email configuration details

### **DreamHost VPS Requirements**
- Ubuntu 20.04+ or Debian 10+
- SSH access for user: `afrosuperstore`
- Apache web server (installed by DreamHost)
- MySQL database access
- Redis server access

---

## 🚀 **QUICK DEPLOYMENT (RECOMMENDED)**

### **Option 1: One-Click Windows Deployment**
```bash
# Double-click this file in Windows Explorer
deploy-traditional.bat
```

Choose **Option 6: Full Deployment** for complete setup.

### **Option 2: Manual Linux/Mac Deployment**
```bash
# Make script executable
chmod +x scripts/deploy-traditional.sh

# Run full deployment
./scripts/deploy-traditional.sh
```

---

## 📁 **FINAL FOLDER STRUCTURE**

```
/home/afrosuperstore/afrosuperstore.ca/
├── frontend/                 # Next.js application
│   ├── package.json
│   ├── next.config.js
│   ├── .next/               # Production build
│   └── public/
├── backend/                  # Node.js backend
│   ├── package.json
│   └── src/
├── api/                      # Node.js API
│   ├── package.json
│   └── src/
├── database/                 # Database migrations
│   ├── migrations/
│   ├── migrate-mysql.sh
│   └── migrate.sh
├── scripts/                  # Utility scripts
│   ├── setup-traditional.sh
│   ├── deploy-traditional.sh
│   ├── health-check.sh
│   └── restart-services.sh
├── apache/                   # Apache configuration
│   └── afrosuperstore.conf
├── logs/                     # Application logs
├── uploads/                  # File uploads
├── .env                      # Environment variables
├── ecosystem.config.js       # PM2 configuration
└── deploy-traditional.bat    # Windows deployment script
```

---

## ⚙️ **CONFIGURATION FILES**

### **1. Environment Variables (.env)**
```env
# Database (MySQL)
MYSQL_HOST=localhost
MYSQL_DATABASE=afrosuperstore_prod
MYSQL_USER=afrosuperstore_db
MYSQL_PASSWORD=SecureMySQLPassword2024!

# Redis
REDIS_HOST=localhost
REDIS_PASSWORD=SecureRedisPassword2024!

# Security
JWT_SECRET=SuperSecureJWTSecretKeyForAfroSuperStore2024Production

# Stripe (PRODUCTION KEES REQUIRED)
STRIPE_PUBLISHABLE_KEY=pk_live_YOUR_STRIPE_PUBLISHABLE_KEY_HERE
STRIPE_SECRET_KEY=sk_live_YOUR_STRIPE_SECRET_KEY_HERE
```

### **2. PM2 Configuration (ecosystem.config.js)**
```javascript
module.exports = {
  apps: [
    {
      name: 'afrosuperstore-frontend',
      script: 'npm',
      args: 'start',
      cwd: '/home/afrosuperstore/afrosuperstore.ca/frontend',
      env_production: {
        NODE_ENV: 'production',
        PORT: 3000
      }
    },
    {
      name: 'afrosuperstore-api',
      script: 'npm',
      args: 'start',
      cwd: '/home/afrosuperstore/afrosuperstore.ca/api',
      env_production: {
        NODE_ENV: 'production',
        PORT: 3001
      }
    },
    {
      name: 'afrosuperstore-backend',
      script: 'npm',
      args: 'start',
      cwd: '/home/afrosuperstore/afrosuperstore.ca/backend',
      env_production: {
        NODE_ENV: 'production',
        PORT: 3002
      }
    }
  ]
};
```

### **3. Apache Virtual Host**
```apache
<VirtualHost *:443>
    ServerName www.afrosuperstore.ca
    DocumentRoot /home/afrosuperstore/afrosuperstore.ca/frontend/.next
    
    # API Proxy
    ProxyPass /api http://localhost:3001/api
    ProxyPassReverse /api http://localhost:3001/api
    
    # Backend Proxy
    ProxyPass /admin http://localhost:3002/admin
    ProxyPassReverse /admin http://localhost:3002/admin
    
    # SSL Configuration
    SSLEngine on
    SSLCertificateFile /etc/ssl/certs/www.afrosuperstore.ca.crt
    SSLCertificateKeyFile /etc/ssl/private/www.afrosuperstore.ca.key
</VirtualHost>
```

---

## 🔧 **STEP-BY-STEP DEPLOYMENT**

### **Phase 1: Initial Server Setup**
```bash
# SSH to server
ssh afrosuperstore@vps68200.dreamhostps.com

# Run setup script
chmod +x /tmp/setup-traditional.sh
/tmp/setup-traditional.sh
```

**What this does:**
- Installs Node.js 18.x
- Installs PM2 globally
- Configures Apache modules
- Creates directory structure
- Sets up log rotation
- Configures monitoring

### **Phase 2: Application Deployment**
```bash
# From local machine (Windows)
deploy-traditional.bat

# Choose Option 2: Deploy Application
```

**What this does:**
- Uploads application files
- Installs npm dependencies
- Builds frontend for production
- Configures Apache virtual host
- Starts Node.js services with PM2

### **Phase 3: Database Setup**
```bash
# On server
cd /home/afrosuperstore/afrosuperstore.ca/database
chmod +x migrate-mysql.sh
./migrate-mysql.sh
```

**What this does:**
- Creates database and user
- Runs all migrations
- Inserts initial data
- Sets up indexes

### **Phase 4: SSL Configuration**
```bash
# DreamHost managed SSL (recommended)
# Or Let's Encrypt via DreamHost panel
```

---

## 🔍 **VERIFICATION CHECKLIST**

### **✅ Pre-Deployment Checks**
- [ ] SSH access works: `ssh afrosuperstore@vps68200.dreamhostps.com`
- [ ] Domain points to VPS IP
- [ ] Production Stripe keys ready
- [ ] Email configuration ready
- [ ] All placeholder values replaced in `.env`

### **✅ Post-Deployment Checks**

#### **Service Status**
```bash
# Check PM2 processes
pm2 status

# Check Apache status
systemctl status apache2

# Check website accessibility
curl -I https://www.afrosuperstore.ca
```

#### **Database Connectivity**
```bash
# Test MySQL connection
mysql -h localhost -u afrosuperstore_db -pSecureMySQLPassword2024! -e "SELECT 1;"

# Test Redis connection
redis-cli -a SecureRedisPassword2024! ping
```

#### **Application Functionality**
- [ ] Homepage loads correctly
- [ ] API endpoints respond: `https://www.afrosuperstore.ca/api/health`
- [ ] Admin panel accessible: `https://www.afrosuperstore.ca/admin`
- [ ] User registration/login works
- [ ] Product browsing works
- [ ] Shopping cart functions
- [ ] Checkout process (test mode)

#### **SSL Certificate**
```bash
# Check SSL certificate
openssl s_client -connect www.afrosuperstore.ca:443 -servername www.afrosuperstore.ca
```

---

## 🛠️ **MANAGEMENT COMMANDS**

### **Service Management**
```bash
# Restart all services
pm2 restart all

# Restart specific service
pm2 restart afrosuperstore-api

# View logs
pm2 logs

# View specific service logs
pm2 logs afrosuperstore-frontend

# Monitor performance
pm2 monit
```

### **Apache Management**
```bash
# Restart Apache
sudo systemctl restart apache2

# Test Apache configuration
sudo apache2ctl configtest

# View Apache logs
tail -f /home/afrosuperstore/afrosuperstore.ca/logs/apache_error.log
```

### **Database Management**
```bash
# Run migrations
cd /home/afrosuperstore/afrosuperstore.ca/database
./migrate-mysql.sh

# Backup database
mysqldump -u afrosuperstore_db -p afrosuperstore_prod > backup.sql
```

---

## 📊 **MONITORING & LOGS**

### **Log Locations**
```
/home/afrosuperstore/afrosuperstore.ca/logs/
├── apache_access.log          # Apache access logs
├── apache_error.log           # Apache error logs
├── frontend.log               # Frontend application logs
├── api.log                    # API application logs
├── backend.log                # Backend application logs
├── pm2.log                    # PM2 process logs
└── health-check.log           # Health check results
```

### **Health Monitoring**
```bash
# Run health check
/home/afrosuperstore/afrosuperstore.ca/scripts/health-check.sh

# View health check results
tail -f /home/afrosuperstore/afrosuperstore.ca/logs/health-check.log
```

### **Performance Monitoring**
```bash
# System resources
df -h                    # Disk space
free -h                  # Memory usage
top                      # CPU usage

# PM2 monitoring
pm2 monit                # Real-time monitoring
pm2 show afrosuperstore-api  # Detailed process info
```

---

## 🚨 **TROUBLESHOOTING**

### **Common Issues**

#### **Website Not Accessible**
```bash
# Check Apache status
systemctl status apache2

# Check Apache configuration
sudo apache2ctl configtest

# Check Apache logs
tail -f /home/afrosuperstore/afrosuperstore.ca/logs/apache_error.log
```

#### **API Not Responding**
```bash
# Check PM2 status
pm2 status

# Restart API service
pm2 restart afrosuperstore-api

# Check API logs
pm2 logs afrosuperstore-api
```

#### **Database Connection Issues**
```bash
# Test MySQL connection
mysql -h localhost -u afrosuperstore_db -pSecureMySQLPassword2024! -e "SELECT 1;"

# Check MySQL logs
sudo tail -f /var/log/mysql/error.log
```

#### **SSL Certificate Issues**
```bash
# Check SSL certificate
openssl s_client -connect www.afrosuperstore.ca:443 -servername www.afrosuperstore.ca

# Verify certificate files
ls -la /etc/ssl/certs/www.afrosuperstore.ca.crt
ls -la /etc/ssl/private/www.afrosuperstore.ca.key
```

---

## 🔄 **UPDATES & MAINTENANCE**

### **Application Updates**
```bash
# From local machine
deploy-traditional.bat
# Choose Option 3: Update Application Only
```

### **Database Updates**
```bash
# Add new migration file to database/migrations/
# Run migrations
cd /home/afrosuperstore/afrosuperstore.ca/database
./migrate-mysql.sh
```

### **Security Updates**
```bash
# Update system packages
sudo apt update && sudo apt upgrade

# Update Node.js
sudo npm install -g n
sudo n stable

# Update PM2
sudo npm install -g pm2@latest
```

---

## 📞 **SUPPORT & CONTACT**

### **Emergency Procedures**
1. **Website Down**: Check Apache and PM2 status
2. **Database Issues**: Verify MySQL service and connectivity
3. **Performance Issues**: Check system resources and logs
4. **Security Issues**: Review access logs and update passwords

### **Useful Commands**
```bash
# Quick health check
pm2 status && systemctl status apache2 && curl -I https://www.afrosuperstore.ca

# Full system status
/home/afrosuperstore/afrosuperstore.ca/scripts/health-check.sh

# Emergency restart
pm2 restart all && sudo systemctl restart apache2
```

---

## 🎉 **DEPLOYMENT SUCCESS**

Your AfroSuperStore is now live at: **https://www.afrosuperstore.ca**

### **Next Steps**
1. Configure production Stripe keys
2. Set up email notifications
3. Test all payment flows
4. Configure monitoring alerts
5. Set up backup procedures
6. Document admin procedures

---

**Deployment Method**: Traditional (Non-Docker)  
**Platform**: DreamHost VPS  
**User**: afrosuperstore  
**Domain**: www.afrosuperstore.ca  

**Last Updated**: January 2024
