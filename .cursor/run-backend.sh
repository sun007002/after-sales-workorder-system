#!/usr/bin/env bash
# Waits for MySQL to accept connections, then starts the API dev server.
# The backend exits on startup if it cannot reach the database, so gate on it.
set -euo pipefail

REPO_ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
cd "$REPO_ROOT"

port_open() { timeout 2 bash -c ': >/dev/tcp/127.0.0.1/3306' 2>/dev/null; }

echo "Waiting for MySQL on 127.0.0.1:3306..."
for _ in $(seq 1 120); do
  port_open && break
  sleep 1
done
if ! port_open; then
  echo "MySQL did not become available in time." >&2
  exit 1
fi

cd server
exec npm run dev
