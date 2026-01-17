#!/bin/bash

# AfroSuperStore Monitoring and Logging Script
# Comprehensive monitoring for production environment

set -e

# Configuration
DREAMHOST_USER="afrosuperstore"
DREAMHOST_SERVER="vps68200.dreamhostps.com"
DOMAIN="www.afrosuperstore.ca"
EMAIL_ADMIN="admin@afrosuperstore.ca"
SLACK_WEBHOOK_URL="your_slack_webhook_url_here"
DISCORD_WEBHOOK_URL="your_discord_webhook_url_here"

# Colors
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
BLUE='\033[0;34m'
NC='\033[0m'

log() {
    echo -e "${GREEN}[$(date +'%Y-%m-%d %H:%M:%S')] $1${NC}"
}

error() {
    echo -e "${RED}[ERROR] $1${NC}"
}

warning() {
    echo -e "${YELLOW}[WARNING] $1${NC}"
}

info() {
    echo -e "${BLUE}[INFO] $1${NC}"
}

# Send notification
send_notification() {
    local message=$1
    local level=${2:-info}
    
    # Send email
    if command -v mail &> /dev/null; then
        echo "$message" | mail -s "AfroSuperStore Alert: $level" "$EMAIL_ADMIN"
    fi
    
    # Send Slack notification
    if [ -n "$SLACK_WEBHOOK_URL" ]; then
        curl -X POST -H 'Content-type: application/json' \
            --data "{\"text\":\"AfroSuperStore Alert: $level\n$message\"}" \
            "$SLACK_WEBHOOK_URL" 2>/dev/null || true
    fi
    
    # Send Discord notification
    if [ -n "$DISCORD_WEBHOOK_URL" ]; then
        curl -X POST -H 'Content-Type: application/json' \
            --data "{\"content\":\"**AfroSuperStore Alert: $level**\n$message\"}" \
            "$DISCORD_WEBHOOK_URL" 2>/dev/null || true
    fi
}

# Check service health
check_service_health() {
    local service_name=$1
    local container_name=$2
    local health_url=$3
    
    if docker exec "$container_name" echo "healthy" &>/dev/null; then
        log "$service_name is healthy ✓"
        return 0
    else
        error "$service_name is down!"
        send_notification "$service_name service is down on $DOMAIN" "critical"
        return 1
    fi
}

# Check website accessibility
check_website() {
    log "Checking website accessibility..."
    
    local response_code=$(curl -s -o /dev/null -w "%{http_code}" "https://$DOMAIN/health" || echo "000")
    
    case $response_code in
        200)
            log "Website is accessible ✓"
            return 0
            ;;
        000)
            error "Website is not responding!"
            send_notification "Website $DOMAIN is not responding" "critical"
            return 1
            ;;
        *)
            error "Website returned HTTP $response_code"
            send_notification "Website $DOMAIN returned HTTP $response_code" "warning"
            return 1
            ;;
    esac
}

# Check SSL certificate
check_ssl() {
    log "Checking SSL certificate..."
    
    local cert_expiry=$(echo | openssl s_client -connect "$DOMAIN":443 -servername "$DOMAIN" 2>/dev/null | openssl x509 -noout -dates 2>/dev/null | grep "notAfter" | cut -d= -f2)
    
    if [ -n "$cert_expiry" ]; then
        local expiry_timestamp=$(date -d "$cert_expiry" +%s)
        local current_timestamp=$(date +%s)
        local days_until_expiry=$(( (expiry_timestamp - current_timestamp) / 86400 ))
        
        if [ $days_until_expiry -lt 30 ]; then
            warning "SSL certificate expires in $days_until_expiry days!"
            send_notification "SSL certificate for $DOMAIN expires in $days_until_expiry days" "warning"
        else
            log "SSL certificate is valid for $days_until_expiry days ✓"
        fi
    else
        error "Could not retrieve SSL certificate information"
        send_notification "SSL certificate check failed for $DOMAIN" "critical"
    fi
}

