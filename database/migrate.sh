#!/bin/bash

# Database Migration Script for AfroSuperStore
# Runs all pending migrations in order

set -e

# Configuration
DREAMHOST_USER="afrosuperstore"
DREAMHOST_SERVER="vps68200.dreamhostps.com"
POSTGRES_USER="postgres"
POSTGRES_DB="afrosuperstore"

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

# Check if database is accessible
check_database() {
    log "Checking database connection..."
    
    ssh "$DREAMHOST_USER@$DREAMHOST_SERVER" "
        docker exec afrosuperstore_postgres psql -U $POSTGRES_USER -d $POSTGRES_DB -c 'SELECT 1;' > /dev/null 2>&1
    " || error "Cannot connect to database. Please check configuration."
    
    log "Database connection successful ✓"
}

# Get executed migrations
get_executed_migrations() {
    ssh "$DREAMHOST_USER@$DREAMHOST_SERVER" "
        docker exec afrosuperstore_postgres psql -U $POSTGRES_USER -d $POSTGRES_DB -t -c 'SELECT version FROM migrations ORDER BY executed_at;' 2>/dev/null || echo ''
    "
}

# Run migration file
run_migration() {
    local migration_file=$1
    local migration_name=$(basename "$migration_file" .sql)
    
    log "Running migration: $migration_name"
    
    # Copy migration file to server
    scp "$migration_file" "$DREAMHOST_USER@$DREAMHOST_SERVER:/tmp/$migration_name"
    
    # Execute migration
    ssh "$DREAMHOST_USER@$DREAMHOST_SERVER" "
        docker exec afrosuperstore_postgres psql -U $POSTGRES_USER -d $POSTGRES_DB -f /tmp/$migration_name
        rm /tmp/$migration_name
    "
    
    log "Migration $migration_name completed ✓"
}

# Main migration function
main() {
    log "Starting database migration for AfroSuperStore..."
    
    check_database
    
    # Get list of executed migrations
    executed_migrations=$(get_executed_migrations)
    
    # Find and run pending migrations
    for migration_file in database/migrations/*.sql; do
        if [ -f "$migration_file" ]; then
            migration_name=$(basename "$migration_file" .sql)
            
            # Check if migration already executed
            if echo "$executed_migrations" | grep -q "$migration_name"; then
                log "Migration $migration_name already executed, skipping..."
            else
                run_migration "$migration_file"
            fi
        fi
    done
    
    # Show final status
    log "Migration completed successfully!"
    log "Current database version:"
    get_executed_migrations
}

# Migration rollback function
rollback() {
    local target_version=$1
    
    if [ -z "$target_version" ]; then
        error "Please specify a version to rollback to"
    fi
    
    log "Rolling back to migration: $target_version"
    
    warning "Rollback is dangerous and may cause data loss!"
    read -p "Are you sure you want to continue? (yes/no): " confirm
    
    if [ "$confirm" != "yes" ]; then
        log "Rollback cancelled"
        exit 0
    fi
    
    # This is a simplified rollback - in production, you'd want proper rollback scripts
    error "Rollback functionality not implemented. Please restore from backup instead."
}

# Show migration status
status() {
    log "Migration status:"
    get_executed_migrations
}

# Create backup before migration
backup() {
    log "Creating database backup..."
    
    local backup_file="backup_$(date +%Y%m%d_%H%M%S).sql"
    
    ssh "$DREAMHOST_USER@$DREAMHOST_SERVER" "
        docker exec afrosuperstore_postgres pg_dump -U $POSTGRES_USER -d $POSTGRES_DB > /tmp/$backup_file
        mv /tmp/$backup_file /home/$DREAMHOST_USER/afrosuperstore/backups/
    "
    
    log "Backup created: $backup_file ✓"
}

# Handle script arguments
case "${1:-migrate}" in
    "migrate")
        backup
        main
        ;;
    "rollback")
        rollback "$2"
        ;;
    "status")
        status
        ;;
    "backup")
        backup
        ;;
    "help"|"-h"|"--help")
        echo "Usage: $0 [migrate|rollback|status|backup] [version]"
        echo ""
        echo "Commands:"
        echo "  migrate    Run all pending migrations (default)"
        echo "  rollback   Rollback to specific version"
        echo "  status     Show migration status"
        echo "  backup     Create database backup"
        echo ""
        echo "Examples:"
        echo "  $0 migrate              # Run all pending migrations"
        echo "  $0 rollback 001         # Rollback to version 001"
        echo "  $0 status               # Show current migration status"
        echo "  $0 backup               # Create database backup"
        exit 0
        ;;
    *)
        error "Invalid command. Use 'help' for usage information."
        ;;
esac
