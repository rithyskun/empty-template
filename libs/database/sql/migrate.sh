#!/bin/bash
# ============================================================================
# Database Migration Runner
# ============================================================================
# Usage: ./migrate.sh [database_url]
# Example: ./migrate.sh postgres://postgres:postgres@localhost:5432/erp_financial
#
# Priority:
#   1. CLI argument
#   2. DATABASE_URL env var
#   3. Constructed from DB_HOST/PORT/USERNAME/PASSWORD/DATABASE env vars
#   4. Loaded from .env file in project root
# ============================================================================

set -e

SQL_DIR="$(cd "$(dirname "$0")" && pwd)"
PROJECT_ROOT="$(cd "$SQL_DIR/../../.." && pwd)"

DB_URL="$1"

# 2. Fall back to DATABASE_URL env var
if [ -z "$DB_URL" ]; then
    DB_URL="${DATABASE_URL}"
fi

# 3. Construct from individual env vars
if [ -z "$DB_URL" ] && [ -n "$DB_HOST" ]; then
    DB_URL="postgres://${DB_USERNAME}:${DB_PASSWORD}@${DB_HOST}:${DB_PORT:-5432}/${DB_DATABASE}"
fi

# 4. Safely extract DB_* values from .env without sourcing (avoids & and other shell metacharacters)
if [ -z "$DB_URL" ] && [ -f "$PROJECT_ROOT/.env" ]; then
    while IFS='=' read -r key value; do
        # trim whitespace
        key=$(echo "$key" | sed 's/^[[:space:]]*//;s/[[:space:]]*$//')
        value=$(echo "$value" | sed 's/^[[:space:]]*//;s/[[:space:]]*$//')
        # strip surrounding quotes
        value=$(echo "$value" | sed "s/^['\"]//;s/['\"]\$//")
        case "$key" in
            DB_HOST) DB_HOST="$value" ;;
            DB_PORT) DB_PORT="$value" ;;
            DB_USERNAME) DB_USERNAME="$value" ;;
            DB_PASSWORD) DB_PASSWORD="$value" ;;
            DB_DATABASE) DB_DATABASE="$value" ;;
            DATABASE_URL) DATABASE_URL="$value" ;;
        esac
    done < "$PROJECT_ROOT/.env"

    DB_URL="${DATABASE_URL}"

    if [ -z "$DB_URL" ] && [ -n "$DB_HOST" ]; then
        DB_URL="postgres://${DB_USERNAME}:${DB_PASSWORD}@${DB_HOST}:${DB_PORT:-5432}/${DB_DATABASE}"
    fi
fi

if [ -z "$DB_URL" ]; then
    echo "Error: Could not determine database URL."
    echo "Options (checked in order):"
    echo "  1. Pass as argument:  $0 postgres://user:pass@host:5432/db"
    echo "  2. DATABASE_URL env var"
    echo "  3. DB_HOST, DB_PORT, DB_USERNAME, DB_PASSWORD, DB_DATABASE env vars"
    echo "  4. .env file at project root ($PROJECT_ROOT/.env)"
    exit 1
fi

echo "Running migrations from $SQL_DIR ..."

# Ordered list of migration files
FILES=(
    "001_base_schema.sql"
    "002_identity_core.sql"
    "003_audit_core.sql"
    "004_payment_core.sql"
    "005_settlement_core.sql"
    "006_notification_core.sql"
    "007_advance_core.sql"
    "008_workflow_core.sql"
)

for file in "${FILES[@]}"; do
    filepath="$SQL_DIR/$file"
    if [ ! -f "$filepath" ]; then
        echo "  SKIP (not found): $file"
        continue
    fi
    echo "  APPLY: $file"
    psql "$DB_URL" -v ON_ERROR_STOP=1 -f "$filepath"
done

echo "Migrations complete."
