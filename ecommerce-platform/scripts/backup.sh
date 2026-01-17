#!/bin/bash

# Backup Script for E-commerce Platform
# Comprehensive backup and disaster recovery procedures

set -e

# Configuration
BACKUP_DIR="/backups"
TIMESTAMP=$(date +%Y%m%d_%H%M%S)
RETENTION_DAYS=30
S3_BUCKET="your-backup-bucket"
SLACK_WEBHOOK="https://hooks.slack.com/services/YOUR/SLACK/WEBHOOK"

# Database configuration
DB_HOST="postgres-master"
DB_PORT="5432"
DB_NAME="ecommerce_db"
DB_USER="ecommerce_user"
DB_PASSWORD="${DATABASE_PASSWORD}"

# Create backup directory
mkdir -p $BACKUP_DIR/{database,uploads,config,logs}

echo "🔄 Starting backup process at $(date)"

# Function to send Slack notification
send_notification() {
    local message=$1
    local status=${2:-"info"}
    
    curl -X POST -H 'Content-type: application/json' \
        --data "{\"text\":\"$message\", \"color\":\"$status\"}" \
        $SLACK_WEBHOOK || echo "Failed to send Slack notification"
}

# Function to backup PostgreSQL database
backup_database() {
    echo "📊 Backing up PostgreSQL database..."
    
    local backup_file="$BACKUP_DIR/database/postgres_backup_$TIMESTAMP.sql"
    local compressed_file="$backup_file.gz"
    
    # Create database backup
    PGPASSWORD=$DB_PASSWORD pg_dump \
        -h $DB_HOST \
        -p $DB_PORT \
        -U $DB_USER \
        -d $DB_NAME \
        --no-password \
        --verbose \
        --clean \
        --if-exists \
        --format=custom \
        --file=$backup_file
    
    # Compress backup
    gzip $backup_file
    
    # Verify backup
    if [ -f "$compressed_file" ]; then
        local file_size=$(du -h $compressed_file | cut -f1)
        echo "✅ Database backup completed: $compressed_file ($file_size)"
        
        # Upload to S3
        if command -v aws &> /dev/null; then
            aws s3 cp $compressed_file s3://$S3_BUCKET/database/ \
                --storage-class STANDARD_IA
            echo "☁️ Database backup uploaded to S3"
        fi
    else
        echo "❌ Database backup failed!"
        send_notification "❌ Database backup failed!" "danger"
        exit 1
    fi
}

# Function to backup Redis data
backup_redis() {
    echo "📦 Backing up Redis data..."
    
    local backup_file="$BACKUP_DIR/database/redis_backup_$TIMESTAMP.rdb"
    
    # Trigger Redis save
    redis-cli -h redis-master -a $REDIS_PASSWORD BGSAVE
    
    # Wait for save to complete
    while [ $(redis-cli -h redis-master -a $REDIS_PASSWORD LASTSAVE) -eq $(redis-cli -h redis-master -a $REDIS_PASSWORD LASTSAVE) ]; do
        echo "⏳ Waiting for Redis save to complete..."
        sleep 5
    done
    
    # Copy Redis data file
    docker cp redis-master:/data/dump.rdb $backup_file
    
    # Compress backup
    gzip $backup_file
    
    if [ -f "$backup_file.gz" ]; then
        local file_size=$(du -h $backup_file.gz | cut -f1)
        echo "✅ Redis backup completed: $backup_file.gz ($file_size)"
        
        # Upload to S3
        if command -v aws &> /dev/null; then
            aws s3 cp $backup_file.gz s3://$S3_BUCKET/database/ \
                --storage-class STANDARD_IA
            echo "☁️ Redis backup uploaded to S3"
        fi
    else
        echo "❌ Redis backup failed!"
        send_notification "❌ Redis backup failed!" "danger"
    fi
}

# Function to backup Elasticsearch data
backup_elasticsearch() {
    echo "🔍 Backing up Elasticsearch data..."
    
    local backup_file="$BACKUP_DIR/database/elasticsearch_backup_$TIMESTAMP.json"
    
    # Create snapshot repository
    curl -X PUT "elasticsearch:9200/_snapshot/backup_repo" \
        -H 'Content-Type: application/json' \
        -d '{
            "type": "fs",
            "settings": {
                "location": "/usr/share/elasticsearch/backup"
            }
        }'
    
    # Create snapshot
    local snapshot_name="snapshot_$TIMESTAMP"
    curl -X PUT "elasticsearch:9200/_snapshot/backup_repo/$snapshot_name" \
        -H 'Content-Type: application/json' \
        -d '{
            "indices": "*",
            "ignore_unavailable": true,
            "include_global_state": false
        }'
    
    # Wait for snapshot completion
    while true; do
        local status=$(curl -s "elasticsearch:9200/_snapshot/backup_repo/$snapshot_name" | \
            jq -r '.snapshots[0].state')
        if [ "$status" = "SUCCESS" ]; then
            break
        elif [ "$status" = "FAILED" ]; then
            echo "❌ Elasticsearch snapshot failed!"
            send_notification "❌ Elasticsearch snapshot failed!" "danger"
            return 1
        fi
        echo "⏳ Elasticsearch snapshot in progress..."
        sleep 30
    done
    
    echo "✅ Elasticsearch backup completed: $snapshot_name"
}

