#!/bin/bash

# Performance & Scalability Setup Script
# This script sets up the performance and scalability infrastructure for the e-commerce platform

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Configuration
PROJECT_NAME="ecommerce-platform"
PERFORMANCE_COMPOSE_FILE="docker-compose.performance.yml"
ENV_FILE=".env.performance"

# Logging
log() {
    echo -e "${BLUE}[$(date +'%Y-%m-%d %H:%M:%S')] $1${NC}"
}

log_success() {
    echo -e "${GREEN}[SUCCESS] $1${NC}"
}

log_warning() {
    echo -e "${YELLOW}[WARNING] $1${NC}"
}

log_error() {
    echo -e "${RED}[ERROR] $1${NC}"
}

# Check if Docker is running
check_docker() {
    if ! docker info > /dev/null 2>&1; then
        log_error "Docker is not running. Please start Docker and try again."
        exit 1
    fi
    log_success "Docker is running"
}

# Check if Docker Compose is available
check_docker_compose() {
    if ! command -v docker-compose > /dev/null 2>&1; then
        log_error "Docker Compose is not installed. Please install Docker Compose and try again."
        exit 1
    fi
    log_success "Docker Compose is available"
}

# Create necessary directories
create_directories() {
    log "Creating necessary directories..."
    
    directories=(
        "postgres"
        "pgbouncer"
        "nginx"
        "monitoring/grafana/dashboards"
        "monitoring/grafana/datasources"
        "monitoring/rules"
        "logs/nginx"
        "logs/api"
        "logs/jobs"
        "uploads"
    )
    
    for dir in "${directories[@]}"; do
        if [ ! -d "$dir" ]; then
            mkdir -p "$dir"
            log_success "Created directory: $dir"
        else
            log_warning "Directory already exists: $dir"
        fi
    done
}

# Generate PostgreSQL configuration files
generate_postgres_config() {
    log "Generating PostgreSQL configuration files..."
    
    # Master configuration
    cat > postgres/master.conf << EOF
# PostgreSQL Master Configuration
listen_addresses = '*'
port = 5432
max_connections = 200
shared_buffers = 256MB
effective_cache_size = 1GB
maintenance_work_mem = 64MB
checkpoint_completion_target = 0.9
wal_buffers = 16MB
default_statistics_target = 100
random_page_cost = 1.1
effective_io_concurrency = 200

# Replication settings
wal_level = replica
max_wal_senders = 3
max_replication_slots = 3
synchronous_commit = on
archive_mode = on
archive_command = 'cp %p /var/lib/postgresql/archive/%f'
wal_keep_segments = 32

# Logging
log_destination = 'stderr'
logging_collector = on
log_directory = 'log'
log_filename = 'postgresql-%Y-%m-%d_%H%M%S.log'
log_statement = 'all'
log_min_duration_statement = 1000
log_checkpoints = on
log_connections = on
log_disconnections = on
log_lock_waits = on

# Performance
shared_preload_libraries = 'pg_stat_statements'
track_activity_query_size = 2048
pg_stat_statements.track = all
EOF

    # Replica configuration
    cat > postgres/replica.conf << EOF
# PostgreSQL Replica Configuration
listen_addresses = '*'
port = 5432
max_connections = 200
shared_buffers = 256MB
effective_cache_size = 1GB
maintenance_work_mem = 64MB
checkpoint_completion_target = 0.9
wal_buffers = 16MB
default_statistics_target = 100
random_page_cost = 1.1
effective_io_concurrency = 200

# Replica settings
hot_standby = on
max_standby_streaming_delay = 30s
max_standby_archive_delay = 30s

# Logging
log_destination = 'stderr'
logging_collector = on
log_directory = 'log'
log_filename = 'postgresql-%Y-%m-%d_%H%M%S.log'
log_statement = 'all'
log_min_duration_statement = 1000
log_checkpoints = on
log_connections = on
log_disconnections = on
log_lock_waits = on

# Performance
shared_preload_libraries = 'pg_stat_statements'
track_activity_query_size = 2048
pg_stat_statements.track = all
EOF

    # pg_hba.conf
    cat > postgres/pg_hba.conf << EOF
# PostgreSQL Client Authentication Configuration File
# TYPE  DATABASE        USER            ADDRESS                 METHOD

# "local" is for Unix domain socket connections only
local   all             all                                     trust

# IPv4 local connections:
host    all             all             127.0.0.1/32            md5
host    all             all             0.0.0.0/0               md5

# IPv6 local connections:
host    all             all             ::1/128                 md5

# Replication connections
host    replication     replicator      0.0.0.0/0               md5
EOF

    log_success "PostgreSQL configuration files generated"
}

