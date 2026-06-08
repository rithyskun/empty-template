#!/bin/bash
# Stop all ERP Financial microservices
# Usage: ./scripts/stop-services.sh

set -e

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
ROOT_DIR="$(dirname "$SCRIPT_DIR")"
PID_DIR="$ROOT_DIR/logs/pids"

if [ ! -d "$PID_DIR" ]; then
  echo "No PID directory found. Services may not be running."
  exit 0
fi

for pidfile in "$PID_DIR"/*.pid; do
  [ -e "$pidfile" ] || continue
  name="$(basename "$pidfile" .pid)"
  pid="$(cat "$pidfile")"
  if kill -0 "$pid" 2>/dev/null; then
    echo "[STOP] $name (PID $pid)"
    kill "$pid" 2>/dev/null || true
  else
    echo "[SKIP] $name not running"
  fi
  rm -f "$pidfile"
done

echo "All services stopped."
