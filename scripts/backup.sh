#!/bin/bash

# ITOSM Platform Backup Script
# This script creates backups of the PostgreSQL database

set -e

# Configuration
BACKUP_DIR="./backups"
DATE=$(date +%Y%m%d_%H%M%S)
BACKUP_FILE="itosm_backup_${DATE}.sql"
RETENTION_DAYS=30

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

# Create backup directory
mkdir -p "$BACKUP_DIR"

# Check if Docker containers are running
print_info "Checking if database container is running..."
if ! docker-compose ps database | grep -q "Up"; then
    print_error "Database container is not running. Please start with: docker-compose up -d"
    exit 1
fi

# Create database backup
print_info "Creating database backup..."
if docker-compose exec -T database pg_dump -U postgres itosm_db > "$BACKUP_DIR/$BACKUP_FILE"; then
    print_success "Database backup created: $BACKUP_DIR/$BACKUP_FILE"
    
    # Compress backup
    gzip "$BACKUP_DIR/$BACKUP_FILE"
    print_success "Backup compressed: $BACKUP_DIR/$BACKUP_FILE.gz"
    
    # Get backup size
    BACKUP_SIZE=$(du -h "$BACKUP_DIR/$BACKUP_FILE.gz" | cut -f1)
    print_info "Backup size: $BACKUP_SIZE"
else
    print_error "Failed to create database backup"
    exit 1
fi

# Clean old backups
print_info "Cleaning old backups (older than $RETENTION_DAYS days)..."
find "$BACKUP_DIR" -name "itosm_backup_*.sql.gz" -mtime +$RETENTION_DAYS -delete
REMAINING=$(ls -1 "$BACKUP_DIR"/itosm_backup_*.sql.gz 2>/dev/null | wc -l)
print_info "Remaining backups: $REMAINING"

print_success "Backup process completed successfully!"
print_info "To restore this backup, use: ./scripts/restore.sh $BACKUP_DIR/$BACKUP_FILE.gz"