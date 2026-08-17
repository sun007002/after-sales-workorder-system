#!/usr/bin/env bash
# Per-boot reconciliation: ensure MySQL is running and ready before the
# backend/frontend terminals start. Safe to run repeatedly.
set -euo pipefail

MYSQL_PASSWORD="rootpassword"

port_open() { timeout 2 bash -c ': >/dev/tcp/127.0.0.1/3306' 2>/dev/null; }

start_mysql() {
  # /var/run is tmpfs and is cleared on each boot; recreate it and drop any
  # stale pid/socket left over from a snapshot taken while MySQL was running.
  sudo mkdir -p /var/run/mysqld
  sudo chown mysql:mysql /var/run/mysqld
  sudo rm -f /var/run/mysqld/mysqld.pid /var/run/mysqld/mysqld.sock \
             /var/run/mysqld/mysqld.sock.lock /var/run/mysqld/mysqlx.sock \
             /var/run/mysqld/mysqlx.sock.lock 2>/dev/null || true
  # Launch mysqld in a detached session and poll for readiness. `--daemonize`
  # is avoided on purpose: it fails with MY-011065 in nested containers.
  # All fds are redirected so the daemon never keeps this script's stdout
  # pipe open (which would hang callers that capture output).
  sudo setsid bash -c 'mysqld --user=mysql >>/var/log/mysql/manual-start.log 2>&1' </dev/null >/dev/null 2>&1 &
  for _ in $(seq 1 120); do
    port_open && return 0
    sleep 1
  done
  return 1
}

if ! port_open; then
  if ! start_mysql; then
    echo "MySQL failed to start; recent error log:" >&2
    sudo tail -n 40 /var/log/mysql/error.log >&2 2>/dev/null || true
    exit 1
  fi
fi

echo "MySQL is ready"
