# AfroSuperStore Deployment Verification Checklist
## Traditional DreamHost VPS Deployment

---

## 🎯 **PRE-DEPLOYMENT VERIFICATION**

### **✅ Environment Setup**
- [ ] SSH access configured: `ssh afrosuperstore@vps68200.dreamhostps.com`
- [ ] Domain DNS configured: `www.afrosuperstore.ca` → VPS IP
- [ ] Git for Windows installed (for SSH/SCP)
- [ ] Production Stripe keys obtained
- [ ] Email service configured
- [ ] SSL certificate ready (DreamHost managed)

### **✅ Configuration Files**
- [ ] `.env.production` filled with real values
- [ ] MySQL password: `SecureMySQLPassword2024!` replaced
- [ ] Redis password: `SecureRedisPassword2024!` replaced
- [ ] JWT secret: 32+ character secure string
- [ ] All placeholder values replaced
- [ ] Apache configuration paths verified

### **✅ Application Files**
- [ ] Frontend package.json exists and valid
- [ ] Backend package.json exists and valid
- [ ] API package.json exists and valid
- [ ] Database migration files present
- [ ] PM2 ecosystem configuration ready
- [ ] Apache virtual host configuration ready

---

## 🚀 **DEPLOYMENT PROCESS VERIFICATION**

### **Phase 1: Server Setup**
```bash
# Test SSH connection
ssh afrosuperstore@vps68200.dreamhostps.com "echo 'SSH OK'"

# Verify setup script execution
ssh afrosuperstore@vps68200.dreamhostps.com "ls -la /home/afrosuperstore/afrosuperstore.ca"
```

**Expected Results:**
- [ ] SSH connection successful
- [ ] Directory structure created
- [ ] Node.js 18.x installed
- [ ] PM2 installed globally
- [ ] Apache modules enabled
- [ ] Log directories created

### **Phase 2: File Upload**
```bash
# Verify file upload
ssh afrosuperstore@vps68200.dreamhostps.com "ls -la /home/afrosuperstore/afrosuperstore.ca/frontend"
ssh afrosuperstore@vps68200.dreamhostps.com "ls -la /home/afrosuperstore/afrosuperstore.ca/backend"
ssh afrosuperstore@vps682store@vps68200.dreamhostps.com "ls -la /home/afrosuperstore/afrosuperstore.ca/api"
```

**Expected Results:**
- [ ] Frontend files uploaded
- [ ] Backend files uploaded
- [ ] API files uploaded
- [ ] Configuration files uploaded
- [ ] Scripts uploaded and executable

### **Phase 3: Dependencies Installation**
```bash
# Check npm installations
ssh afrosuperstore@vps68200.dreamhostps.com "cd /home/afrosuperstore/afrosuperstore.ca/frontend && npm list --depth=0"
ssh afrosuperstore@vps68200.dreamhostps.com "cd /home/afrosuperstore/afrosuperstore.ca/backend && npm list --depth=0"
ssh afrosuperstore@vps68200.dreamhostps.com "cd /home/afrosuperstore/afrosuperstore.ca/api && npm list --depth=0"
```

**Expected Results:**
- [ ] Frontend dependencies installed
- [ ] Backend dependencies installed
- [ ] API dependencies installed
- [ ] No installation errors

### **Phase 4: Frontend Build**
```bash
# Verify frontend build
ssh afrosuperstore@vps68200.dreamhostps.com "ls -la /home/afrosuperstore/afrosuperstore.ca/frontend/.next"
```

**Expected Results:**
- [ ] Frontend build completed successfully
- [ ] .next directory exists
- [ ] Static files generated
- [ ] Build errors resolved

### **Phase 5: Database Setup**
```bash
# Test database connection
ssh afrosuperstore@vps68200.dreamhostps.com "mysql -h localhost -u afrosuperstore_db -pSecureMySQLPassword2024! -e 'SHOW TABLES;' afrosuperstore_prod"

# Check migrations
ssh afrosuperstore@vps68200.dreamhostps.com "mysql -h localhost -u afrosuperstore_db -pSecureMySQLPassword2024! -e 'SELECT * FROM migrations;' afrosuperstore_prod"
```

**Expected Results:**
- [ ] Database connection successful
- [ ] Database created
- [ ] User created with correct permissions
- [ ] All migrations executed
- [ ] Sample data inserted