# Check disk space
check_disk_space() {
    log "Checking disk space..."
    
    local disk_usage=$(ssh "$DREAMHOST_USER@$DREAMHOST_SERVER" "df / | awk 'NR==2 {print \$5}' | sed 's/%//'" 2>/dev/null)
    
    if [ -n "$disk_usage" ]; then
        local usage_num=${disk_usage%\%}
        
        if [ $usage_num -gt 80 ]; then
            error "Disk usage is critical: ${disk_usage}"
            send_notification "Disk usage is ${disk_usage} on $DOMAIN" "critical"
        elif [ $usage_num -gt 70 ]; then
            warning "Disk usage is high: ${disk_usage}"
            send_notification "Disk usage is ${disk_usage} on $DOMAIN" "warning"
        else
            log "Disk usage is normal: ${disk_usage} ✓"
        fi
    else
        error "Could not retrieve disk usage information"
    fi
}

# Check memory usage
check_memory() {
    log "Checking memory usage..."
    
    ssh "$DREAMHOST_USER@$DREAMHOST_SERVER" "
        free | grep Mem | awk '{
            total=\$2
            used=\$3
            usage=(used/total)*100
            printf \"%.1f%%\", usage
        }'
    " | while read usage; do
        local usage_num=${usage%\%}
        
        if [ $usage_num -gt 90 ]; then
            error "Memory usage is critical: ${usage}"
            send_notification "Memory usage is ${usage} on $DOMAIN" "critical"
        elif [ $usage_num -gt 80 ]; then
            warning "Memory usage is high: ${usage}"
            send_notification "Memory usage is ${usage} on $DOMAIN" "warning"
        else
            log "Memory usage is normal: ${usage} ✓"
        fi
    done
}

# Check Docker containers
check_docker_containers() {
    log "Checking Docker containers..."
    
    ssh "$DREAMHOST_USER@$DREAMHOST_SERVER" "
        docker ps --format 'table {{.Names}}\t{{.Status}}' | grep afrosuperstore
    " | while IFS=$'\t' read -r name status; do
        case $status in
            *Up*)
                log "Container $name is running ✓"
                ;;
            *Exited*)
                error "Container $name has exited!"
                send_notification "Docker container $name has exited on $DOMAIN" "critical"
                ;;
            *Restarting*)
                warning "Container $name is restarting..."
                ;;
            *)
                warning "Container $name status: $status"
                ;;
        esac
    done
}

