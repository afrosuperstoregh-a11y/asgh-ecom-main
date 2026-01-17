#!/bin/bash

# Security Setup Script for E-Commerce Platform
# This script sets up comprehensive security infrastructure

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Configuration
SECURITY_DIR="./security"
CERTS_DIR="$SECURITY_DIR/certs"
CONFIG_DIR="$SECURITY_DIR/config"
LOGS_DIR="$SECURITY_DIR/logs"
REPORTS_DIR="$SECURITY_DIR/reports"

echo -e "${BLUE}🔒 Setting Up Security Infrastructure${NC}"
echo -e "${BLUE}=====================================${NC}"

# Function to print section headers
print_section() {
    echo -e "\n${YELLOW}📋 $1${NC}"
    echo -e "${YELLOW}----------------------------------------${NC}"
}

# Function to print success/error
print_status() {
    if [ $1 -eq 0 ]; then
        echo -e "${GREEN}✅ $2${NC}"
    else
        echo -e "${RED}❌ $2${NC}"
        echo -e "${RED}   Error: $3${NC}"
        exit 1
    fi
}

# Function to check if tool is installed
check_tool() {
    if ! command -v $1 &> /dev/null; then
        echo -e "${RED}❌ $1 is not installed. Please install it first.${NC}"
        exit 1
    fi
    echo -e "${GREEN}✅ $1 is available${NC}"
}

# Function to create directory structure
create_directories() {
    print_section "Creating Directory Structure"
    
    mkdir -p "$CERTS_DIR"
    mkdir -p "$CONFIG_DIR"
    mkdir -p "$LOGS_DIR"
    mkdir -p "$REPORTS_DIR"
    mkdir -p "$SECURITY_DIR/policies"
    mkdir -p "$SECURITY_DIR/scripts"
    mkdir -p "$SECURITY_DIR/backups"
    
    print_status 0 "Directory structure created"
}

# Function to generate SSL certificates
generate_certificates() {
    print_section "Generating SSL Certificates"
    
    check_tool "openssl"
    
    # Generate CA certificate
    echo "Generating CA certificate..."
    openssl genrsa -out "$CERTS_DIR/ca.key" 4096
    openssl req -new -x509 -days 3650 -key "$CERTS_DIR/ca.key" -out "$CERTS_DIR/ca.crt" \
        -subj "/C=US/ST=State/L=City/O=Organization/CN=E-Commerce-CA"
    
    # Generate server certificate
    echo "Generating server certificate..."
    openssl genrsa -out "$CERTS_DIR/server.key" 2048
    openssl req -new -key "$CERTS_DIR/server.key" -out "$CERTS_DIR/server.csr" \
        -subj "/C=US/ST=State/L=City/O=Organization/CN=localhost"
    
    # Sign server certificate
    openssl x509 -req -in "$CERTS_DIR/server.csr" -CA "$CERTS_DIR/ca.crt" \
        -CAkey "$CERTS_DIR/ca.key" -CAcreateserial -out "$CERTS_DIR/server.crt" \
        -days 365 -extensions v3_req -extfile <(cat <<EOF
[v3_req]
basicConstraints = CA:FALSE
keyUsage = nonRepudiation, digitalSignature, keyEncipherment
subjectAltName = @alt_names
[alt_names]
DNS.1 = localhost
DNS.2 = *.localhost
IP.1 = 127.0.0.1
IP.2 = ::1
EOF
)
    
    # Generate Diffie-Hellman parameters
    echo "Generating DH parameters..."
    openssl dhparam -out "$CERTS_DIR/dhparam.pem" 2048
    
    print_status 0 "SSL certificates generated"
}

