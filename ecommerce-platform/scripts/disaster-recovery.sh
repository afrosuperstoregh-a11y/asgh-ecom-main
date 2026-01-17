#!/bin/bash

# Disaster Recovery Script for E-commerce Platform
# Automated recovery procedures for various failure scenarios

set -e

# Configuration
BACKUP_DIR="/backups"
S3_BUCKET="your-backup-bucket"
SLACK_WEBHOOK="https://hooks.slack.com/services/YOUR/SLACK/WEBHOOK"
RECOVERY_LOG="/var/log/disaster-recovery.log"

# Database configuration
DB_HOST="postgres-master"
DB_PORT="5432"
DB_NAME="ecommerce_db"
DB_USER="ecommerce_user"
DB_PASSWORD="${DATABASE_PASSWORD}"

# Logging
exec > >(tee -a $RECOVERY_LOG)
exec 2>&1

echo "🚨 Starting disaster recovery process at $(date)"

# Function to send Slack notification
send_notification() {
    local message=$1
    local status=${2:-"warning"}
    
    curl -X POST -H 'Content-type: application/json' \
        --data "{\"text\":\"$message\", \"color\":\"$status\"}" \
        $SLACK_WEBHOOK || echo "Failed to send Slack notification"
}

# Function to check service health
check_service_health() {
    local service=$1
    local health_url=$2
    
    echo "🔍 Checking health of $service..."
    
    if curl -f -s --max-time 10 "$health_url" > /dev/null 2>&1; then
        echo "✅ $service is healthy"
        return 0
    else
        echo "❌ $service is unhealthy"
        return 1
    fi
}

# Function to restart service
restart_service() {
    local service=$1
    
    echo "🔄 Restarting $service..."
    docker-compose restart $service
    
    # Wait for service to be ready
    local max_attempts=30
    local attempt=1
    
    while [ $attempt -le $max_attempts ]; do
        if check_service_health $service "http://localhost:300${service: -1}/api/health"; then
            echo "✅ $service restarted successfully"
            return 0
        fi
        
        echo "⏳ Waiting for $service to be ready... (attempt $attempt/$max_attempts)"
        sleep 10
        ((attempt++))
    done
    
    echo "❌ Failed to restart $service"
    return 1
}

# Function to recover database
recover_database() {
    local backup_file=$1
    
    echo "🗄️ Recovering PostgreSQL database..."
    
    # Download backup from S3 if not present
    if [ ! -f "$backup_file" ]; then
        echo "📥 Downloading backup from S3..."
        aws s3 cp s3://$S3_BUCKET/database/$(basename $backup_file) $backup_file
    fi
    
    # Stop application services
    docker-compose stop api client
    
    # Drop existing database
    PGPASSWORD=$DB_PASSWORD psql \
        -h $DB_HOST \
        -p $DB_PORT \
        -U $DB_USER \
        -c "DROP DATABASE IF EXISTS $DB_NAME;"
    
    # Create new database
    PGPASSWORD=$DB_PASSWORD psql \
        -h $DB_HOST \
        -p $DB_PORT \
        -U $DB_USER \
        -c "CREATE DATABASE $DB_NAME;"
    
    # Restore database
    echo "📊 Restoring database from backup..."
    gunzip -c $backup_file | PGPASSWORD=$DB_PASSWORD psql \
        -h $DB_HOST \
        -p $DB_PORT \
        -U $DB_USER \
        -d $DB_NAME
    
    # Restart services
    docker-compose start api client
    
    echo "✅ Database recovery completed"
}

