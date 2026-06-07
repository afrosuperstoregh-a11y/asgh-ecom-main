#!/bin/bash

# Database Remediation Migration Script
# AfroSuperStore E-Commerce Platform
# Date: June 2, 2026
#
# This script executes the complete database remediation migration sequence
# Usage: ./run-migration.sh [environment]
# Example: ./run-migration.sh staging

set -e  # Exit on error

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Configuration
ENVIRONMENT=${1:-staging}
MIGRATION_DIR="./migrations"
LOG_FILE="migration_$(date +%Y%m%d_%H%M%S).log"
BACKUP_DIR="./backups"

# Function to print colored output
print_success() {
    echo -e "${GREEN}✅ $1${NC}"
}

print_error() {
    echo -e "${RED}❌ $1${NC}"
}

print_warning() {
    echo -e "${YELLOW}⚠️  $1${NC}"
}

print_info() {
    echo -e "${BLUE}ℹ️  $1${NC}"
}

# Function to log output
log_output() {
    echo "[$(date '+%Y-%m-%d %H:%M:%S')] $1" | tee -a "$LOG_FILE"
}

# Function to check prerequisites
check_prerequisites() {
    print_info "Checking prerequisites..."
    
    # Check if psql is installed
    if ! command -v psql &> /dev/null; then
        print_error "psql is not installed"
        exit 1
    fi
    print_success "psql is installed"
    
    # Check if migration directory exists
    if [ ! -d "$MIGRATION_DIR" ]; then
        print_error "Migration directory not found: $MIGRATION_DIR"
        exit 1
    fi
    print_success "Migration directory found"
    
    # Check environment variables
    if [ -z "$DATABASE_URL" ]; then
        print_error "DATABASE_URL environment variable not set"
        exit 1
    fi
    print_success "DATABASE_URL is set"
    
    if [ -z "$ADMIN_EMAIL" ]; then
        print_error "ADMIN_EMAIL environment variable not set"
        exit 1
    fi
    print_success "ADMIN_EMAIL is set"
    
    if [ -z "$ADMIN_PASSWORD" ]; then
        print_error "ADMIN_PASSWORD environment variable not set"
        exit 1
    fi
    print_success "ADMIN_PASSWORD is set"
    
    # Test database connection
    print_info "Testing database connection..."
    if psql "$DATABASE_URL" -c "SELECT 1;" &> /dev/null; then
        print_success "Database connection successful"
    else
        print_error "Database connection failed"
        exit 1
    fi
}

# Function to create backup
create_backup() {
    print_info "Creating database backup..."
    
    mkdir -p "$BACKUP_DIR"
    BACKUP_FILE="$BACKUP_DIR/backup_${ENVIRONMENT}_$(date +%Y%m%d_%H%M%S).sql"
    
    log_output "Starting backup to $BACKUP_FILE"
    
    if pg_dump "$DATABASE_URL" > "$BACKUP_FILE"; then
        BACKUP_SIZE=$(du -h "$BACKUP_FILE" | cut -f1)
        print_success "Backup created: $BACKUP_FILE ($BACKUP_SIZE)"
        log_output "Backup completed: $BACKUP_FILE ($BACKUP_SIZE)"
    else
        print_error "Backup failed"
        exit 1
    fi
}

# Function to run migration
run_migration() {
    local migration_file=$1
    local step_name=$2
    local step_number=$3
    
    print_info "Step $step_number: $step_name"
    log_output "Starting Step $step_number: $step_name ($migration_file)"
    
    START_TIME=$(date +%s)
    
    if psql "$DATABASE_URL" -f "$MIGRATION_DIR/$migration_file" 2>&1 | tee -a "$LOG_FILE"; then
        END_TIME=$(date +%s)
        DURATION=$((END_TIME - START_TIME))
        print_success "Step $step_number completed in ${DURATION}s"
        log_output "Step $step_number completed in ${DURATION}s"
    else
        print_error "Step $step_number failed"
        log_output "Step $step_number failed"
        exit 1
    fi
}

# Function to validate migration
validate_migration() {
    print_info "Running validation..."
    log_output "Running validation"
    
    if psql "$DATABASE_URL" -c "SELECT * FROM validate_all();" 2>&1 | tee -a "$LOG_FILE"; then
        print_success "Validation passed"
        log_output "Validation passed"
    else
        print_error "Validation failed"
        log_output "Validation failed"
        exit 1
    fi
}

# Main execution
main() {
    echo "========================================"
    echo "Database Remediation Migration"
    echo "Environment: $ENVIRONMENT"
    echo "Started: $(date)"
    echo "========================================"
    log_output "Migration started for environment: $ENVIRONMENT"
    
    # Check prerequisites
    check_prerequisites
    
    # Create backup
    create_backup
    
    # Confirm before proceeding
    if [ "$ENVIRONMENT" = "production" ]; then
        print_warning "You are about to run migration on PRODUCTION"
        read -p "Are you sure you want to continue? (yes/no): " confirm
        if [ "$confirm" != "yes" ]; then
            print_info "Migration cancelled by user"
            exit 0
        fi
    fi
    
    # Execute migrations
    print_info "Starting migration sequence..."
    log_output "Starting migration sequence"
    
    run_migration "001_fix_rls_uuid_vulnerability.sql" "RLS Security Fix" "1"
    run_migration "002_create_canonical_schema.sql" "Canonical Schema" "2"
    run_migration "003_apply_canonical_rls_policies.sql" "RLS Policies" "3"
    run_migration "004_migrate_existing_data.sql" "Data Migration" "4"
    run_migration "005_remove_obsolete_tables.sql" "Cleanup" "5"
    run_migration "006_create_admin_user.sql" "Admin User" "6"
    run_migration "007_validate_schema_integrity.sql" "Final Validation" "7"
    
    # Validate final state
    validate_migration
    
    # Summary
    echo "========================================"
    echo "Migration Completed Successfully"
    echo "Environment: $ENVIRONMENT"
    echo "Completed: $(date)"
    echo "Log file: $LOG_FILE"
    echo "========================================"
    log_output "Migration completed successfully for environment: $ENVIRONMENT"
    
    print_success "All migrations completed successfully"
    print_info "Review log file: $LOG_FILE"
}

# Run main function
main