# Function to create security configuration files
create_security_configs() {
    print_section "Creating Security Configuration Files"
    
    # Create nginx security configuration
    cat > "$CONFIG_DIR/nginx-security.conf" << 'EOF'
# Nginx Security Configuration
server {
    listen 443 ssl http2;
    server_name localhost;
    
    # SSL Configuration
    ssl_certificate /etc/ssl/certs/server.crt;
    ssl_certificate_key /etc/ssl/certs/server.key;
    ssl_dhparam /etc/ssl/certs/dhparam.pem;
    ssl_protocols TLSv1.2 TLSv1.3;
    ssl_ciphers ECDHE-ECDSA-AES256-GCM-SHA384:ECDHE-RSA-AES256-GCM-SHA384;
    ssl_prefer_server_ciphers off;
    ssl_session_cache shared:SSL:10m;
    ssl_session_timeout 10m;
    
    # Security Headers
    add_header X-Frame-Options DENY;
    add_header X-Content-Type-Options nosniff;
    add_header X-XSS-Protection "1; mode=block";
    add_header Strict-Transport-Security "max-age=31536000; includeSubDomains; preload";
    add_header Referrer-Policy "strict-origin-when-cross-origin";
    add_header Content-Security-Policy "default-src 'self'; script-src 'self' 'unsafe-inline'; style-src 'self' 'unsafe-inline';";
    
    # Rate Limiting
    limit_req_zone $binary_remote_addr zone=api:10m rate=10r/s;
    limit_req_zone $binary_remote_addr zone=login:10m rate=1r/s;
    
    # API Routes
    location /api/ {
        limit_req zone=api burst=20 nodelay;
        proxy_pass http://security-api:3000;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }
    
    # Login Route
    location /api/auth/login {
        limit_req zone=login burst=5 nodelay;
        proxy_pass http://security-api:3000;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }
    
    # Static Files
    location / {
        root /var/www/html;
        index index.html;
        try_files $uri $uri/ /index.html;
    }
}
EOF
    
    # Create WAF configuration
    cat > "$CONFIG_DIR/modsecurity.conf" << 'EOF'
# ModSecurity Core Rule Set
SecRuleEngine On
SecRequestBodyAccess On
SecResponseBodyAccess On
SecResponseBodyMimeType text/plain text/html text/xml application/json

# Basic Rules
SecRule ARGS "@detectSQLi" \
    "id:1001,\
    phase:2,\
    block,\
    msg:'SQL Injection Attack Detected',\
    logdata:'Matched Data: %{MATCHED_VAR}',\
    tag:'application-multi',\
    tag:'language-multi'"

SecRule ARGS "@detectXSS" \
    "id:1002,\
    phase:2,\
    block,\
    msg:'XSS Attack Detected',\
    logdata:'Matched Data: %{MATCHED_VAR}',\
    tag:'application-multi',\
    tag:'language-multi'"

SecRule REQUEST_HEADERS:User-Agent "@pmFromFile botscanners.txt" \
    "id:1003,\
    phase:1,\
    block,\
    msg:'Request from Known Bot Scanner',\
    logdata:'User-Agent: %{MATCHED_VAR}',\
    tag:'application-multi',\
    tag:'automated'"

# File Upload Restrictions
SecRule FILES "!@pmFromFile allowed-extensions.txt" \
    "id:1004,\
    phase:2,\
    block,\
    msg:'File Upload with Disallowed Extension',\
    logdata:'Filename: %{MATCHED_VAR}',\
    tag:'application-multi'"

# Size Restrictions
SecRule REQUEST_HEADERS:Content-Length "@gt 10485760" \
    "id:1005,\
    phase:1,\
    block,\
    msg:'Request Body Too Large',\
    logdata:'Content-Length: %{MATCHED_VAR}',\
    tag:'application-multi'"
EOF
    
    # Create allowed extensions file
    cat > "$CONFIG_DIR/allowed-extensions.txt" << 'EOF'
.jpg
.jpeg
.png
.gif
.pdf
.doc
.docx
.txt
.csv
EOF
    
    print_status 0 "Security configuration files created"
}

# Function to setup logging
setup_logging() {
    print_section "Setting Up Security Logging"
    
    # Create logrotate configuration
    cat > "$CONFIG_DIR/logrotate.conf" << 'EOF'
/var/log/security/*.log {
    daily
    missingok
    rotate 30
    compress
    delaycompress
    notifempty
    create 644 root root
    postrotate
        systemctl reload rsyslog
    endscript
}
EOF
    
    # Create rsyslog configuration
    cat > "$CONFIG_DIR/security-rsyslog.conf" << 'EOF'
# Security Logging Configuration
$ModLoad imfile

# Security Events
$InputFileName /var/log/security/security-events.log
$InputFileTag security-events:
$InputFileStateFile stat-security-events
$InputRunFileMonitor security-events

# Access Logs
$InputFileName /var/log/security/access.log
$InputFileTag access:
$InputFileStateFile stat-access
$InputRunFileMonitor access

# Error Logs
$InputFileName /var/log/security/error.log
$InputFileTag error:
$InputFileStateFile stat-error
$InputRunFileMonitor error

# Forward to remote syslog server
*.* @@remote-syslog-server:514
EOF
    
    print_status 0 "Security logging configured"
}

# Function to create security policies
create_security_policies() {
    print_section "Creating Security Policies"
    
    # Password policy
    cat > "$SECURITY_DIR/policies/password-policy.md" << 'EOF'
# Password Policy

## Requirements
- Minimum length: 12 characters
- Must contain uppercase letters
- Must contain lowercase letters
- Must contain numbers
- Must contain special characters
- Cannot contain common patterns
- Password history: Last 5 passwords
- Expiry: 90 days

## Implementation
- Enforced at application level
- Password strength meter
- Breach detection integration
EOF
    
    # Data retention policy
    cat > "$SECURITY_DIR/policies/data-retention.md" << 'EOF'
# Data Retention Policy

## Retention Periods
- User accounts: 7 years after last activity
- Order data: 7 years
- Payment records: 7 years
- Access logs: 1 year
- Security events: 3 years
- Consent records: 1 year

## Deletion Process
- Automated anonymization after retention period
- Manual review for legal holds
- Audit trail for deletions
EOF
    
    # Access control policy
    cat > "$SECURITY_DIR/policies/access-control.md" << 'EOF'
# Access Control Policy

## Role-Based Access Control
- Customer: Read own data only
- Vendor: Read own data + vendor functions
- Admin: Full system access
- Super Admin: All access including system configuration

## Principle of Least Privilege
- Default deny access
- Grant minimum required permissions
- Regular access reviews
- Temporary access for special tasks

## Multi-Factor Authentication
- Required for admin access
- Required for sensitive operations
- Optional for regular users
- Backup codes available
EOF
    
    print_status 0 "Security policies created"
}

# Function to setup monitoring
setup_monitoring() {
    print_section "Setting Up Security Monitoring"
    
    # Create Prometheus security rules
    cat > "$CONFIG_DIR/prometheus-security.yml" << 'EOF'
# Prometheus Security Monitoring Rules
groups:
  - name: security.rules
    rules:
      # Failed login attempts
      - alert: HighFailedLoginRate
        expr: rate(security_events_total{type="login_failure"}[5m]) > 10
        for: 2m
        labels:
          severity: warning
          service: security
        annotations:
          summary: "High rate of failed login attempts"
          description: "Failed login rate is {{ $value }} attempts per second"
      
      # Suspicious activity
      - alert: SuspiciousActivity
        expr: rate(security_events_total{type="suspicious"}[5m]) > 5
        for: 1m
        labels:
          severity: critical
          service: security
        annotations:
          summary: "Suspicious activity detected"
          description: "Suspicious activity rate is {{ $value }} events per second"
      
      # Unauthorized access
      - alert: UnauthorizedAccess
        expr: increase(security_events_total{type="unauthorized"}[5m]) > 0
        for: 0m
        labels:
          severity: warning
          service: security
        annotations:
          summary: "Unauthorized access attempt"
          description: "Unauthorized access attempt detected"
EOF
    
    # Create Grafana dashboard
    cat > "$CONFIG_DIR/grafana-security-dashboard.json" << 'EOF'
{
  "dashboard": {
    "id": null,
    "title": "Security Dashboard",
    "tags": ["security"],
    "timezone": "browser",
    "panels": [
      {
        "id": 1,
        "title": "Security Events",
        "type": "graph",
        "targets": [
          {
            "expr": "rate(security_events_total[5m])",
            "legendFormat": "{{type}}"
          }
        ],
        "gridPos": {"h": 8, "w": 12},
        "options": {
          "legend": {"displayMode": "list", "placement": "bottom"},
          "tooltip": {"mode": "multi", "sort": "desc"}
        }
      },
      {
        "id": 2,
        "title": "Failed Logins",
        "type": "stat",
        "targets": [
          {
            "expr": "security_events_total{type=\"login_failure\"}",
            "legendFormat": "Failed Logins"
          }
        ],
        "gridPos": {"h": 8, "w": 12},
        "options": {
          "colorMode": "value",
          "graphMode": "area",
          "justifyMode": "auto"
        }
      }
    ]
  }
}
EOF
    
    print_status 0 "Security monitoring configured"
}

# Function to setup backup
setup_backup() {
    print_section "Setting Up Security Backup"
    
    # Create backup script
    cat > "$SECURITY_DIR/scripts/backup-security.sh" << 'EOF'
#!/bin/bash
# Security Backup Script

BACKUP_DIR="/backup/security"
DATE=$(date +%Y%m%d_%H%M%S)
RETENTION_DAYS=30

# Create backup directory
mkdir -p "$BACKUP_DIR/$DATE"

# Backup certificates
tar -czf "$BACKUP_DIR/$DATE/certs.tar.gz" /etc/ssl/certs/

# Backup configurations
tar -czf "$BACKUP_DIR/$DATE/configs.tar.gz" /etc/security/config/

# Backup logs (last 7 days)
find /var/log/security -name "*.log" -mtime -7 -exec cp {} "$BACKUP_DIR/$DATE/" \;

# Backup database
pg_dump -h postgres-security -U security_user security_db > "$BACKUP_DIR/$DATE/database.sql"

# Cleanup old backups
find "$BACKUP_DIR" -type d -mtime +$RETENTION_DAYS -exec rm -rf {} \;

echo "Security backup completed: $BACKUP_DIR/$DATE"
EOF
    
    chmod +x "$SECURITY_DIR/scripts/backup-security.sh"
    
    # Create cron job
    (crontab -l 2>/dev/null; echo "0 2 * * * $SECURITY_DIR/scripts/backup-security.sh") | crontab -
    
    print_status 0 "Security backup configured"
}

# Function to create security scripts
create_security_scripts() {
    print_section "Creating Security Scripts"
    
    # Incident response script
    cat > "$SECURITY_DIR/scripts/incident-response.sh" << 'EOF'
#!/bin/bash
# Incident Response Script

INCIDENT_ID=$1
SEVERITY=$2
DESCRIPTION=$3

echo "🚨 Security Incident Detected"
echo "Incident ID: $INCIDENT_ID"
echo "Severity: $SEVERITY"
echo "Description: $DESCRIPTION"

# Log incident
echo "$(date): $INCIDENT_ID - $SEVERITY - $DESCRIPTION" >> /var/log/security/incidents.log

# Send alert (placeholder)
curl -X POST "https://hooks.slack.com/services/YOUR/SLACK/WEBHOOK" \
    -H 'Content-type: application/json' \
    -d "{\"text\": \"🚨 Security Incident: $INCIDENT_ID - $SEVERITY\"}"

# Create incident directory
mkdir -p "/var/log/security/incidents/$INCIDENT_ID"
echo "$DESCRIPTION" > "/var/log/security/incidents/$INCIDENT_ID/description.txt"
echo "$SEVERITY" > "/var/log/security/incidents/$INCIDENT_ID/severity.txt"
EOF
    
    chmod +x "$SECURITY_DIR/scripts/incident-response.sh"
    
    # Security audit script
    cat > "$SECURITY_DIR/scripts/security-audit.sh" << 'EOF'
#!/bin/bash
# Security Audit Script

AUDIT_DIR="/var/log/security/audits"
DATE=$(date +%Y%m%d_%H%M%S)
REPORT_FILE="$AUDIT_DIR/audit_$DATE.md"

mkdir -p "$AUDIT_DIR"

cat > "$REPORT_FILE" << EOFR
# Security Audit Report
**Date:** $(date)
**Auditor:** Security Team

## System Configuration
- SSL Certificate Status: $(openssl x509 -in /etc/ssl/certs/server.crt -noout -dates)
- Firewall Status: $(ufw status | head -1)
- Running Services: $(systemctl list-units --type=service --state=running | wc -l)

## Recent Security Events
$(tail -20 /var/log/security/security-events.log)

## Failed Login Attempts (Last 24h)
$(grep "$(date -d '1 day ago' '+%Y-%m-%d')" /var/log/security/security-events.log | grep "login_failure" | wc -l)

## Recommendations
1. Review failed login patterns
2. Update SSL certificates if expiring soon
3. Check for unauthorized access attempts
4. Review system logs for anomalies
EOFR

echo "Security audit completed: $REPORT_FILE"
EOF
    
    chmod +x "$SECURITY_DIR/scripts/security-audit.sh"
    
    print_status 0 "Security scripts created"
}

# Function to create Docker security setup
create_docker_security() {
    print_section "Creating Docker Security Configuration"
    
    # Create Docker security daemon configuration
    cat > "$CONFIG_DIR/daemon.json" << 'EOF'
{
  "live-restore": true,
  "userland-proxy": false,
  "experimental": false,
  "debug": false,
  "log-level": "info",
  "storage-driver": "overlay2",
  "storage-opts": [
    "overlay2.override_kernel_check=true"
  ],
  "default-ulimits": {
    "nofile": {
      "Name": "nofile",
      "Hard": 64000,
      "Soft": 64000
    }
  },
  "seccomp-profile": "default",
  "no-new-privileges": true,
  "cgroup-parent": "docker.slice",
  "log-driver": "json-file",
  "log-opts": {
    "max-size": "10m",
    "max-file": "3"
  }
}
EOF
    
    # Create Docker Compose security override
    cat > "$CONFIG_DIR/docker-compose.security.override.yml" << 'EOF'
version: '3.8'

services:
  security-api:
    security_opt:
      - no-new-privileges:true
    read_only: true
    tmpfs:
      - /tmp
      - /var/run
    cap_drop:
      - ALL
    cap_add:
      - CHOWN
      - SETGID
      - SETUID
    user: "1001:1001"
    environment:
      - NODE_ENV=production
      - SECURITY_HEADERS_ENABLED=true
      - RATE_LIMIT_ENABLED=true
    ulimits:
      nofile:
        soft: 64000
        hard: 64000

  postgres-security:
    security_opt:
      - no-new-privileges:true
    read_only: true
    tmpfs:
      - /tmp
      - /var/run/postgresql
    cap_drop:
      - ALL
    cap_add:
      - CHOWN
      - SETGID
      - SETUID
      - DAC_OVERRIDE
    user: "999:999"
    environment:
      - POSTGRES_INITDB_ARGS=--auth-host=scram-sha-256
    ulimits:
      nofile:
        soft: 64000
        hard: 64000

  redis-security:
    security_opt:
      - no-new-privileges:true
    read_only: true
    tmpfs:
      - /tmp
      - /var/run/redis
    cap_drop:
      - ALL
    cap_add:
      - SETGID
      - SETUID
    user: "999:999"
    ulimits:
      nofile:
        soft: 64000
        hard: 64000
EOF
    
    print_status 0 "Docker security configuration created"
}

# Function to create security documentation
create_documentation() {
    print_section "Creating Security Documentation"
    
    cat > "$SECURITY_DIR/README.md" << 'EOF'
# Security Infrastructure

This directory contains all security-related configurations and scripts for the e-commerce platform.

## Directory Structure

```
security/
├── certs/              # SSL certificates and keys
├── config/             # Security configuration files
├── logs/               # Security logs
├── reports/            # Security scan reports
├── policies/           # Security policies
├── scripts/            # Security scripts
└── backups/            # Security backups
```

## Configuration Files

- `nginx-security.conf` - Nginx security configuration
- `modsecurity.conf` - WAF rules
- `prometheus-security.yml` - Monitoring rules
- `daemon.json` - Docker security daemon config
- `docker-compose.security.override.yml` - Docker security overrides

## Scripts

- `backup-security.sh` - Automated security backup
- `incident-response.sh` - Incident response automation
- `security-audit.sh` - Security audit automation
- `security-test.sh` - Comprehensive security testing

## Policies

- `password-policy.md` - Password requirements and enforcement
- `data-retention.md` - Data retention and deletion policies
- `access-control.md` - Access control and RBAC policies

## Usage

1. Run security setup: \`./setup-security.sh\`
2. Run security tests: \`./scripts/security-test.sh\`
3. Run security audit: \`./scripts/security-audit.sh\`
4. Respond to incidents: \`./scripts/incident-response.sh <id> <severity> <description>\`

## Monitoring

Security events are monitored through:
- Prometheus metrics
- Grafana dashboards
- Log aggregation
- Real-time alerts

## Backup

Automated backups run daily at 2 AM:
- Certificates and configurations
- Security logs (last 7 days)
- Database dumps
- 30-day retention policy
EOF
    
    print_status 0 "Security documentation created"
}

# Main execution
main() {
    echo "Starting security infrastructure setup..."
    
    # Check required tools
    check_tool "openssl"
    check_tool "docker"
    check_tool "docker-compose"
    
    # Run all setup functions
    create_directories
    generate_certificates
    create_security_configs
    setup_logging
    create_security_policies
    setup_monitoring
    setup_backup
    create_security_scripts
    create_docker_security
    create_documentation
    
    echo -e "\n${GREEN}🎉 Security infrastructure setup completed successfully!${NC}"
    echo -e "${BLUE}📁 Configuration files are in: $SECURITY_DIR${NC}"
    echo -e "${YELLOW}⚠️  Next steps:${NC}"
    echo -e "${YELLOW}1. Review and customize security policies${NC}"
    echo -e "${YELLOW}2. Update environment variables with your settings${NC}"
    echo -e "${YELLOW}3. Run security tests: ./scripts/security-test.sh${NC}"
    echo -e "${YELLOW}4. Schedule regular security audits${NC}"
}

# Check if running with sudo
if [ "$EUID" -ne 0 ]; then
    echo -e "${RED}❌ This script must be run with sudo${NC}"
    exit 1
fi

# Run main function
main "$@"