### **Phase 6: Apache Configuration**
```bash
# Test Apache configuration
ssh afrosuperstore@vps68200.dreamhostps.com "sudo apache2ctl configtest"

# Check Apache status
ssh afrosuperstore@vps68200.dreamhostps.com "systemctl status apache2"

# Verify virtual host
ssh afrosuperstore@vps68200.dreamhostps.com "sudo apache2ctl -S | grep afrosuperstore"
```

**Expected Results:**
- [ ] Apache configuration syntax OK
- [ ] Virtual host enabled
- [ ] Apache running without errors
- [ ] SSL configuration loaded

### **Phase 7: Node.js Services**
```bash
# Check PM2 status
ssh afrosuperstore@vps68200.dreamhostps.com "pm2 status"

# Verify process details
ssh afrosuperstore@vps68200.dreamhostps.com "pm2 show afrosuperstore-frontend"
ssh afrosuperstore@vps68200.dreamhostps.com "pm2 show afrosuperstore-api"
ssh afrosuperstore@vps68200.dreamhostps.com "pm2 show afrosuperstore-backend"
```

**Expected Results:**
- [ ] All PM2 processes running
- [ ] Frontend running on port 3000
- [ ] API running on port 3001
- [ ] Backend running on port 3002
- [ ] No process restart loops

---

## 🔍 **POST-DEPLOYMENT VERIFICATION**

### **✅ Website Accessibility**
```bash
# Test website response
curl -I https://www.afrosuperstore.ca

# Test SSL certificate
openssl s_client -connect www.afrosuperstore.ca:443 -servername www.afrosuperstore.ca

# Check HTTP to HTTPS redirect
curl -I http://www.afrosuperstore.ca
```

**Expected Results:**
- [ ] Website loads successfully (200 OK)
- [ ] SSL certificate valid and trusted
- [ ] HTTP redirects to HTTPS
- [ ] No SSL errors
- [ ] Fast page load times

### **✅ API Endpoints**
```bash
# Test API health endpoint
curl https://www.afrosuperstore.ca/api/health

# Test API response headers
curl -I https://www.afrosuperstore.ca/api/products

# Test CORS headers
curl -H "Origin: https://www.afrosuperstore.ca" -H "Access-Control-Request-Method: GET" -X OPTIONS https://www.afrosuperstore.ca/api/products
```

**Expected Results:**
- [ ] API endpoints respond correctly
- [ ] CORS headers properly configured
- [ ] API response times acceptable
- [ ] No API errors

### **✅ Application Functionality**

#### **Frontend Testing**
- [ ] Homepage loads correctly
- [ ] Navigation works
- [ ] Product pages load
- [ ] Search functionality works
- [ ] Shopping cart functions
- [ ] User registration/login works
- [ ] Mobile responsive design

#### **Backend Testing**
- [ ] Admin panel accessible: `https://www.afrosuperstore.ca/admin`
- [ ] Admin login works
- [ ] Product management works
- [ ] Order management works
- [ ] User management works

#### **API Testing**
- [ ] Product listing API works
- [ ] User authentication API works
- [ ] Order processing API works
- [ ] Payment integration works (test mode)

### **✅ Performance & Security**

#### **Performance Checks**
```bash
# Check page load time
curl -w "@curl-format.txt" -o /dev/null -s https://www.afrosuperstore.ca

# Check server response time
curl -w "%{time_total}\n" -o /dev/null -s https://www.afrosuperstore.ca/api/health
```

**Expected Results:**
- [ ] Page load time < 3 seconds
- [ ] API response time < 500ms
- [ ] No memory leaks in Node.js processes
- [ ] CPU usage within acceptable limits

#### **Security Checks**
```bash
# Check security headers
curl -I https://www.afrosuperstore.ca | grep -E "(X-Frame-Options|X-Content-Type|X-XSS|Strict-Transport)"

# Test for common vulnerabilities
curl -I https://www.afrosuperstore.ca | grep -i server
```

**Expected Results:**
- [ ] Security headers present
- [ ] HTTPS enforced
- [ ] No server version disclosure
- [ ] Rate limiting working
- [ ] Input validation working

---

## 📊 **MONITORING VERIFICATION**

### **✅ Logging System**
```bash
# Check log files exist
ssh afrosuperstore@vps68200.dreamhostps.com "ls -la /home/afrosuperstore/afrosuperstore.ca/logs/"

# Check log rotation
ssh afrosuperstore@vps68200.dreamhostps.com "cat /etc/logrotate.d/afrosuperstore"
```

