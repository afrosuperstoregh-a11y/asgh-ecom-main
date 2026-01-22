#!/bin/bash
# MySQL Migration Script for AfroSuperStore
# Traditional DreamHost VPS Deployment

set -e

# Configuration
DB_HOST="localhost"
DB_PORT="3306"
DB_NAME="afrosuperstore_prod"
DB_USER="afrosuperstore_db"
DB_PASS="SecureMySQLPassword2024!"

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

# Check if MySQL client is available
check_mysql_client() {
    if ! command -v mysql &> /dev/null; then
        error "MySQL client is not installed. Please install it with: sudo apt install mysql-client"
    fi
}

# Check if database is accessible
check_database() {
    log "Checking database connection..."
    
    mysql -h "$DB_HOST" -P "$DB_PORT" -u "$DB_USER" -p"$DB_PASS" -e "SELECT 1;" "$DB_NAME" > /dev/null 2>&1 || error "Cannot connect to database. Please check configuration."
    
    log "Database connection successful ✓"
}

# Get executed migrations
get_executed_migrations() {
    mysql -h "$DB_HOST" -P "$DB_PORT" -u "$DB_USER" -p"$DB_PASS" "$DB_NAME" -sN -e "SELECT filename FROM migrations ORDER BY executed_at;" 2>/dev/null || echo ''
}

# Run migration file
run_migration() {
    local migration_file=$1
    local migration_name=$(basename "$migration_file" .sql)
    
    log "Running migration: $migration_name"
    
    # Execute migration
    mysql -h "$DB_HOST" -P "$DB_PORT" -u "$DB_USER" -p"$DB_PASS" "$DB_NAME" < "$migration_file"
    
    if [ $? -eq 0 ]; then
        # Record migration as executed
        mysql -h "$DB_HOST" -P "$DB_PORT" -u "$DB_USER" -p"$DB_PASS" "$DB_NAME" -e "INSERT INTO migrations (filename) VALUES ('$migration_name');"
        log "Migration $migration_name completed ✓"
    else
        error "Migration $migration_name failed"
    fi
}

# Main migration function
main() {
    log "Starting database migration for AfroSuperStore..."
    
    check_mysql_client
    check_database
    
    # Create migrations table if it doesn't exist
    log "Creating migrations table..."
    mysql -h "$DB_HOST" -P "$DB_PORT" -u "$DB_USER" -p"$DB_PASS" "$DB_NAME" << 'EOF'
CREATE TABLE IF NOT EXISTS migrations (
    id INT AUTO_INCREMENT PRIMARY KEY,
    filename VARCHAR(255) NOT NULL UNIQUE,
    executed_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
EOF
    
    # Get list of executed migrations
    executed_migrations=$(get_executed_migrations)
    
    # Find and run pending migrations
    for migration_file in migrations/*.sql; do
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
    
    mysqldump -h "$DB_HOST" -P "$DB_PORT" -u "$DB_USER" -p"$DB_PASS" "$DB_NAME" > "$backup_file"
    
    if [ $? -eq 0 ]; then
        log "Backup created: $backup_file ✓"
    else
        error "Backup creation failed"
    fi
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
