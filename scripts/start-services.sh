#!/bin/bash
# Start ERP Financial microservices with separate log files
# Usage: ./scripts/start-services.sh
# Stop:  ./scripts/stop-services.sh

set -e

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
ROOT_DIR="$(dirname "$SCRIPT_DIR")"
LOG_DIR="$ROOT_DIR/logs"
PID_DIR="$LOG_DIR/pids"

mkdir -p "$LOG_DIR" "$PID_DIR"

SERVICES=(
  "identity-service:8002"
  "api-gateway:8000"
  "auth-service:8001"
  "payment-service:8005"
  "settlement-service:8006"
  "workflow-service:8003"
  "notification-service:8004"
)

for svc in "${SERVICES[@]}"; do
  name="${svc%%:*}"
  port="${svc##*:}"
  logfile="$LOG_DIR/${name}.log"
  pidfile="$PID_DIR/${name}.pid"

  # Skip if already running
  if [ -f "$pidfile" ] && kill -0 "$(cat "$pidfile")" 2>/dev/null; then
    echo "[SKIP] $name already running (port $port)"
    continue
  fi

  echo "[START] $name on port $port -> $logfile"
  nohup npx nx run "$name:serve:development" > "$logfile" 2>&1 &
  echo $! > "$pidfile"
  sleep 2
done

echo ""
echo "All services started. Logs in: $LOG_DIR"
echo ""
echo "Tailing identity-service log (Ctrl+C to stop viewing, services keep running):"
tail -f "$LOG_DIR/identity-service.log"