**Expected Results:**
- [ ] All log files created
- [ ] Log rotation configured
- [ ] Logs being written
- [ ] No permission issues

### **✅ Health Monitoring**
```bash
# Run health check script
ssh afrosuperstore@vps68200.dreamhostps.com "/home/afrosuperstore/afrosuperstore.ca/scripts/health-check.sh"

# Check cron job
ssh afrosuperstore@vps68200.dreamhostps.com "crontab -l | grep health-check"
```

**Expected Results:**
- [ ] Health check script runs successfully
- [ ] All services report healthy
- [ ] Cron job scheduled
- [ ] Health check logs created

### **✅ PM2 Monitoring**
```bash
# Check PM2 monitoring
ssh afrosuperstore@vps68200.dreamhostps.com "pm2 monit --no-daemon"

# Check PM2 startup configuration
ssh afrosuperstore@vps68200.dreamhostps.com "pm2 startup"
```

**Expected Results:**
- [ ] PM2 monitoring working
- [ ] Startup script configured
- [ ] Process auto-restart working
- [ ] Memory usage monitored

---

## 🚨 **TROUBLESHOOTING CHECKLIST**

### **If Website Not Accessible**
- [ ] Check Apache status: `systemctl status apache2`
- [ ] Check Apache configuration: `sudo apache2ctl configtest`
- [ ] Check Apache logs: `tail -f logs/apache_error.log`
- [ ] Check SSL certificate: `openssl s_client -connect www.afrosuperstore.ca:443`
- [ ] Check DNS resolution: `nslookup www.afrosuperstore.ca`

### **If API Not Responding**
- [ ] Check PM2 status: `pm2 status`
- [ ] Check API logs: `pm2 logs afrosuperstore-api`
- [ ] Check port availability: `netstat -tlnp | grep 3001`
- [ ] Test API directly: `curl http://localhost:3001/api/health`

### **If Database Issues**
- [ ] Check MySQL status: `systemctl status mysql`
- [ ] Test connection: `mysql -u afrosuperstore_db -p`
- [ ] Check MySQL logs: `sudo tail -f /var/log/mysql/error.log`
- [ ] Verify database exists: `mysql -e "SHOW DATABASES;"`

### **If Performance Issues**
- [ ] Check system resources: `top`, `free -h`, `df -h`
- [ ] Check PM2 memory usage: `pm2 monit`
- [ ] Check Apache connections: `sudo apachectl status`
- [ ] Analyze slow queries: Check MySQL slow query log

---

## ✅ **FINAL SIGN-OFF**

### **Production Readiness Checklist**
- [ ] All critical functionality tested
- [ ] Performance benchmarks met
- [ ] Security measures in place
- [ ] Monitoring and alerting configured
- [ ] Backup procedures documented
- [ ] Rollback plan prepared
- [ ] Team training completed
- [ ] Documentation updated

### **Go/No-Go Decision**
**GO Conditions:**
- All critical tests pass
- Performance meets requirements
- Security scan passes
- Monitoring is active
- Team is ready

**NO-GO Conditions:**
- Critical functionality broken
- Security vulnerabilities found
- Performance below thresholds
- Monitoring not working
- Team not prepared

---

## 📞 **EMERGENCY CONTACTS**

### **Technical Support**
- **DreamHost Support**: Available 24/7
- **Domain Registrar**: For DNS issues
- **Stripe Support**: For payment issues
- **Email Provider**: For email issues

### **Internal Contacts**
- **DevOps Engineer**: Server and deployment issues
- **Backend Developer**: API and database issues
- **Frontend Developer**: UI/UX issues
- **Project Manager**: Coordination and communication

---

## 📈 **SUCCESS METRICS**

### **Technical Metrics**
- **Uptime**: > 99.9%
- **Page Load Time**: < 3 seconds
- **API Response Time**: < 500ms
- **Error Rate**: < 0.1%
- **Security Score**: A+ grade

### **Business Metrics**
- **Conversion Rate**: Track and optimize
- **User Registration**: Monitor sign-ups
- **Order Processing**: Track successful orders
- **Payment Success**: Monitor payment failures
- **Customer Satisfaction**: Collect feedback

---

**Verification Completed By**: _________________________  
**Date**: _________________________________________  
**Version**: Traditional Deployment v1.0  
**Environment**: Production - DreamHost VPS
