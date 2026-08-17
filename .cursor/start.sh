#!/usr/bin/env bash
# Per-boot reconciliation: ensure MySQL is running and ready before the
# backend/frontend terminals start. Safe to run repeatedly.
set -euo pipefail

MYSQL_PASSWORD="rootpassword"

sudo mkdir -p /var/run/mysqld
sudo chown mysql:mysql /var/run/mysqld

is_ready() {
  mysqladmin -uroot -p"$MYSQL_PASSWORD" -h127.0.0.1 ping >/dev/null 2>&1
}

if ! is_ready; then
  sudo setsid mysqld_safe >/tmp/mysqld.log 2>&1 < /dev/null &
  for _ in $(seq 1 60); do
    is_ready && break
    sleep 1
  done
fi

if is_ready; then
  echo "MySQL is ready"
else
  echo "MySQL failed to become ready; see /tmp/mysqld.log" >&2
  exit 1
fi
