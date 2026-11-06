#!/bin/bash
# ==============================================================================
#      Ruqayya Clinic & Pharmacy Management System (HMS)
#       Date-Wise Production Database Backup Script (Linux / macOS)
# ==============================================================================

set -e

CONTAINER_NAME="hms_postgres_prod"
DB_USER="postgres"
DB_NAME="hms_prod"
BACKUP_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)/backups"

mkdir -p "$BACKUP_DIR"

TIMESTAMP=$(date +"%Y-%m-%d_%H-%M-%S")
BACKUP_FILE="$BACKUP_DIR/hms_prod_backup_${TIMESTAMP}.sql"

echo "Taking HMS Production Database Backup: [${TIMESTAMP}]..."

if ! docker ps --filter "name=${CONTAINER_NAME}" --format "{{.Names}}" | grep -q "${CONTAINER_NAME}"; then
  echo "❌ Error: Container '${CONTAINER_NAME}' is not running!"
  exit 1
fi

docker exec -i "$CONTAINER_NAME" pg_dump -U "$DB_USER" --clean --if-exists "$DB_NAME" > "$BACKUP_FILE"

FILE_SIZE=$(wc -c < "$BACKUP_FILE")
if [ "$FILE_SIZE" -le 100 ]; then
  echo "❌ Error: Backup failed or file empty (Size: $FILE_SIZE bytes)"
  rm -f "$BACKUP_FILE"
  exit 1
fi

echo "✔ Backup completed successfully: $BACKUP_FILE ($FILE_SIZE bytes)"

