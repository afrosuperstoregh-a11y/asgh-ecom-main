#!/bin/bash

# DreamHost VPS Deployment Script for AfroSuperStore
# Domain: www.afrosuperstore.ca

set -e

# Configuration
DREAMHOST_USER="afrosuperstore"
DREAMHOST_SERVER="vps68200.dreamhostps.com"
DREAMHOST_PATH="/home/afrosuperstore/afrosuperstore.ca"
DOMAIN="www.afrosuperstore.ca"
EMAIL="admin@afrosuperstore.ca"

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Logging function
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

# Check if required tools are installed
check_requirements() {
    log "Checking requirements..."
    
    command -v ssh >/dev/null 2>&1 || error "SSH is required but not installed"
    command -v docker >/dev/null 2>&1 || error "Docker is required but not installed"
    command -v docker-compose >/dev/null 2>&1 || error "Docker Compose is required but not installed"
    
    log "All requirements satisfied ✓"
}

# Backup existing deployment
backup_existing() {
    log "Creating backup of existing deployment..."
    
    ssh "$DREAMHOST_USER@$DREAMHOST_SERVER" "
        if [ -d '$DREAMHOST_PATH' ]; then
            cd '$DREAMHOST_PATH'
            tar -czf '../backup-$(date +%Y%m%d-%H%M%S).tar.gz' --exclude='logs' --exclude='node_modules' --exclude='.git' .
            log 'Backup created: ../backup-$(date +%Y%m%d-%H%M%S).tar.gz ✓'
        else
            log 'No existing deployment to backup'
        fi
    "
}

# Deploy application files
deploy_files() {
    log "Deploying application files..."
    
    # Create necessary directories on server
    ssh "$DREAMHOST_USER@$DREAMHOST_SERVER" "
        mkdir -p '$DREAMHOST_PATH'
        mkdir -p '$DREAMHOST_PATH/logs/nginx'
        mkdir -p '$DREAMHOST_PATH/logs/frontend'
        mkdir -p '$DREAMHOST_PATH/logs/backend'
        mkdir -p '$DREAMHOST_PATH/logs/api'
        mkdir -p '$DREAMHOST_PATH/nginx/ssl'
    "
    
    # Copy files to server
    scp -r docker-compose.dreamhost.yml "$DREAMHOST_USER@$DREAMHOST_SERVER:$DREAMHOST_PATH/docker-compose.yml"
    scp -r nginx/ "$DREAMHOST_USER@$DREAMHOST_SERVER:$DREAMHOST_PATH/"
    scp -r ecommerce-platform/ "$DREAMHOST_USER@$DREAMHOST_SERVER:$DREAMHOST_PATH/"
    
    log "Files deployed successfully ✓"
}

# Setup SSL certificates
setup_ssl() {
    log "Setting up SSL certificates..."
    
    # Check if SSL certificates exist
    ssh "$DREAMHOST_USER@$DREAMHOST_SERVER" "
        if [ ! -f '$DREAMHOST_PATH/nginx/ssl/$DOMAIN.crt' ] || [ ! -f '$DREAMHOST_PATH/nginx/ssl/$DOMAIN.key' ]; then
            log 'SSL certificates not found. Generating self-signed certificates...'
            cd '$DREAMHOST_PATH/nginx/ssl'
            
            # Generate private key
            openssl genrsa -out '$DOMAIN.key' 2048
            
            # Generate certificate signing request
            openssl req -new -key '$DOMAIN.key' -out '$DOMAIN.csr' -subj '/C=CA/ST=Ontario/L=Toronto/O=AfroSuperStore/CN=$DOMAIN'
            
            # Generate self-signed certificate
            openssl x509 -req -days 365 -in '$DOMAIN.csr' -signkey '$DOMAIN.key' -out '$DOMAIN.crt'
            
            log 'Self-signed certificates generated. Replace with proper certificates for production!'
            warning 'For production, use Let\\'s Encrypt or purchase SSL certificates'
        else
            log 'SSL certificates already exist ✓'
        fi
    "
}

# Deploy and start services
deploy_services() {
    log "Deploying and starting services..."
    
    ssh "$DREAMHOST_USER@$DREAMHOST_SERVER" "
        cd '$DREAMHOST_PATH'
        
        # Stop existing services
        docker-compose down || true
        
        # Build and start services
        docker-compose up -d --build
        
        # Wait for services to be healthy
        log 'Waiting for services to be healthy...'
        sleep 30
        
        # Check service status
        docker-compose ps
    "
    
    log "Services deployed and started ✓"
}

# Setup SSL with Let's Encrypt (optional)
setup_letsencrypt() {
    log "Setting up Let's Encrypt SSL certificates..."
    
    ssh "$DREAMHOST_USER@$DREAMHOST_SERVER" "
        cd '$DREAMHOST_PATH'
        
        # Install certbot if not present
        if ! command -v certbot &> /dev/null; then
            sudo apt-get update
            sudo apt-get install -y certbot python3-certbot-nginx
        fi
        
        # Generate SSL certificates
        sudo certbot --nginx -d '$DOMAIN' -d 'afrosuperstore.ca' --email '$EMAIL' --agree-tos --non-interactive
        
        # Setup auto-renewal
        (crontab -l 2>/dev/null; echo '0 12 * * * /usr/bin/certbot renew --quiet') | crontab -
    "
    
    log "Let's Encrypt SSL setup completed ✓"
}

# Health check
health_check() {
    log "Performing health check..."
    
    # Wait for services to start
    sleep 60
    
    # Check if the site is accessible
    if curl -f -s "https://$DOMAIN/health" > /dev/null; then
        log "Health check passed ✓"
        log "Site is accessible at: https://$DOMAIN"
    else
        error "Health check failed. Please check the logs."
    fi
}

# Cleanup old containers and images
cleanup() {
    log "Cleaning up old Docker resources..."
    
    ssh "$DREAMHOST_USER@$DREAMHOST_SERVER" "
        cd '$DREAMHOST_PATH'
        
        # Remove unused containers
        docker container prune -f
        
        # Remove unused images
        docker image prune -f
        
        # Remove unused volumes (be careful with this)
        docker volume prune -f
    "
    
    log "Cleanup completed ✓"
}

# Main deployment function
main() {
    log "Starting deployment of AfroSuperStore to DreamHost VPS..."
    log "Domain: $DOMAIN"
    log "Server: $DREAMHOST_SERVER"
    
    check_requirements
    backup_existing
    deploy_files
    setup_ssl
    deploy_services
    health_check
    cleanup
    
    log "Deployment completed successfully! 🎉"
    log "Your AfroSuperStore is now live at: https://$DOMAIN"
    log ""
    log "Next steps:"
    log "1. Replace self-signed SSL certificates with proper certificates"
    log "2. Monitor the application logs: ssh $DREAMHOST_USER@$DREAMHOST_SERVER 'cd $DREAMHOST_PATH && docker-compose logs -f'"
    log "3. Set up monitoring and backups"
}

# Handle script arguments
case "${1:-}" in
    "ssl")
        setup_letsencrypt
        ;;
    "health")
        health_check
        ;;
    "cleanup")
        cleanup
        ;;
    *)
        main
        ;;
esac
