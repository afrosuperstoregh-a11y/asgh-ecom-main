#!/bin/bash

# Security Setup Script for E-commerce Platform
# Configures SSL certificates, security headers, and hardening

set -e

echo "🔒 Setting up security configuration..."

# Variables
DOMAIN=${DOMAIN:-"your-domain.com"}
SSL_DIR="/etc/nginx/ssl"
CONFIG_DIR="/etc/nginx/conf.d"

# Create SSL directory
mkdir -p $SSL_DIR

# Generate self-signed SSL certificate for development
if [ ! -f "$SSL_DIR/cert.pem" ]; then
    echo "📋 Generating SSL certificate..."
    openssl req -x509 -nodes -days 365 -newkey rsa:2048 \
        -keyout $SSL_DIR/key.pem \
        -out $SSL_DIR/cert.pem \
        -subj "/C=US/ST=State/L=City/O=Organization/CN=$DOMAIN"
    chmod 600 $SSL_DIR/key.pem
    chmod 644 $SSL_DIR/cert.pem
fi

# Create security configuration
cat > $CONFIG_DIR/security.conf << 'EOF'
# Additional security configurations

# Hide server tokens
server_tokens off;

# Disable unwanted HTTP methods
if ($request_method !~ ^(GET|HEAD|POST|PUT|DELETE|OPTIONS)$ ) {
    return 405;
}

# Prevent access to hidden files
location ~ /\. {
    deny all;
    access_log off;
    log_not_found off;
}

# Prevent access to backup files
location ~ ~$ {
    deny all;
    access_log off;
    log_not_found off;
}

# Block suspicious user agents
map $http_user_agent $bad_bot {
    default 0;
    ~*malicious 1;
    ~*bot 1;
    ~*crawler 1;
    ~*spider 1;
}

# Block bad bots
server {
    if ($bad_bot) {
        return 403;
    }
}

# Rate limiting for specific endpoints
limit_req_zone $binary_remote_addr zone=upload:10m rate=1r/s;
limit_req_zone $binary_remote_addr zone=search:10m rate=5r/s;

# Connection limiting
limit_conn_zone $binary_remote_addr zone=conn_limit_per_ip:10m;
EOF

# Create CSP configuration
cat > $CONFIG_DIR/csp.conf << 'EOF'
# Content Security Policy configuration
map $http_accept $csp_script_src {
    default "'self' 'unsafe-inline' 'unsafe-eval'";
    "~*application/json" "'self'";
}

map $http_accept $csp_style_src {
    default "'self' 'unsafe-inline' https://fonts.googleapis.com";
    "~*application/json" "'self'";
}

# Add CSP headers dynamically
add_header Content-Security-Policy "default-src 'self'; script-src $csp_script_src https://js.stripe.com https://www.googletagmanager.com; style-src $csp_style_src; font-src 'self' https://fonts.gstatic.com; img-src 'self' data: https:; connect-src 'self' https://api.stripe.com; frame-src 'self' https://js.stripe.com;" always;
EOF

# Create fail2ban configuration
cat > /etc/fail2ban/jail.local << 'EOF'
[DEFAULT]
bantime = 3600
findtime = 600
maxretry = 5
backend = systemd

[nginx-http-auth]
enabled = true
filter = nginx-http-auth
logpath = /var/log/nginx/error.log
maxretry = 3

[nginx-limit-req]
enabled = true
filter = nginx-limit-req
logpath = /var/log/nginx/error.log
maxretry = 3

[nginx-botsearch]
enabled = true
filter = nginx-botsearch
logpath = /var/log/nginx/access.log
maxretry = 2
EOF

# Create fail2ban filters
cat > /etc/fail2ban/filter.d/nginx-limit-req.conf << 'EOF'
[Definition]
failregex = limiting requests, excess: .* by zone .*, client: <HOST>
ignoreregex =
EOF

# Setup automatic SSL renewal with Let's Encrypt (for production)
if [ "$ENVIRONMENT" = "production" ]; then
    echo "🔧 Setting up Let's Encrypt..."
    
    # Install certbot
    if ! command -v certbot &> /dev/null; then
        apt-get update
        apt-get install -y certbot python3-certbot-nginx
    fi
    
    # Obtain SSL certificate
    if [ ! -f "$SSL_DIR/fullchain.pem" ]; then
        certbot --nginx -d $DOMAIN -d www.$DOMAIN --non-interactive --agree-tos --email admin@$DOMAIN
    fi
    
    # Setup auto-renewal
    echo "0 12 * * * /usr/bin/certbot renew --quiet" | crontab -
fi

# Setup log rotation
cat > /etc/logrotate.d/nginx << 'EOF'
/var/log/nginx/*.log {
    daily
    missingok
    rotate 52
    compress
    delaycompress
    notifempty
    create 644 nginx nginx
    postrotate
        if [ -f /var/run/nginx.pid ]; then
            kill -USR1 `cat /var/run/nginx.pid`
        fi
    endscript
}
EOF

# Setup file permissions
chmod 755 /var/log/nginx
chmod 644 /var/log/nginx/*.log

# Enable and start services
systemctl enable nginx
systemctl enable fail2ban

# Restart services
systemctl restart nginx
systemctl restart fail2ban

echo "✅ Security setup completed!"
echo "📋 Security features enabled:"
echo "   - SSL/TLS encryption"
echo "   - Security headers"
echo "   - Rate limiting"
echo "   - Fail2ban protection"
echo "   - Log rotation"
echo "   - File permissions hardening"
