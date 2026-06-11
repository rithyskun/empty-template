#!/bin/bash
# ============================================================================
# ERP Development Script
# ============================================================================
# Usage: ./scripts/dev.sh [profile]
#
# Profiles:
#   default  — gateway, identity, auth, payment, settlement, frontend
#   all      — all backend services + frontend
#   core     — gateway, identity, auth, payment, settlement, audit, frontend
#   frontend — frontend only
#   workers  — payment-worker, settlement-worker, notification-worker
# ============================================================================

set -e

cleanup() {
  echo ""
  echo "Stopping all services..."
  pkill -f "vite dev" 2>/dev/null || true
  pkill -f "nx serve" 2>/dev/null || true
  pkill -f "webpack" 2>/dev/null || true
  exit 0
}
trap cleanup INT TERM EXIT

PROFILE="${1:-default}"
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
ROOT_DIR="$(dirname "$SCRIPT_DIR")"

cd "$ROOT_DIR"

# Ensure Nx daemon is running so @nx/js:node can watch files
npx nx daemon --start 2>/dev/null || true

case "$PROFILE" in
  default)
    echo "Starting: gateway, identity, auth, payment, settlement, frontend"
    npx concurrently --kill-others --kill-others-on-fail -c auto \
      -n gateway,identity,auth,payment,settlement,frontend \
      "npx nx serve api-gateway" \
      "npx nx serve identity-service" \
      "npx nx serve auth-service" \
      "npx nx serve payment-service" \
      "npx nx serve settlement-service"
    ;;

  all)
    echo "Starting all services + frontend"
    docker compose up -d postgres redis 2>/dev/null || true
    npx concurrently --kill-others --kill-others-on-fail -c auto \
      -n gateway,identity,auth,payment,settlement,workflow,notification,audit,report,reconciliation,advance,frontend \
      "npx nx serve api-gateway" \
      "npx nx serve identity-service" \
      "npx nx serve auth-service" \
      "npx nx serve payment-service" \
      "npx nx serve settlement-service" \
      "npx nx serve workflow-service" \
      "npx nx serve notification-service" \
      "npx nx serve audit-log-service" \
      "npx nx serve report-service" \
      "npx nx serve reconciliation-service" \
      "npx nx serve advance-service" \
      "npx nx serve erp-frontend"
    ;;

  core)
    echo "Starting core services + frontend"
    npx concurrently --kill-others --kill-others-on-fail -c auto \
      -n gateway,identity,auth,payment,settlement,audit,frontend \
      "npx nx serve api-gateway" \
      "npx nx serve identity-service" \
      "npx nx serve auth-service" \
      "npx nx serve payment-service" \
      "npx nx serve settlement-service" \
      "npx nx serve audit-log-service" \
      "npx nx serve erp-frontend"
    ;;

  frontend|front)
    echo "Starting frontend only"
    npx nx serve erp-frontend
    ;;

  workers)
    echo "Starting background workers"
    npx concurrently --kill-others --kill-others-on-fail -c auto \
      -n payment-worker,settlement-worker,notification-worker \
      "npx nx serve payment-worker" \
      "npx nx serve settlement-worker" \
      "npx nx serve notification-worker"
    ;;

  *)
    echo "Unknown profile: $PROFILE"
    echo "Usage: $0 {default|all|core|frontend|workers}"
    exit 1
    ;;
esac