# Check database connections
check_database() {
    log "Checking database connections..."
    
    local connection_count=$(ssh "$DREAMHOST_USER@$DREAMHOST_SERVER" "
        docker exec afrosuperstore_postgres psql -U postgres -d afrosuperstore -t -c 'SELECT count(*) FROM pg_stat_activity WHERE state = \"active\";' 2>/dev/null || echo '0'
    ")
    
    if [ -n "$connection_count" ]; then
        if [ $connection_count -gt 50 ]; then
            warning "High database connections: $connection_count"
            send_notification "Database has $connection_count active connections on $DOMAIN" "warning"
        else
            log "Database connections: $connection_count ✓"
        fi
    else
        error "Could not retrieve database connection count"
    fi
}

# Check error logs
check_error_logs() {
    log "Checking error logs..."
    
    # Check Nginx errors
    local nginx_errors=$(ssh "$DREAMHOST_USER@$DREAMHOST_SERVER" "
        docker exec afrosuperstore_nginx tail -100 /var/log/nginx/error.log 2>/dev/null | grep -c 'error\|crit\|alert' || echo '0'
    ")
    
    # Check application errors
    local app_errors=$(ssh "$DREAMHOST_USER@$DREAMHOST_SERVER" "
        docker logs afrosuperstore_frontend 2>/dev/null | tail -100 | grep -c 'ERROR\|FATAL' || echo '0'
        docker logs afrosuperstore_backend 2>/dev/null | tail -100 | grep -c 'ERROR\|FATAL' || echo '0'
        docker logs afrosuperstore_api 2>/dev/null | tail -100 | grep -c 'ERROR\|FATAL' || echo '0'
    ")
    
    local total_errors=$((nginx_errors + app_errors))
    
    if [ $total_errors -gt 10 ]; then
        error "High error rate detected: $total_errors errors in recent logs"
        send_notification "High error rate: $total_errors errors detected on $DOMAIN" "critical"
    elif [ $total_errors -gt 0 ]; then
        warning "Errors detected in recent logs: $total_errors"
    else
        log "No critical errors detected ✓"
    fi
}

# Performance check
check_performance() {
    log "Checking performance metrics..."
    
    # Check response time
    local response_time=$(curl -o /dev/null -s -w "%{time_total}" "https://$DOMAIN/health" || echo "0")
    
    if [ -n "$response_time" ] && [ "$response_time" != "0" ]; then
        local response_ms=$(echo "$response_time * 1000" | bc 2>/dev/null || echo "N/A")
        
        if [ "${response_ms%.*}" -gt 2000 ]; then
            warning "Slow response time: ${response_ms}ms"
            send_notification "Slow response time: ${response_ms}ms on $DOMAIN" "warning"
        else
            log "Response time: ${response_ms}ms ✓"
        fi
    else
        error "Could not measure response time"
    fi
}

# Generate monitoring report
generate_report() {
    log "Generating monitoring report..."
    
    local report_file="/tmp/afrosuperstore-monitoring-$(date +%Y%m%d-%H%M%S).txt"
    
    {
        echo "AfroSuperStore Monitoring Report"
        echo "Generated: $(date)"
        echo "Domain: $DOMAIN"
        echo "================================"
        echo ""
        
        echo "Service Status:"
        check_service_health "Frontend" "afrosuperstore_frontend"
        check_service_health "Backend" "afrosuperstore_backend"
        check_service_health "API" "afrosuperstore_api"
        check_service_health "Database" "afrosuperstore_postgres"
        
        echo ""
        echo "System Metrics:"
        check_disk_space
        check_memory
        check_database
        
        echo ""
        echo "External Checks:"
        check_website
        check_ssl
        check_performance
        
    } > "$report_file"
    
    log "Report generated: $report_file"
    
    # Send report via email if configured
    if command -v mail &> /dev/null; then
        mail -s "AfroSuperStore Monitoring Report" "$EMAIL_ADMIN" < "$report_file"
    fi
}

# Main monitoring function
main() {
    log "Starting comprehensive monitoring for AfroSuperStore..."
    
    case "${1:-all}" in
        "health")
            check_service_health "Frontend" "afrosuperstore_frontend"
            check_service_health "Backend" "afrosuperstore_backend"
            check_service_health "API" "afrosuperstore_api"
            check_service_health "Database" "afrosuperstore_postgres"
            ;;
        "website")
            check_website
            ;;
        "ssl")
            check_ssl
            ;;
        "disk")
            check_disk_space
            ;;
        "memory")
            check_memory
            ;;
        "database")
            check_database
            ;;
        "logs")
            check_error_logs
            ;;
        "performance")
            check_performance
            ;;
        "containers")
            check_docker_containers
            ;;
        "report")
            generate_report
            ;;
        "all")
            generate_report
            ;;
        "help"|"-h"|"--help")
            echo "Usage: $0 [health|website|ssl|disk|memory|database|logs|performance|containers|report|all]"
            echo ""
            echo "Commands:"
            echo "  health        Check all service health"
            echo "  website       Check website accessibility"
            echo "  ssl           Check SSL certificate"
            echo "  disk          Check disk space"
            echo "  memory        Check memory usage"
            echo "  database      Check database status"
            echo "  logs          Check error logs"
            echo "  performance   Check performance metrics"
            echo "  containers    Check Docker containers"
            echo "  report        Generate full monitoring report"
            echo "  all           Run all checks (default)"
            exit 0
            ;;
        *)
            error "Invalid command. Use 'help' for usage information."
            ;;
    esac
}

main "$@"