# Generate PgBouncer configuration
generate_pgbouncer_config() {
    log "Generating PgBouncer configuration..."
    
    cat > pgbouncer/pgbouncer.ini << EOF
[databases]
ecommerce = host=postgres-master port=5432 user=postgres password=postgres123

[pgbouncer]
listen_port = 6432
listen_addr = 0.0.0.0
auth_type = md5
auth_file = /etc/pgbouncer/users.txt

# Pool settings
pool_mode = transaction
max_client_conn = 1000
default_pool_size = 20
min_pool_size = 5
reserve_pool_size = 5
reserve_pool_timeout = 5
max_db_connections = 50
max_user_connections = 50

# Timeouts
server_reset_query = DISCARD ALL
server_check_delay = 30
server_check_query = select 1
server_lifetime = 3600
server_idle_timeout = 600

# Logging
log_connections = 1
log_disconnections = 1
log_pooler_errors = 1
stats_period = 60
admin_users = postgres
stats_users = postgres

# Performance
tcp_keepalive = 1
tcp_keepidle = 600
tcp_keepintvl = 30
EOF

    cat > pgbouncer/users.txt << EOF
"postgres" "postgres123"
EOF

    log_success "PgBouncer configuration files generated"
}

# Generate SSL certificates for development
generate_ssl_certs() {
    log "Generating SSL certificates for development..."
    
    if [ ! -d "nginx/ssl" ]; then
        mkdir -p nginx/ssl
    fi
    
    # Generate private key
    openssl genrsa -out nginx/ssl/key.pem 2048
    
    # Generate certificate signing request
    openssl req -new -key nginx/ssl/key.pem -out nginx/ssl/cert.csr -subj "/C=US/ST=State/L=City/O=Organization/CN=localhost"
    
    # Generate self-signed certificate
    openssl x509 -req -days 365 -in nginx/ssl/cert.csr -signkey nginx/ssl/key.pem -out nginx/ssl/cert.pem
    
    # Remove CSR
    rm nginx/ssl/cert.csr
    
    log_success "SSL certificates generated for development"
}

# Setup environment file
setup_environment() {
    log "Setting up environment file..."
    
    if [ ! -f "$ENV_FILE" ]; then
        cp .env.performance.example "$ENV_FILE"
        log_success "Environment file created from example"
        log_warning "Please update $ENV_FILE with your actual configuration values"
    else
        log_warning "Environment file already exists"
    fi
}

# Build and start services
start_services() {
    log "Building and starting performance services..."
    
    # Start core services first
    log "Starting core services (database, redis, pgbouncer)..."
    docker-compose -f "$PERFORMANCE_COMPOSE_FILE" up -d postgres-master postgres-replica-1 postgres-replica-2 pgbouncer redis-master redis-slave-1 redis-slave-2 redis-queue
    
    # Wait for services to be ready
    log "Waiting for core services to be ready..."
    sleep 30
    
    # Start application services
    log "Starting application services..."
    docker-compose -f "$PERFORMANCE_COMPOSE_FILE" up -d api-1 api-2 job-processor client
    
    # Wait for application services
    sleep 20
    
    # Start load balancer
    log "Starting load balancer..."
    docker-compose -f "$PERFORMANCE_COMPOSE_FILE" up -d nginx-lb
    
    log_success "All services started successfully"
}

# Setup monitoring
setup_monitoring() {
    log "Setting up monitoring services..."
    
    # Start monitoring services
    docker-compose -f "$PERFORMANCE_COMPOSE_FILE" --profile monitoring up -d prometheus grafana
    
    log_success "Monitoring services started"
    log "Prometheus: http://localhost:9090"
    log "Grafana: http://localhost:3001 (admin/admin123)"
}

# Setup development tools
setup_dev_tools() {
    log "Setting up development tools..."
    
    # Start development tools
    docker-compose -f "$PERFORMANCE_COMPOSE_FILE" --profile development up -d redis-commander adminer
    
    log_success "Development tools started"
    log "Redis Commander: http://localhost:8081"
    log "Adminer: http://localhost:8080"
}

