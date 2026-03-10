#!/bin/bash
# Supabase Migration Script for AfroSuperStore

set -e

# Configuration - Update these with your Supabase details
SUPABASE_URL="https://azpgqsmgyorjbqsgxuxw.supabase.co"
SUPABASE_DB_PASSWORD=""  # Add your database password here
DB_NAME="postgres"
DB_PORT="5432"
DB_USER="postgres"

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

# Check if psql is available
check_psql_client() {
    if ! command -v psql &> /dev/null; then
        error "PostgreSQL client (psql) is not installed. Please install it with: brew install postgresql or apt-get install postgresql-client"
    fi
}

# Check if database password is set
check_config() {
    if [ -z "$SUPABASE_DB_PASSWORD" ]; then
        error "Please set SUPABASE_DB_PASSWORD in this script. Get it from your Supabase project settings."
    fi
}

# Check if database is accessible
check_database() {
    log "Checking database connection..."
    
    PGPASSWORD="$SUPABASE_DB_PASSWORD" psql -h "$SUPABASE_URL" -p "$DB_PORT" -U "$DB_USER" -d "$DB_NAME" -c "SELECT 1;" > /dev/null 2>&1 || error "Cannot connect to database. Please check configuration."
    
    log "Database connection successful ✓"
}

# Get executed migrations
get_executed_migrations() {
    PGPASSWORD="$SUPABASE_DB_PASSWORD" psql -h "$SUPABASE_URL" -p "$DB_PORT" -U "$DB_USER" -d "$DB_NAME" -t -c "SELECT filename FROM migrations ORDER BY executed_at;" 2>/dev/null || echo ''
}

# Run migration file
run_migration() {
    local migration_file=$1
    local migration_name=$(basename "$migration_file" .sql)
    
    log "Running migration: $migration_name"
    
    # Execute migration
    PGPASSWORD="$SUPABASE_DB_PASSWORD" psql -h "$SUPABASE_URL" -p "$DB_PORT" -U "$DB_USER" -d "$DB_NAME" < "$migration_file"
    
    if [ $? -eq 0 ]; then
        # Record migration as executed
        PGPASSWORD="$SUPABASE_DB_PASSWORD" psql -h "$SUPABASE_URL" -p "$DB_PORT" -U "$DB_USER" -d "$DB_NAME" -c "INSERT INTO migrations (filename) VALUES ('$migration_name');"
        log "Migration $migration_name completed ✓"
    else
        error "Migration $migration_name failed"
    fi
}

# Main migration function
main() {
    log "Starting Supabase database migration for AfroSuperStore..."
    
    check_psql_client
    check_config
    check_database
    
    # Create migrations table if it doesn't exist
    log "Creating migrations table..."
    PGPASSWORD="$SUPABASE_DB_PASSWORD" psql -h "$SUPABASE_URL" -p "$DB_PORT" -U "$DB_USER" -d "$DB_NAME" << 'EOF'
CREATE TABLE IF NOT EXISTS migrations (
    id SERIAL PRIMARY KEY,
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

# Show migration status
status() {
    log "Migration status:"
    get_executed_migrations
}

# Create backup before migration
backup() {
    log "Creating database backup..."
    
    local backup_file="backup_$(date +%Y%m%d_%H%M%S).sql"
    
    PGPASSWORD="$SUPABASE_DB_PASSWORD" pg_dump -h "$SUPABASE_URL" -p "$DB_PORT" -U "$DB_USER" -d "$DB_NAME" > "$backup_file"
    
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
    "status")
        status
        ;;
    "backup")
        backup
        ;;
    "help"|"-h"|"--help")
        echo "Usage: $0 [migrate|status|backup]"
        echo ""
        echo "Commands:"
        echo "  migrate    Run all pending migrations (default)"
        echo "  status     Show migration status"
        echo "  backup     Create database backup"
        echo ""
        echo "Examples:"
        echo "  $0 migrate              # Run all pending migrations"
        echo "  $0 status               # Show current migration status"
        echo "  $0 backup               # Create database backup"
        echo ""
        echo "Setup:"
        echo "1. Get your database password from Supabase project settings"
        echo "2. Update SUPABASE_DB_PASSWORD in this script"
        echo "3. Install PostgreSQL client: brew install postgresql"
        exit 0
        ;;
    *)
        error "Invalid command. Use 'help' for usage information."
        ;;
esac
