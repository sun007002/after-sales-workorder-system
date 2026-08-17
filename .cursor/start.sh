#!/usr/bin/env bash
# Per-boot reconciliation: ensure MySQL is running and ready before the
# backend/frontend terminals start. Safe to run repeatedly.
set -euo pipefail

MYSQL_PASSWORD="rootpassword"

port_open() { timeout 2 bash -c ': >/dev/tcp/127.0.0.1/3306' 2>/dev/null; }

ensure_mysql_up() {
  # Already listening? Nothing to do.
  if port_open; then
    return 0
  fi
  # /var/run is tmpfs and is cleared on each boot; recreate it and drop any
  # stale pid/socket left over from a snapshot taken while MySQL was running.
  sudo mkdir -p /var/run/mysqld
  sudo chown mysql:mysql /var/run/mysqld
  sudo rm -f /var/run/mysqld/mysqld.pid /var/run/mysqld/mysqld.sock \
             /var/run/mysqld/mysqld.sock.lock /var/run/mysqld/mysqlx.sock \
             /var/run/mysqld/mysqlx.sock.lock 2>/dev/null || true
  # --daemonize returns only once the server is ready to accept connections.
  sudo mysqld --daemonize --user=mysql
}

if ! ensure_mysql_up; then
  echo "MySQL failed to start; recent error log:" >&2
  sudo tail -n 40 /var/log/mysql/error.log >&2 2>/dev/null || true
  exit 1
fi

# Confirm readiness over TCP (the transport Prisma uses).
for _ in $(seq 1 30); do
  if mysqladmin --protocol=tcp -h127.0.0.1 -uroot -p"$MYSQL_PASSWORD" ping >/dev/null 2>&1; then
    echo "MySQL is ready"
    exit 0
  fi
  sleep 1
done

echo "MySQL did not become ready over TCP; recent error log:" >&2
sudo tail -n 40 /var/log/mysql/error.log >&2 2>/dev/null || true
exit 1
