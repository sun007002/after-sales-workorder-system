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
  # Launch mysqld as root (so it can write its log under /var/log/mysql) and
  # fully redirect its fds inside the root shell, then background it there so
  # it is reparented to init. This keeps it off this script's stdout pipe and
  # off --daemonize (which fails with MY-011065 in nested containers).
  sudo bash -c 'nohup mysqld --user=mysql >/var/log/mysql/manual-start.log 2>&1 </dev/null &'
  for _ in $(seq 1 120); do
    port_open && return 0
    sleep 1
  done
  echo "mysqld did not become ready; recent log:" >&2
  sudo cat /var/log/mysql/manual-start.log >&2 2>/dev/null || true
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
