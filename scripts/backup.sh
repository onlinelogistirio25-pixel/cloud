#!/usr/bin/env bash
set -euo pipefail

ROOT_DIR="$(cd "$(dirname "$0")/.." && pwd)"
cd "$ROOT_DIR"

BACKUP_DIR="$ROOT_DIR/backups"
mkdir -p "$BACKUP_DIR"

TIMESTAMP=$(date +%Y%m%dT%H%M%S)
DB_FILE="$ROOT_DIR/data.db"

if [ -f "$DB_FILE" ]; then
  cp "$DB_FILE" "$BACKUP_DIR/data.db.$TIMESTAMP.sqlite"
  echo "DB backed up to $BACKUP_DIR/data.db.$TIMESTAMP.sqlite"
else
  echo "No data.db found to backup"
fi

if [ -d "$ROOT_DIR/uploads" ]; then
  tar -czf "$BACKUP_DIR/uploads.$TIMESTAMP.tgz" -C "$ROOT_DIR" uploads
  echo "Uploads archived to $BACKUP_DIR/uploads.$TIMESTAMP.tgz"
else
  echo "No uploads/ directory to archive"
fi

# remove backups older than 30 days
find "$BACKUP_DIR" -type f -mtime +30 -print -delete || true

echo "Backup complete"
