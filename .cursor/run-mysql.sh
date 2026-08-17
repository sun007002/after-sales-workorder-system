#!/usr/bin/env bash
# Runs MySQL in the foreground so this terminal owns and supervises it.
# Memory-limiting flags keep the daemon within the container's cgroup limit
# (default buffers get it OOM-killed).
set -euo pipefail

port_open() { timeout 2 bash -c ': >/dev/tcp/127.0.0.1/3306' 2>/dev/null; }

if port_open; then
  echo "MySQL is already running; tailing its error log."
  exec sudo tail -n +1 -F /var/log/mysql/error.log
fi

# /var/run is tmpfs (cleared each boot); recreate it and drop stale runtime
# files that a snapshot may have captured while MySQL was running.
sudo mkdir -p /var/run/mysqld
sudo chown mysql:mysql /var/run/mysqld
sudo rm -f /var/run/mysqld/mysqld.pid /var/run/mysqld/mysqld.sock \
           /var/run/mysqld/mysqld.sock.lock /var/run/mysqld/mysqlx.sock \
           /var/run/mysqld/mysqlx.sock.lock 2>/dev/null || true

echo "Starting MySQL (foreground)..."
# Disable InnoDB native AIO / O_DIRECT: the container's overlay filesystem
# does not support them (OS error 22). Small buffers keep memory low.
exec sudo mysqld \
  --user=mysql \
  --innodb-use-native-aio=0 \
  --innodb-flush-method=fsync \
  --innodb-buffer-pool-size=64M \
  --innodb-buffer-pool-instances=1 \
  --performance-schema=OFF \
  --skip-mysqlx
