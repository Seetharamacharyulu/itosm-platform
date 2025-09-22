#!/bin/bash

# ITOSM Platform Restore Script
# This script restores a PostgreSQL database backup

set -e

# Configuration
BACKUP_FILE=$1

# Colors for output
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m'

print_info() {
    echo -e "${YELLOW}[INFO]${NC} $1"
}

print_success() {
    echo -e "${GREEN}[SUCCESS]${NC} $1"
}

print_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

print_warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1"
}

# Check if backup file is provided
if [ -z "$BACKUP_FILE" ]; then
    print_error "Usage: $0 <backup_file>"
    print_info "Example: $0 ./backups/itosm_backup_20250120_143022.sql.gz"
    
    # List available backups
    if [ -d "./backups" ]; then
        print_info "Available backups:"
        ls -1t ./backups/itosm_backup_*.sql.gz 2>/dev/null | head -10
    fi
    exit 1
fi

# Check if backup file exists
if [ ! -f "$BACKUP_FILE" ]; then
    print_error "Backup file not found: $BACKUP_FILE"
    exit 1
fi

# Check if Docker containers are running
print_info "Checking if database container is running..."
if ! docker-compose ps database | grep -q "Up"; then
    print_error "Database container is not running. Please start with: docker-compose up -d"
    exit 1
fi

# Warning about data loss
print_warning "This will replace ALL data in the current database!"
echo -n "Are you sure you want to continue? (yes/no): "
read confirmation

if [ "$confirmation" != "yes" ]; then
    print_info "Restore cancelled"
    exit 0
fi

# Create backup of current database before restore
print_info "Creating backup of current database..."
CURRENT_BACKUP="./backups/pre_restore_backup_$(date +%Y%m%d_%H%M%S).sql"
mkdir -p ./backups
docker-compose exec -T database pg_dump -U postgres itosm_db > "$CURRENT_BACKUP"
print_success "Current database backed up to: $CURRENT_BACKUP"

# Prepare restore file
RESTORE_FILE="$BACKUP_FILE"
if [[ "$BACKUP_FILE" == *.gz ]]; then
    print_info "Decompressing backup file..."
    RESTORE_FILE="${BACKUP_FILE%.gz}"
    gunzip -c "$BACKUP_FILE" > "$RESTORE_FILE"
fi

# Stop application to prevent connections
print_info "Stopping application container..."
docker-compose stop itosm_app

# Drop and recreate database
print_info "Recreating database..."
docker-compose exec database psql -U postgres -c "DROP DATABASE IF EXISTS itosm_db;"
docker-compose exec database psql -U postgres -c "CREATE DATABASE itosm_db;"

# Restore database
print_info "Restoring database from backup..."
if docker-compose exec -T database psql -U postgres itosm_db < "$RESTORE_FILE"; then
    print_success "Database restored successfully"
else
    print_error "Failed to restore database"
    
    # Attempt to restore the pre-restore backup
    print_info "Attempting to restore previous database..."
    docker-compose exec database psql -U postgres -c "DROP DATABASE IF EXISTS itosm_db;"
    docker-compose exec database psql -U postgres -c "CREATE DATABASE itosm_db;"
    docker-compose exec -T database psql -U postgres itosm_db < "$CURRENT_BACKUP"
    
    exit 1
fi

# Clean up temporary file if it was decompressed
if [[ "$BACKUP_FILE" == *.gz ]] && [ -f "$RESTORE_FILE" ]; then
    rm "$RESTORE_FILE"
fi

# Start application
print_info "Starting application container..."
docker-compose start itosm_app

# Wait for application to be ready
print_info "Waiting for application to start..."
sleep 10

# Check application health
if curl -f http://localhost:5000/api/health > /dev/null 2>&1; then
    print_success "Application is running and healthy"
    print_info "Application available at: http://localhost:5000"
else
    print_warning "Application started but health check failed"
    print_info "Check logs with: docker-compose logs itosm_app"
fi

print_success "Database restore completed successfully!"
print_info "Pre-restore backup saved at: $CURRENT_BACKUP"