# Run health checks
run_health_checks() {
    log "Running health checks..."
    
    services=("postgres-master" "redis-master" "api-1" "api-2" "client" "nginx-lb")
    
    for service in "${services[@]}"; do
        if docker-compose -f "$PERFORMANCE_COMPOSE_FILE" ps "$service" | grep -q "Up"; then
            log_success "$service is running"
        else
            log_error "$service is not running"
        fi
    done
}

# Setup Redis cluster
setup_redis_cluster() {
    log "Setting up Redis cluster..."
    
    # Wait for Redis nodes to be ready
    sleep 10
    
    # Create Redis cluster
    docker-compose -f "$PERFORMANCE_COMPOSE_FILE" exec redis-master redis-cli --cluster create \
        redis-master:6379 redis-slave-1:6379 redis-slave-2:6379 \
        --cluster-replicas 1 \
        --cluster-yes \
        -a "${REDIS_PASSWORD:-redis123}" || log_warning "Redis cluster setup may need manual configuration"
    
    log_success "Redis cluster setup completed"
}

# Performance optimization
optimize_performance() {
    log "Applying performance optimizations..."
    
    # Set sysctl parameters for better performance
    if [ "$EUID" -eq 0 ]; then
        log "Applying system-level performance optimizations..."
        
        # Network optimization
        sysctl -w net.core.rmem_max=134217728
        sysctl -w net.core.wmem_max=134217728
        sysctl -w net.ipv4.tcp_rmem="4096 65536 134217728"
        sysctl -w net.ipv4.tcp_wmem="4096 65536 134217728"
        
        # File system optimization
        sysctl -w vm.swappiness=10
        sysctl -w vm.dirty_ratio=15
        sysctl -w vm.dirty_background_ratio=5
        
        log_success "System-level optimizations applied"
    else
        log_warning "System-level optimizations require root privileges"
    fi
}

# Display service URLs
display_urls() {
    log "Service URLs:"
    echo ""
    echo "Application:"
    echo "  - Main App: https://localhost"
    echo "  - API: https://localhost/api"
    echo ""
    echo "Monitoring:"
    echo "  - Prometheus: http://localhost:9090"
    echo "  - Grafana: http://localhost:3001"
    echo "  - Nginx Status: http://localhost:8080/nginx_status"
    echo ""
    echo "Development Tools:"
    echo "  - Redis Commander: http://localhost:8081"
    echo "  - Adminer: http://localhost:8080"
    echo ""
    echo "Database:"
    echo "  - PostgreSQL Master: localhost:5432"
    echo "  - PostgreSQL Replica 1: localhost:5433"
    echo "  - PostgreSQL Replica 2: localhost:5434"
    echo "  - PgBouncer: localhost:6432"
    echo "  - Redis Master: localhost:6379"
    echo "  - Redis Queue: localhost:6382"
}

# Main execution
main() {
    log "Starting Performance & Scalability Setup for $PROJECT_NAME"
    echo ""
    
    # Pre-flight checks
    check_docker
    check_docker_compose
    
    # Setup
    create_directories
    generate_postgres_config
    generate_pgbouncer_config
    generate_ssl_certs
    setup_environment
    
    # Start services
    start_services
    setup_redis_cluster
    setup_monitoring
    setup_dev_tools
    
    # Optimization
    optimize_performance
    
    # Health checks
    run_health_checks
    
    # Display information
    display_urls
    
    echo ""
    log_success "Performance & Scalability setup completed successfully!"
    log_warning "Please update $ENV_FILE with your actual configuration values"
    log_warning "For production deployment, replace self-signed SSL certificates with proper certificates"
    echo ""
}

# Script options
case "${1:-}" in
    "start")
        start_services
        ;;
    "stop")
        log "Stopping all services..."
        docker-compose -f "$PERFORMANCE_COMPOSE_FILE" down
        log_success "All services stopped"
        ;;
    "restart")
        log "Restarting all services..."
        docker-compose -f "$PERFORMANCE_COMPOSE_FILE" restart
        log_success "All services restarted"
        ;;
    "logs")
        docker-compose -f "$PERFORMANCE_COMPOSE_FILE" logs -f "${2:-}"
        ;;
    "status")
        docker-compose -f "$PERFORMANCE_COMPOSE_FILE" ps
        ;;
    "monitoring")
        setup_monitoring
        ;;
    "dev-tools")
        setup_dev_tools
        ;;
    "health")
        run_health_checks
        ;;
    "urls")
        display_urls
        ;;
    *)
        main
        ;;
esac