# Function to backup application files
backup_files() {
    echo "📁 Backing up application files..."
    
    # Backup uploads
    local uploads_backup="$BACKUP_DIR/uploads/uploads_$TIMESTAMP.tar.gz"
    tar -czf $uploads_backup -C /app uploads
    
    # Backup configuration files
    local config_backup="$BACKUP_DIR/config/config_$TIMESTAMP.tar.gz"
    tar -czf $config_backup \
        /app/nginx/nginx.conf \
        /app/docker-compose.production.yml \
        /app/.env.production
    
    # Backup logs
    local logs_backup="$BACKUP_DIR/logs/logs_$TIMESTAMP.tar.gz"
    tar -czf $logs_backup -C /var/log nginx
    
    # Upload to S3
    if command -v aws &> /dev/null; then
        aws s3 cp $uploads_backup s3://$S3_BUCKET/files/uploads/
        aws s3 cp $config_backup s3://$S3_BUCKET/files/config/
        aws s3 cp $logs_backup s3://$S3_BUCKET/files/logs/
        echo "☁️ Application files uploaded to S3"
    fi
    
    echo "✅ Application files backup completed"
}

# Function to cleanup old backups
cleanup_old_backups() {
    echo "🧹 Cleaning up old backups..."
    
    # Clean local backups
    find $BACKUP_DIR -name "*.gz" -mtime +$RETENTION_DAYS -delete
    find $BACKUP_DIR -name "*.sql" -mtime +$RETENTION_DAYS -delete
    
    # Clean S3 backups
    if command -v aws &> /dev/null; then
        aws s3 ls s3://$S3_BUCKET/database/ | \
            while read -r line; do
                local file_date=$(echo $line | awk '{print $1}')
                local file_name=$(echo $line | awk '{print $4}')
                
                if [[ $(date -d "$file_date" +%s) -lt $(date -d "$RETENTION_DAYS days ago" +%s) ]]; then
                    aws s3 rm s3://$S3_BUCKET/database/$file_name
                    echo "🗑️ Deleted old S3 backup: $file_name"
                fi
            done
    fi
    
    echo "✅ Cleanup completed"
}

# Function to verify backup integrity
verify_backups() {
    echo "🔍 Verifying backup integrity..."
    
    local verification_failed=false
    
    # Verify database backup
    local latest_db_backup=$(ls -t $BACKUP_DIR/database/postgres_backup_*.gz 2>/dev/null | head -1)
    if [ -n "$latest_db_backup" ]; then
        if gzip -t $latest_db_backup; then
            echo "✅ Database backup integrity verified"
        else
            echo "❌ Database backup integrity check failed!"
            verification_failed=true
        fi
    fi
    
    # Verify Redis backup
    local latest_redis_backup=$(ls -t $BACKUP_DIR/database/redis_backup_*.gz 2>/dev/null | head -1)
    if [ -n "$latest_redis_backup" ]; then
        if gzip -t $latest_redis_backup; then
            echo "✅ Redis backup integrity verified"
        else
            echo "❌ Redis backup integrity check failed!"
            verification_failed=true
        fi
    fi
    
    if [ "$verification_failed" = true ]; then
        send_notification "❌ Backup integrity verification failed!" "danger"
        exit 1
    fi
}

# Function to create backup manifest
create_manifest() {
    echo "📋 Creating backup manifest..."
    
    local manifest_file="$BACKUP_DIR/backup_manifest_$TIMESTAMP.json"
    
    cat > $manifest_file << EOF
{
    "timestamp": "$TIMESTAMP",
    "backup_date": "$(date -Iseconds)",
    "backups": {
        "database": {
            "postgresql": "postgres_backup_$TIMESTAMP.sql.gz",
            "redis": "redis_backup_$TIMESTAMP.rdb.gz",
            "elasticsearch": "snapshot_$TIMESTAMP"
        },
        "files": {
            "uploads": "uploads_$TIMESTAMP.tar.gz",
            "config": "config_$TIMESTAMP.tar.gz",
            "logs": "logs_$TIMESTAMP.tar.gz"
        }
    },
    "system_info": {
        "hostname": "$(hostname)",
        "kernel": "$(uname -r)",
        "docker_version": "$(docker --version)",
        "disk_usage": "$(df -h /)"
    }
}
EOF
    
    echo "✅ Backup manifest created: $manifest_file"
}

# Main backup process
main() {
    echo "🚀 Starting comprehensive backup..."
    
    # Send start notification
    send_notification "🚀 Starting backup process for e-commerce platform"
    
    # Execute backups
    backup_database
    backup_redis
    backup_elasticsearch
    backup_files
    
    # Verify and cleanup
    verify_backups
    cleanup_old_backups
    create_manifest
    
    # Calculate total backup size
    local total_size=$(du -sh $BACKUP_DIR | cut -f1)
    
    echo "✅ Backup process completed successfully!"
    echo "📊 Total backup size: $total_size"
    echo "📅 Backup timestamp: $TIMESTAMP"
    
    # Send success notification
    send_notification "✅ Backup completed successfully! Total size: $total_size" "good"
}

# Execute main function
main "$@"
