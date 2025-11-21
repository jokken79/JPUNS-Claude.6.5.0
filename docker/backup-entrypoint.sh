#!/bin/sh
# Backup Service Entrypoint

set -e

BACKUP_DIR="/backups"
DB_HOST="${POSTGRES_HOST:-localhost}"
DB_PORT="${POSTGRES_PORT:-5432}"
DB_USER="${POSTGRES_USER:-uns_admin}"
DB_NAME="${POSTGRES_DB:-uns_claudejp}"
BACKUP_TIME="${BACKUP_TIME:-02:00}"
RUN_ON_STARTUP="${RUN_ON_STARTUP:-true}"

# Ensure backup directory exists
mkdir -p "$BACKUP_DIR"

# Function to create backup
backup_database() {
  echo "Starting backup of $DB_NAME..."
  BACKUP_FILE="$BACKUP_DIR/backup_$(date +%Y%m%d_%H%M%S).sql.gz"

  PGPASSWORD="$POSTGRES_PASSWORD" pg_dump \
    -h "$DB_HOST" \
    -p "$DB_PORT" \
    -U "$DB_USER" \
    -d "$DB_NAME" \
    | gzip > "$BACKUP_FILE"

  echo "Backup completed: $BACKUP_FILE"
}

# Run backup on startup if enabled
if [ "$RUN_ON_STARTUP" = "true" ]; then
  backup_database
fi

# Start cron daemon
crond -f