# Function to recover Redis
recover_redis() {
    local backup_file=$1
    
    echo "📦 Recovering Redis data..."
    
    # Download backup from S3 if not present
    if [ ! -f "$backup_file" ]; then
        echo "📥 Downloading Redis backup from S3..."
        aws s3 cp s3://$S3_BUCKET/database/$(basename $backup_file) $backup_file
    fi
    
    # Stop Redis
    docker-compose stop redis-master redis-replica-1 redis-replica-2
    
    # Clear existing data
    docker exec postgres-master rm -f /data/dump.rdb
    
    # Copy backup file
    gunzip -c $backup_file > /tmp/dump.rdb
    docker cp /tmp/dump.rdb redis-master:/data/dump.rdb
    
    # Start Redis
    docker-compose start redis-master redis-replica-1 redis-replica-2
    
    # Wait for Redis to be ready
    sleep 30
    
    echo "✅ Redis recovery completed"
}

# Function to recover Elasticsearch
recover_elasticsearch() {
    local snapshot_name=$1
    
    echo "🔍 Recovering Elasticsearch data..."
    
    # Close all indices
    curl -X POST "elasticsearch:9200/_all/_close"
    
    # Restore from snapshot
    curl -X POST "elasticsearch:9200/_snapshot/backup_repo/$snapshot_name/_restore" \
        -H 'Content-Type: application/json' \
        -d '{
            "indices": "*",
            "ignore_unavailable": true,
            "include_global_state": false,
            "rename_pattern": "(.+)",
            "rename_replacement": "restored_$1"
        }'
    
    # Wait for restore completion
    while true; do
        local status=$(curl -s "elasticsearch:9200/_snapshot/backup_repo/$snapshot_name/_status" | \
            jq -r '.snapshots[0].state')
        if [ "$status" = "SUCCESS" ]; then
            break
        elif [ "$status" = "FAILED" ]; then
            echo "❌ Elasticsearch restore failed!"
            return 1
        fi
        echo "⏳ Elasticsearch restore in progress..."
        sleep 30
    done
    
    echo "✅ Elasticsearch recovery completed"
}

# Function to recover application files
recover_files() {
    local backup_type=$1
    local backup_file=$2
    
    echo "📁 Recovering $backup_type files..."
    
    # Download backup from S3 if not present
    if [ ! -f "$backup_file" ]; then
        echo "📥 Downloading $backup_type backup from S3..."
        aws s3 cp s3://$S3_BUCKET/files/$backup_type/$(basename $backup_file) $backup_file
    fi
    
    # Extract files
    case $backup_type in
        "uploads")
            tar -xzf $backup_file -C /app
            ;;
        "config")
            tar -xzf $backup_file -C /
            ;;
        "logs")
            tar -xzf $backup_file -C /var/log
            ;;
    esac
    
    echo "✅ $backup_type files recovery completed"
}

# Function to perform full system recovery
full_recovery() {
    local timestamp=$1
    
    echo "🔄 Starting full system recovery from backup: $timestamp"
    
    send_notification "🚨 Starting full disaster recovery from backup: $timestamp"
    
    # Recover database
    recover_database "$BACKUP_DIR/database/postgres_backup_$timestamp.sql.gz"
    
    # Recover Redis
    recover_redis "$BACKUP_DIR/database/redis_backup_$timestamp.rdb.gz"
    
    # Recover Elasticsearch
    recover_elasticsearch "snapshot_$timestamp"
    
    # Recover application files
    recover_files "uploads" "$BACKUP_DIR/uploads/uploads_$timestamp.tar.gz"
    recover_files "config" "$BACKUP_DIR/config/config_$timestamp.tar.gz"
    
    # Restart all services
    echo "🔄 Restarting all services..."
    docker-compose restart
    
    # Wait for services to be ready
    sleep 60
    
    # Verify recovery
    if check_service_health "client" "http://localhost:3000/api/health" && \
       check_service_health "api" "http://localhost:3001/api/health"; then
        echo "✅ Full system recovery completed successfully!"
        send_notification "✅ Disaster recovery completed successfully!" "good"
    else
        echo "❌ System recovery verification failed!"
        send_notification "❌ Disaster recovery verification failed!" "danger"
        exit 1
    fi
}

