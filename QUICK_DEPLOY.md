# AfroSuperStore Quick Deployment Guide

## 🚀 Ready to Deploy!

Your DreamHost VPS configuration is ready. Here's how to proceed:

## 📋 Prerequisites Check

Before you start, ensure you have:
- ✅ SSH access to `vps68200.dreamhostps.com` with user `afrosuperstore`
- ✅ Domain `www.afrosuperstore.ca` pointing to your VPS IP
- ✅ Git for Windows installed (includes SSH/SCP)

## 🎯 Quick Deployment Options

### Option 1: Windows Batch Script (Recommended)
```bash
# Double-click this file in Windows Explorer
deploy-windows.bat
```

### Option 2: Manual SSH Commands
```bash
# 1. Initial Setup
ssh afrosuperstore@vps68200.dreamhostps.com
# Run setup commands manually (see DEPLOYMENT_GUIDE.md)

# 2. Deploy Files
scp -r docker-compose.dreamhost.yml afrosuperstore@vps68200.dreamhostps.com:/home/afrosuperstore/afrosuperstore.ca/docker-compose.yml
scp -r nginx/ afrosuperstore@vps68200.dreamhostps.com:/home/afrosuperstore/afrosuperstore.ca/
scp -r ecommerce-platform/ afrosuperstore@vps68200.dreamhostps.com:/home/afrosuperstore/afrosuperstore.ca/
scp .env.dreamhost afrosuperstore@vps68200.dreamhostps.com:/home/afrosuperstore/afrosuperstore.ca/.env

# 3. Start Services
ssh afrosuperstore@vps68200.dreamhostps.com "cd afrosuperstore.ca && docker-compose up -d --build"

# 4. Setup SSL
ssh afrosuperstore@vps68200.dreamhostps.com "cd afrosuperstore.ca && ./scripts/setup-ssl.sh letsencrypt"

# 5. Run Migrations
ssh afrosuperstore@vps68200.dreamhostps.com "cd afrosuperstore.ca && ./database/migrate.sh migrate"
```

## 🔧 Configuration Files Updated

All scripts have been updated with your DreamHost credentials:
- **Server**: `vps68200.dreamhostps.com`
- **User**: `afrosuperstore`
- **Path**: `/home/afrosuperstore/afrosuperstore.ca`
- **Domain**: `www.afrosuperstore.ca`

## ⚡ Deployment Steps

### 1. **Initial Server Setup** (5 minutes)
- Install Docker and Docker Compose
- Configure firewall
- Create directory structure
- Set up monitoring

### 2. **Deploy Application** (10 minutes)
- Copy all files to server
- Build and start Docker containers
- Verify service health

### 3. **Setup SSL** (5 minutes)
- Install Let's Encrypt certificates
- Configure HTTPS
- Set up auto-renewal

### 4. **Database Migration** (2 minutes)
- Run database schema migrations
- Create initial data
- Verify database connectivity

## 🎯 Success Indicators

Your deployment is successful when:
- ✅ All Docker containers are running
- ✅ Website responds at `https://www.afrosuperstore.ca`
- ✅ SSL certificate is valid
- ✅ Database migrations completed
- ✅ No critical errors in logs

## 🔍 Post-Deployment Checks

After deployment, run these checks:

### Website Health
```bash
curl -I https://www.afrosuperstore.ca
```

### SSL Certificate
```bash
openssl s_client -connect www.afrosuperstore.ca:443 -servername www.afrosuperstore.ca
```

### Service Status
```bash
ssh afrosuperstore@vps68200.dreamhostps.com "cd afrosuperstore.ca && docker-compose ps"
```

## 🚨 Troubleshooting

### Common Issues

#### SSH Connection Failed
- Check your SSH key is properly configured
- Verify server address: `vps68200.dreamhostps.com`
- Ensure port 22 is open

#### Services Won't Start
```bash
ssh afrosuperstore@vps68200.dreamhostps.com "cd afrosuperstore.ca && docker-compose logs"
```

#### Website Not Accessible
- Check DNS propagation for `www.afrosuperstore.ca`
- Verify SSL certificate installation
- Check Nginx configuration

#### Database Issues
```bash
ssh afrosuperstore@vps68200.dreamhostps.com "cd afrosuperstore.ca && docker exec afrosuperstore_postgres psql -U postgres -d afrosuperstore -c 'SELECT 1;'"
```

## 📞 Support

If you encounter issues:
1. Check the detailed logs in `DEPLOYMENT_GUIDE.md`
2. Run monitoring script: `ssh afrosuperstore@vps68200.dreamhostps.com "cd afrosuperstore.ca && ./scripts/monitoring.sh all"`
3. Contact DreamHost support for server issues

## 🎉 Ready to Launch!

Your AfroSuperStore deployment package is complete and ready. Choose your deployment method:

**Recommended**: Double-click `deploy-windows.bat` for guided deployment

**Manual**: Follow the manual SSH commands above

**Expected Timeline**: 20-30 minutes total

Your e-commerce platform will be live at: **https://www.afrosuperstore.ca** 🎉
