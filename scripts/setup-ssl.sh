#!/bin/bash

# SSL Certificate Setup Script for www.afrosuperstore.ca
# Supports both Let's Encrypt and manual certificate installation

set -e

# Configuration
DOMAIN="www.afrosuperstore.ca"
EMAIL="admin@afrosuperstore.ca"
DREAMHOST_USER="afrosuperstore"
DREAMHOST_SERVER="vps68200.dreamhostps.com"
SSL_PATH="/home/afrosuperstore/afrosuperstore.ca/nginx/ssl"

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

# Install Let's Encrypt certificates
install_letsencrypt() {
    log "Installing Let's Encrypt SSL certificates..."
    
    ssh "$DREAMHOST_USER@$DREAMHOST_SERVER" "
        # Install certbot and nginx plugin
        sudo apt-get update
        sudo apt-get install -y certbot python3-certbot-nginx
        
        # Stop nginx to free up port 80
        docker-compose -f /home/$DREAMHOST_USER/afrosuperstore/docker-compose.yml stop nginx || true
        
        # Generate certificates
        sudo certbot certonly --standalone \
            --email '$EMAIL' \
            --agree-tos \
            --non-interactive \
            -d '$DOMAIN' \
            -d 'afrosuperstore.ca' \
            --rsa-key-size 4096
        
        # Copy certificates to nginx ssl directory
        sudo cp /etc/letsencrypt/live/$DOMAIN/fullchain.pem $SSL_PATH/$DOMAIN.crt
        sudo cp /etc/letsencrypt/live/$DOMAIN/privkey.pem $SSL_PATH/$DOMAIN.key
        sudo chown $DREAMHOST_USER:$DREAMHOST_USER $SSL_PATH/*
        
        # Start nginx
        docker-compose -f /home/$DREAMHOST_USER/afrosuperstore/docker-compose.yml start nginx
        
        # Setup auto-renewal
        (crontab -l 2>/dev/null; echo '0 3 * * * /usr/bin/certbot renew --quiet --post-hook \"docker-compose -f /home/$DREAMHOST_USER/afrosuperstore/docker-compose.yml restart nginx\"') | crontab -
    "
    
    log "Let's Encrypt certificates installed ✓"
}

# Install manual certificates
install_manual() {
    log "Installing manual SSL certificates..."
    
    echo "Please provide the following certificate files:"
    echo "1. Certificate file (.crt or .pem)"
    echo "2. Private key file (.key)"
    echo ""
    
    read -p "Enter path to certificate file: " CERT_FILE
    read -p "Enter path to private key file: " KEY_FILE
    
    if [ ! -f "$CERT_FILE" ]; then
        error "Certificate file not found: $CERT_FILE"
    fi
    
    if [ ! -f "$KEY_FILE" ]; then
        error "Private key file not found: $KEY_FILE"
    fi
    
    # Upload certificates
    scp "$CERT_FILE" "$DREAMHOST_USER@$DREAMHOST_SERVER:$SSL_PATH/$DOMAIN.crt"
    scp "$KEY_FILE" "$DREAMHOST_USER@$DREAMHOST_SERVER:$SSL_PATH/$DOMAIN.key"
    
    # Restart nginx
    ssh "$DREAMHOST_USER@$DREAMHOST_SERVER" "
        docker-compose -f /home/$DREAMHOST_USER/afrosuperstore/docker-compose.yml restart nginx
    "
    
    log "Manual certificates installed ✓"
}

# Generate self-signed certificates (for testing)
generate_self_signed() {
    log "Generating self-signed SSL certificates (for testing only)..."
    
    ssh "$DREAMHOST_USER@$DREAMHOST_SERVER" "
        cd $SSL_PATH
        
        # Generate private key
        openssl genrsa -out '$DOMAIN.key' 2048
        
        # Generate certificate signing request
        openssl req -new -key '$DOMAIN.key' -out '$DOMAIN.csr' -subj '/C=CA/ST=Ontario/L=Toronto/O=AfroSuperStore/CN=$DOMAIN'
        
        # Generate self-signed certificate
        openssl x509 -req -days 365 -in '$DOMAIN.csr' -signkey '$DOMAIN.key' -out '$DOMAIN.crt'
        
        # Set proper permissions
        chmod 600 '$DOMAIN.key'
        chmod 644 '$DOMAIN.crt'
        
        # Restart nginx
        docker-compose -f /home/$DREAMHOST_USER/afrosuperstore/docker-compose.yml restart nginx
    "
    
    warning "Self-signed certificates generated. Browser will show security warning!"
    log "For production, use Let's Encrypt or purchase certificates"
}

# Verify SSL installation
verify_ssl() {
    log "Verifying SSL installation..."
    
    # Wait for nginx to restart
    sleep 10
    
    # Check SSL certificate
    if echo | openssl s_client -connect $DOMAIN:443 -servername $DOMAIN 2>/dev/null | openssl x509 -noout -dates 2>/dev/null | grep -q "notAfter"; then
        log "SSL certificate is valid ✓"
        
        # Show certificate details
        echo "Certificate details:"
        echo | openssl s_client -connect $DOMAIN:443 -servername $DOMAIN 2>/dev/null | openssl x509 -noout -dates 2>/dev/null
    else
        error "SSL certificate verification failed"
    fi
}

# Test SSL configuration
test_ssl() {
    log "Testing SSL configuration..."
    
    # Test SSL labs rating
    log "Testing SSL with SSL Labs..."
    curl -s "https://www.ssllabs.com/ssltest/analyze.html?d=$DOMAIN&hideResults=on" | grep -o '"rating":"[^"]*"' | sed 's/"rating":"\([^"]*\)"/\1/' || echo "Test queued, check results later"
    
    # Test certificate chain
    log "Testing certificate chain..."
    echo | openssl s_client -connect $DOMAIN:443 -servername $DOMAIN 2>/dev/null | openssl verify -CAfile /etc/ssl/certs/ca-certificates.crt
}

# Main function
main() {
    case "${1:-letsencrypt}" in
        "letsencrypt")
            install_letsencrypt
            verify_ssl
            ;;
        "manual")
            install_manual
            verify_ssl
            ;;
        "self-signed")
            generate_self_signed
            verify_ssl
            ;;
        "test")
            test_ssl
            ;;
        "help"|"-h"|"--help")
            echo "Usage: $0 [letsencrypt|manual|self-signed|test]"
            echo ""
            echo "Options:"
            echo "  letsencrypt    Install Let's Encrypt certificates (recommended)"
            echo "  manual        Install manual certificate files"
            echo "  self-signed   Generate self-signed certificates (testing only)"
            echo "  test          Test SSL configuration"
            echo ""
            echo "Examples:"
            echo "  $0 letsencrypt     # Install Let's Encrypt certificates"
            echo "  $0 manual          # Install from local files"
            echo "  $0 self-signed     # Generate for testing"
            exit 0
            ;;
        *)
            error "Invalid option. Use 'help' for usage information."
            ;;
    esac
    
    log ""
    log "SSL setup completed!"
    log "Your site should be accessible at: https://$DOMAIN"
}

main "$@"
