#!/usr/bin/env bash
# scripts/backup.sh — Postgres dump via pg_dump (custom format) with rotation.
#
# Usage:
#   DATABASE_URL=postgresql://user:pass@host:5432/db ./scripts/backup.sh
#
# Env:
#   DATABASE_URL  (required) connection string
#   BACKUP_DIR    (default: ./backups)
#   KEEP_BACKUPS  (default: 14) number of recent backups to retain
set -euo pipefail

DATABASE_URL="${DATABASE_URL:?DATABASE_URL is required}"
BACKUP_DIR="${BACKUP_DIR:-./backups}"
KEEP_BACKUPS="${KEEP_BACKUPS:-14}"

mkdir -p "$BACKUP_DIR"

TIMESTAMP="$(date +%Y%m%d_%H%M%S)"
DUMP_FILE="$BACKUP_DIR/backup_${TIMESTAMP}.dump"

echo "Creating backup: $DUMP_FILE"
pg_dump --format=custom --file="$DUMP_FILE" "$DATABASE_URL"

# Rotate: keep the newest N backups
ls -1t "$BACKUP_DIR"/backup_*.dump 2>/dev/null | tail -n "+$((KEEP_BACKUPS + 1))" | while read -r old; do
  echo "Removing old backup: $old"
  rm -f "$old"
done

echo "Backup complete: $DUMP_FILE ($(du -h "$DUMP_FILE" | cut -f1))"
