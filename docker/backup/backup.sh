#!/bin/bash

################################################################################
# PostgreSQL Backup Script for UNS-ClaudeJP
# Automated backup service with cron scheduling and retention management
################################################################################

set -euo pipefail  # Exit on error, undefined vars, pipe failures

# ============================================================================
# CONFIGURATION - Read from environment variables with defaults
# ============================================================================

POSTGRES_HOST="${POSTGRES_HOST:-db}"
POSTGRES_PORT="${POSTGRES_PORT:-5432}"
POSTGRES_USER="${POSTGRES_USER:-uns_admin}"
POSTGRES_PASSWORD="${POSTGRES_PASSWORD:-uns_admin_password}"
POSTGRES_DB="${POSTGRES_DB:-uns_claudejp}"

BACKUP_DIR="${BACKUP_DIR:-/backups}"
RETENTION_DAYS="${BACKUP_RETENTION_DAYS:-30}"
BACKUP_TIME="${BACKUP_TIME:-02:00}"
RUN_ON_STARTUP="${BACKUP_RUN_ON_STARTUP:-true}"

# Logging
LOG_PREFIX="[Backup Service]"

# ============================================================================
# LOGGING FUNCTIONS
# ============================================================================

log_info() {
    echo "$(date '+%Y-%m-%d %H:%M:%S') ${LOG_PREFIX} INFO: $*"
}

log_error() {
    echo "$(date '+%Y-%m-%d %H:%M:%S') ${LOG_PREFIX} ERROR: $*" >&2
}

log_success() {
    echo "$(date '+%Y-%m-%d %H:%M:%S') ${LOG_PREFIX} SUCCESS: $*"
}

# ============================================================================
# BACKUP FUNCTION
# ============================================================================

perform_backup() {
    local timestamp
    timestamp=$(date +%Y%m%d_%H%M%S)
    local backup_file="${BACKUP_DIR}/backup_${timestamp}.sql.gz"

    log_info "Starting PostgreSQL backup..."
    log_info "Database: ${POSTGRES_DB}@${POSTGRES_HOST}:${POSTGRES_PORT}"
    log_info "Target file: ${backup_file}"

    # Ensure backup directory exists
    mkdir -p "${BACKUP_DIR}"

    # Set PostgreSQL password for pg_dump
    export PGPASSWORD="${POSTGRES_PASSWORD}"

    # Perform backup with pg_dump and compress with gzip
    if pg_dump -h "${POSTGRES_HOST}" \
                -p "${POSTGRES_PORT}" \
                -U "${POSTGRES_USER}" \
                -d "${POSTGRES_DB}" \
                --verbose \
                --no-owner \
                --no-acl \
                --format=plain \
                | gzip > "${backup_file}"; then

        local file_size
        file_size=$(du -h "${backup_file}" | cut -f1)
        log_success "Backup completed successfully!"
        log_info "Backup file: ${backup_file}"
        log_info "File size: ${file_size}"

        # Verify backup file integrity
        if ! gzip -t "${backup_file}" 2>/dev/null; then
            log_error "Backup file integrity check FAILED!"
            rm -f "${backup_file}"
            return 1
        fi

        log_success "Backup file integrity verified"

        # Cleanup old backups
        cleanup_old_backups

        return 0
    else
        log_error "Backup FAILED!"
        rm -f "${backup_file}"
        return 1
    fi
}

# ============================================================================
# CLEANUP FUNCTION - Delete backups older than RETENTION_DAYS
# ============================================================================

cleanup_old_backups() {
    log_info "Cleaning up backups older than ${RETENTION_DAYS} days..."

    local deleted_count=0
    local retention_seconds=$((RETENTION_DAYS * 86400))
    local current_time
    current_time=$(date +%s)

    # Find and delete old backup files
    while IFS= read -r -d '' backup_file; do
        local file_time
        file_time=$(stat -c %Y "${backup_file}" 2>/dev/null || stat -f %m "${backup_file}" 2>/dev/null)
        local file_age=$((current_time - file_time))

        if [ "${file_age}" -gt "${retention_seconds}" ]; then
            log_info "Deleting old backup: $(basename "${backup_file}") (${file_age} seconds old)"
            rm -f "${backup_file}"
            ((deleted_count++))
        fi
    done < <(find "${BACKUP_DIR}" -name "backup_*.sql.gz" -type f -print0)

    if [ "${deleted_count}" -gt 0 ]; then
        log_success "Deleted ${deleted_count} old backup(s)"
    else
        log_info "No old backups to delete"
    fi

    # Show current backup inventory
    list_backups
}

# ============================================================================
# LIST BACKUPS FUNCTION
# ============================================================================

list_backups() {
    log_info "Current backup inventory:"

    local backup_count=0
    local total_size=0

    while IFS= read -r -d '' backup_file; do
        local file_size
        file_size=$(du -h "${backup_file}" | cut -f1)
        local file_date
        file_date=$(date -r "${backup_file}" '+%Y-%m-%d %H:%M:%S' 2>/dev/null || stat -f %Sm -t '%Y-%m-%d %H:%M:%S' "${backup_file}" 2>/dev/null)
        log_info "  - $(basename "${backup_file}") | ${file_size} | ${file_date}"
        ((backup_count++))
    done < <(find "${BACKUP_DIR}" -name "backup_*.sql.gz" -type f -print0 | sort -z)

    if [ "${backup_count}" -eq 0 ]; then
        log_info "  No backups found"
    else
        log_info "Total backups: ${backup_count}"
    fi
}

