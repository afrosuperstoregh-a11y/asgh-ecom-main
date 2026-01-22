#!/bin/bash

# DreamHost VPS Initial Setup Script
# Run this once to prepare the server for deployment

set -e

# Configuration
DREAMHOST_USER="dh_t5hb7x"
DREAMHOST_SERVER="vps68200.dreamhostps.com"
DOMAIN="www.afrosuperstore.ca"

# Colors
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m'

log() {
    echo -e "${GREEN}[$(date +'%Y-%m-%d %H:%M:%S')] $1${NC}"
}

error() {
    echo -e "${RED}[ERROR] $1${NC}"
    exit 1
}

warning() {
    echo -e "${YELLOW}[WARNING] $1${NC}"
}

# Update system packages
update_system() {
    log "Updating system packages..."
    ssh "$DREAMHOST_USER@$DREAMHOST_SERVER" "
        sudo apt-get update
        sudo apt-get upgrade -y
        sudo apt-get install -y curl wget git htop
    "
    log "System updated ✓"
}

# Install Docker
install_docker() {
    log "Installing Docker..."
    
    ssh "$DREAMHOST_USER@$DREAMHOST_SERVER" "
        # Install Docker
        curl -fsSL https://get.docker.com -o get-docker.sh
        sudo sh get-docker.sh
        
        # Add user to docker group
        sudo usermod -aG docker \$USER
        
        # Install Docker Compose
        sudo curl -L 'https://github.com/docker/compose/releases/latest/download/docker-compose-$(uname -s)-$(uname -m)' -o /usr/local/bin/docker-compose
        sudo chmod +x /usr/local/bin/docker-compose
        
        # Create Docker directory
        mkdir -p ~/.docker
    "
    
    log "Docker installed ✓"
}

# Setup firewall
setup_firewall() {
    log "Setting up firewall..."
    
    ssh "$DREAMHOST_USER@$DREAMHOST_SERVER" "
        # Configure UFW firewall
        sudo ufw --force reset
        sudo ufw default deny incoming
        sudo ufw default allow outgoing
        
        # Allow SSH
        sudo ufw allow ssh
        
        # Allow HTTP and HTTPS
        sudo ufw allow 80/tcp
        sudo ufw allow 443/tcp
        
        # Enable firewall
        sudo ufw --force enable
        
        # Show status
        sudo ufw status verbose
    "
    
    log "Firewall configured ✓"
}

# Create application directory structure
create_directories() {
    log "Creating directory structure..."
    
    ssh "$DREAMHOST_USER@$DREAMHOST_SERVER" "
        mkdir -p ~/afrosuperstore.ca
        mkdir -p ~/afrosuperstore.ca/logs/nginx
        mkdir -p ~/afrosuperstore.ca/logs/frontend
        mkdir -p ~/afrosuperstore.ca/logs/backend
        mkdir -p ~/afrosuperstore.ca/logs/api
        mkdir -p ~/afrosuperstore.ca/nginx/ssl
        mkdir -p ~/afrosuperstore.ca/backups
        mkdir -p ~/afrosuperstore.ca/database/init
    "
    
    log "Directory structure created ✓"
}

# Setup automatic backups
setup_backups() {
    log "Setting up automatic backups..."
    
    ssh "$DREAMHOST_USER@$DREAMHOST_SERVER" "
        # Create backup script
        cat > ~/backup-script.sh << 'EOF'
#!/bin/bash
BACKUP_DIR='/home/dh_t5hb7x/afrosuperstore.ca/backups'
DATE=\$(date +%Y%m%d-%H%M%S)

# Create database backup
docker exec afrosuperstore_postgres pg_dump -U postgres afrosuperstore > \$BACKUP_DIR/database-\$DATE.sql

# Create application backup
cd /home/dh_t5hb7x/afrosuperstore.ca
tar -czf \$BACKUP_DIR/application-\$DATE.tar.gz --exclude='logs' --exclude='node_modules' --exclude='.git' .

# Keep only last 7 days of backups
find \$BACKUP_DIR -name '*.sql' -mtime +7 -delete
find \$BACKUP_DIR -name '*.tar.gz' -mtime +7 -delete

echo 'Backup completed: \$DATE'
EOF
        
        chmod +x ~/backup-script.sh
        
        # Add to crontab (daily at 2 AM)
        (crontab -l 2>/dev/null; echo '0 2 * * * /home/dh_t5hb7x/backup-script.sh >> /home/dh_t5hb7x/backup.log 2>&1') | crontab -
    "
    
    log "Automatic backups configured ✓"
}

# Setup monitoring
setup_monitoring() {
    log "Setting up basic monitoring..."
    
    ssh "$DREAMHOST_USER@$DREAMHOST_SERVER" "
        # Create monitoring script
        cat > ~/monitor-script.sh << 'EOF'
#!/bin/bash

# Check if services are running
if ! docker ps | grep -q afrosuperstore_frontend; then
    echo 'Frontend is down' | mail -s 'AfroSuperStore Alert: Frontend Down' admin@afrosuperstore.ca
fi

if ! docker ps | grep -q afrosuperstore_postgres; then
    echo 'Database is down' | mail -s 'AfroSuperStore Alert: Database Down' admin@afrosuperstore.ca
fi

# Check disk space
DISK_USAGE=\$(df / | awk 'NR==2 {print \$5}' | sed 's/%//')
if [ \$DISK_USAGE -gt 80 ]; then
    echo 'Disk usage is high: '\$DISK_USAGE'%' | mail -s 'AfroSuperStore Alert: High Disk Usage' admin@afrosuperstore.ca
fi
EOF
        
        chmod +x ~/monitor-script.sh
        
        # Add to crontab (every 5 minutes)
        (crontab -l 2>/dev/null; echo '*/5 * * * * /home/dh_t5hb7x/monitor-script.sh >> /home/dh_t5hb7x/monitor.log 2>&1') | crontab -
    "
    
    log "Monitoring configured ✓"
}

# Generate SSH key for deployment
generate_ssh_key() {
    log "Generating SSH key for deployment..."
    
    if [ ! -f ~/.ssh/id_rsa_afrosuperstore ]; then
        ssh-keygen -t rsa -b 4096 -f ~/.ssh/id_rsa_afrosuperstore -N "" -C "deployment@afrosuperstore.ca"
        log "SSH key generated ✓"
        
        echo "Please add the following public key to your DreamHost account:"
        echo ""
        cat ~/.ssh/id_rsa_afrosuperstore.pub
        echo ""
        echo "After adding the key, run: ssh-add ~/.ssh/id_rsa_afrosuperstore"
    else
        log "SSH key already exists ✓"
    fi
}

# Main setup function
main() {
    log "Starting DreamHost VPS setup for AfroSuperStore..."
    
    generate_ssh_key
    update_system
    install_docker
    setup_firewall
    create_directories
    setup_backups
    setup_monitoring
    
    log ""
    log "DreamHost VPS setup completed! 🎉"
    log ""
    log "Next steps:"
    log "1. Add the generated SSH key to your DreamHost account"
    log "2. Update DREAMHOST_USER and DREAMHOST_SERVER in this script"
    log "3. Run: ./scripts/deploy-dreamhost.sh"
    log "4. Setup domain DNS to point to your DreamHost VPS"
    log "5. Configure SSL certificates (./scripts/deploy-dreamhost.sh ssl)"
}

main "$@"
