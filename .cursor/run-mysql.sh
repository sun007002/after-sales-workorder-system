#!/usr/bin/env bash
# Runs MySQL in the foreground so this terminal owns and supervises it.
# The data directory lives on a loopback ext4 image (see lib-mysql.sh) so
# InnoDB's O_DIRECT probe works regardless of the pod's host filesystem.
set -euo pipefail

source "$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)/lib-mysql.sh"

if mysql_port_open; then
  echo "MySQL is already running; tailing its error log."
  exec sudo tail -n +1 -F /var/log/mysql/error.log
fi

mysql_ensure_mount
mysql_prepare_rundir

if ! mysql_datadir_initialized; then
  echo "Initializing fresh MySQL data directory at $MYSQL_DATADIR..."
  sudo mysqld --initialize-insecure "${MYSQLD_ARGS[@]}"
fi

echo "Starting MySQL (foreground) with datadir $MYSQL_DATADIR..."
exec sudo mysqld "${MYSQLD_ARGS[@]}"