# ============================================================================
# CRON SETUP FUNCTION - Parse BACKUP_TIME and create cron schedule
# ============================================================================

setup_cron() {
    log_info "Setting up cron job for backup schedule..."
    log_info "Backup time: ${BACKUP_TIME}"

    # Parse BACKUP_TIME (format: HH:MM)
    local hour minute
    if [[ "${BACKUP_TIME}" =~ ^([0-9]{1,2}):([0-9]{2})$ ]]; then
        hour="${BASH_REMATCH[1]}"
        minute="${BASH_REMATCH[2]}"

        # Remove leading zeros for cron
        hour=$((10#${hour}))
        minute=$((10#${minute}))

        # Create cron schedule: "minute hour * * *"
        local cron_schedule="${minute} ${hour} * * *"
        log_info "Cron schedule: ${cron_schedule}"

        # Create crontab entry
        echo "${cron_schedule} /scripts/backup.sh backup >> /proc/1/fd/1 2>&1" > /etc/crontabs/root

        log_success "Cron job configured: Daily backup at ${BACKUP_TIME} JST"
    else
        log_error "Invalid BACKUP_TIME format: ${BACKUP_TIME} (expected HH:MM)"
        return 1
    fi
}

# ============================================================================
# HEALTH CHECK FUNCTION - Verify recent backup exists (<48h old)
# ============================================================================

health_check() {
    local max_age_hours=48
    local max_age_seconds=$((max_age_hours * 3600))
    local current_time
    current_time=$(date +%s)

    # Find most recent backup
    local latest_backup
    latest_backup=$(find "${BACKUP_DIR}" -name "backup_*.sql.gz" -type f -print0 | xargs -0 ls -t 2>/dev/null | head -n1)

    if [ -z "${latest_backup}" ]; then
        log_error "Health check FAILED: No backups found"
        return 1
    fi

    local file_time
    file_time=$(stat -c %Y "${latest_backup}" 2>/dev/null || stat -f %m "${latest_backup}" 2>/dev/null)
    local file_age=$((current_time - file_time))
    local file_age_hours=$((file_age / 3600))

    if [ "${file_age}" -gt "${max_age_seconds}" ]; then
        log_error "Health check FAILED: Latest backup is ${file_age_hours}h old (max: ${max_age_hours}h)"
        return 1
    fi

    log_success "Health check PASSED: Latest backup is ${file_age_hours}h old"
    return 0
}

# ============================================================================
# START FUNCTION - Initialize backup service
# ============================================================================

start_service() {
    log_info "=========================================="
    log_info "UNS-ClaudeJP Backup Service Starting"
    log_info "=========================================="
    log_info "Configuration:"
    log_info "  Database: ${POSTGRES_DB}"
    log_info "  Host: ${POSTGRES_HOST}:${POSTGRES_PORT}"
    log_info "  User: ${POSTGRES_USER}"
    log_info "  Backup directory: ${BACKUP_DIR}"
    log_info "  Retention: ${RETENTION_DAYS} days"
    log_info "  Schedule: ${BACKUP_TIME} JST"
    log_info "  Run on startup: ${RUN_ON_STARTUP}"
    log_info "=========================================="

    # Ensure backup directory exists
    mkdir -p "${BACKUP_DIR}"

    # Setup cron schedule
    if ! setup_cron; then
        log_error "Failed to setup cron schedule"
        exit 1
    fi

    # Run initial backup if configured
    if [ "${RUN_ON_STARTUP}" = "true" ]; then
        log_info "Running initial backup (RUN_ON_STARTUP=true)..."
        if ! perform_backup; then
            log_error "Initial backup failed, but service will continue"
        fi
    else
        log_info "Skipping initial backup (RUN_ON_STARTUP=false)"
    fi

    # Start cron daemon in foreground
    log_info "Starting cron daemon..."
    log_info "Service ready! Waiting for scheduled backups..."

    # Run crond in foreground with logging
    exec crond -f -l 2
}

# ============================================================================
# MAIN SCRIPT LOGIC
# ============================================================================

case "${1:-}" in
    start)
        # Start the backup service (called by Docker CMD)
        start_service
        ;;

    backup)
        # Perform a single backup (called by cron or manually)
        perform_backup
        ;;

    cleanup)
        # Cleanup old backups only
        cleanup_old_backups
        ;;

    list)
        # List current backups
        list_backups
        ;;

    health)
        # Health check
        health_check
        ;;

    *)
        echo "Usage: $0 {start|backup|cleanup|list|health}"
        echo ""
        echo "Commands:"
        echo "  start   - Start backup service with cron (Docker CMD)"
        echo "  backup  - Perform a single backup now"
        echo "  cleanup - Delete old backups (older than RETENTION_DAYS)"
        echo "  list    - List all current backups"
        echo "  health  - Health check (verify recent backup exists)"
        exit 1
        ;;
esac