# Function to perform rolling restart
rolling_restart() {
    echo "🔄 Performing rolling restart..."
    
    send_notification "🔄 Starting rolling restart of all services"
    
    # Restart database replicas first
    docker-compose restart postgres-replica-1 postgres-replica-2
    sleep 30
    
    # Restart Redis replicas
    docker-compose restart redis-replica-1 redis-replica-2
    sleep 30
    
    # Restart API services one by one
    for i in {1..3}; do
        echo "🔄 Restarting API instance $i..."
        docker-compose restart api
        sleep 30
    done
    
    # Restart client services
    docker-compose restart client
    sleep 30
    
    # Restart load balancer
    docker-compose restart nginx
    
    echo "✅ Rolling restart completed"
    send_notification "✅ Rolling restart completed successfully" "good"
}

# Function to switch to read-only mode
enable_readonly_mode() {
    echo "🔒 Enabling read-only mode..."
    
    # Update database to read-only
    PGPASSWORD=$DB_PASSWORD psql \
        -h $DB_HOST \
        -p $DB_PORT \
        -U $DB_USER \
        -d $DB_NAME \
        -c "ALTER DATABASE $DB_NAME SET default_transaction_read_only = ON;"
    
    # Update application configuration
    docker-compose exec api sh -c 'echo "READ_ONLY_MODE=true" >> .env'
    
    # Restart API services
    docker-compose restart api
    
    echo "✅ Read-only mode enabled"
    send_notification "🔒 Read-only mode enabled" "warning"
}

# Function to disable read-only mode
disable_readonly_mode() {
    echo "🔓 Disabling read-only mode..."
    
    # Update database to read-write
    PGPASSWORD=$DB_PASSWORD psql \
        -h $DB_HOST \
        -p $DB_PORT \
        -U $DB_USER \
        -d $DB_NAME \
        -c "ALTER DATABASE $DB_NAME SET default_transaction_read_only = OFF;"
    
    # Update application configuration
    docker-compose exec api sh -c 'sed -i "/READ_ONLY_MODE=true/d" .env'
    
    # Restart API services
    docker-compose restart api
    
    echo "✅ Read-only mode disabled"
    send_notification "🔓 Read-only mode disabled" "good"
}

# Function to list available backups
list_backups() {
    echo "📋 Available backups:"
    
    # Local backups
    echo "📁 Local backups:"
    ls -la $BACKUP_DIR/database/ | grep "backup_"
    
    # S3 backups
    if command -v aws &> /dev/null; then
        echo "☁️ S3 backups:"
        aws s3 ls s3://$S3_BUCKET/database/
    fi
}

# Main function
main() {
    local action=${1:-"help"}
    
    case $action in
        "full")
            full_recovery $2
            ;;
        "database")
            recover_database $2
            ;;
        "redis")
            recover_redis $2
            ;;
        "elasticsearch")
            recover_elasticsearch $2
            ;;
        "files")
            recover_files $2 $3
            ;;
        "restart")
            restart_service $2
            ;;
        "rolling")
            rolling_restart
            ;;
        "readonly-on")
            enable_readonly_mode
            ;;
        "readonly-off")
            disable_readonly_mode
            ;;
        "list")
            list_backups
            ;;
        "help"|*)
            echo "Usage: $0 {full|database|redis|elasticsearch|files|restart|rolling|readonly-on|readonly-off|list} [options]"
            echo ""
            echo "Commands:"
            echo "  full [timestamp]     - Perform full system recovery"
            echo "  database [file]      - Recover database from backup"
            echo "  redis [file]         - Recover Redis from backup"
            echo "  elasticsearch [name]  - Recover Elasticsearch from snapshot"
            echo "  files [type] [file]  - Recover application files"
            echo "  restart [service]     - Restart specific service"
            echo "  rolling              - Perform rolling restart"
            echo "  readonly-on          - Enable read-only mode"
            echo "  readonly-off         - Disable read-only mode"
            echo "  list                 - List available backups"
            exit 1
            ;;
    esac
}

# Execute main function
main "$@"
