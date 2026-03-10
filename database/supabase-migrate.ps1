# Supabase Migration Script for AfroSuperStore (PowerShell)

# Configuration - Update these with your Supabase details
$SUPABASE_URL = "azpgqsmgyorjbqsgxuxw.supabase.co"
$SUPABASE_DB_PASSWORD = ""  # Add your database password here
$DB_NAME = "postgres"
$DB_PORT = "5432"
$DB_USER = "postgres"

function Write-Log {
    param([string]$message)
    Write-Host "[$(Get-Date -Format 'yyyy-MM-dd HH:mm:ss')] $message" -ForegroundColor Green
}

function Write-Error-Log {
    param([string]$message)
    Write-Host "[ERROR] $message" -ForegroundColor Red
    exit 1
}

function Write-Warning-Log {
    param([string]$message)
    Write-Host "[WARNING] $message" -ForegroundColor Yellow
}

# Check if psql is available
function Check-Psql-Client {
    if (-not (Get-Command psql -ErrorAction SilentlyContinue)) {
        Write-Error-Log "PostgreSQL client (psql) is not installed. Please install it with: winget install PostgreSQL or download from https://www.postgresql.org/download/windows/"
    }
}

# Check if database password is set
function Check-Config {
    if ([string]::IsNullOrEmpty($SUPABASE_DB_PASSWORD)) {
        Write-Error-Log "Please set SUPABASE_DB_PASSWORD in this script. Get it from your Supabase project settings."
    }
}

# Check if database is accessible
function Check-Database {
    Write-Log "Checking database connection..."
    
    $env:PGPASSWORD = $SUPABASE_DB_PASSWORD
    $result = psql -h $SUPABASE_URL -p $DB_PORT -U $DB_USER -d $DB_NAME -c "SELECT 1;" 2>$null
    
    if ($LASTEXITCODE -ne 0) {
        Write-Error-Log "Cannot connect to database. Please check configuration."
    }
    
    Write-Log "Database connection successful ✓"
}

# Get executed migrations
function Get-Executed-Migrations {
    $env:PGPASSWORD = $SUPABASE_DB_PASSWORD
    $result = psql -h $SUPABASE_URL -p $DB_PORT -U $DB_USER -d $DB_NAME -t -c "SELECT filename FROM migrations ORDER BY executed_at;" 2>$null
    if ($LASTEXITCODE -eq 0) {
        return $result
    }
    return ""
}

# Run migration file
function Run-Migration {
    param([string]$migrationFile)
    
    $migrationName = [System.IO.Path]::GetFileNameWithoutExtension($migrationFile)
    Write-Log "Running migration: $migrationName"
    
    # Execute migration
    $env:PGPASSWORD = $SUPABASE_DB_PASSWORD
    psql -h $SUPABASE_URL -p $DB_PORT -U $DB_USER -d $DB_NAME -f $migrationFile
    
    if ($LASTEXITCODE -eq 0) {
        # Record migration as executed
        psql -h $SUPABASE_URL -p $DB_PORT -U $DB_USER -d $DB_NAME -c "INSERT INTO migrations (filename) VALUES ('$migrationName');"
        Write-Log "Migration $migrationName completed ✓"
    } else {
        Write-Error-Log "Migration $migrationName failed"
    }
}

# Main migration function
function Main {
    Write-Log "Starting Supabase database migration for AfroSuperStore..."
    
    Check-Psql-Client
    Check-Config
    Check-Database
    
    # Create migrations table if it doesn't exist
    Write-Log "Creating migrations table..."
    $env:PGPASSWORD = $SUPABASE_DB_PASSWORD
    psql -h $SUPABASE_URL -p $DB_PORT -U $DB_USER -d $DB_NAME -c @"
CREATE TABLE IF NOT EXISTS migrations (
    id SERIAL PRIMARY KEY,
    filename VARCHAR(255) NOT NULL UNIQUE,
    executed_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
"@
    
    # Get list of executed migrations
    $executedMigrations = Get-Executed-Migrations
    
    # Find and run pending migrations
    Get-ChildItem -Path "migrations\*.sql" | ForEach-Object {
        $migrationName = [System.IO.Path]::GetFileNameWithoutExtension($_.Name)
        
        # Check if migration already executed
        if ($executedMigrations -match $migrationName) {
            Write-Log "Migration $migrationName already executed, skipping..."
        } else {
            Run-Migration -migrationFile $_.FullName
        }
    }
    
    # Show final status
    Write-Log "Migration completed successfully!"
    Write-Log "Current database version:"
    Get-Executed-Migrations
}

# Show migration status
function Show-Status {
    Write-Log "Migration status:"
    Get-Executed-Migrations
}

# Create backup before migration
function Backup-Database {
    Write-Log "Creating database backup..."
    
    $backupFile = "backup_$(Get-Date -Format 'yyyyMMdd_HHmmss').sql"
    
    $env:PGPASSWORD = $SUPABASE_DB_PASSWORD
    pg_dump -h $SUPABASE_URL -p $DB_PORT -U $DB_USER -d $DB_NAME > $backupFile
    
    if ($LASTEXITCODE -eq 0) {
        Write-Log "Backup created: $backupFile ✓"
    } else {
        Write-Error-Log "Backup creation failed"
    }
}

# Handle script arguments
$command = if ($args.Count -gt 0) { $args[0] } else { "migrate" }

switch ($command) {
    "migrate" {
        Backup-Database
        Main
    }
    "status" {
        Show-Status
    }
    "backup" {
        Backup-Database
    }
    "help" {
        Write-Host "Usage: .\supabase-migrate.ps1 [migrate|status|backup]"
        Write-Host ""
        Write-Host "Commands:"
        Write-Host "  migrate    Run all pending migrations (default)"
        Write-Host "  status     Show migration status"
        Write-Host "  backup     Create database backup"
        Write-Host ""
        Write-Host "Examples:"
        Write-Host "  .\supabase-migrate.ps1 migrate              # Run all pending migrations"
        Write-Host "  .\supabase-migrate.ps1 status               # Show current migration status"
        Write-Host "  .\supabase-migrate.ps1 backup               # Create database backup"
        Write-Host ""
        Write-Host "Setup:"
        Write-Host "1. Get your database password from Supabase project settings"
        Write-Host "2. Update SUPABASE_DB_PASSWORD in this script"
        Write-Host "3. Install PostgreSQL client: winget install PostgreSQL"
    }
    default {
        Write-Error-Log "Invalid command. Use 'help' for usage information."
    }
}
