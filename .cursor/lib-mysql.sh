#!/usr/bin/env bash
# Shared MySQL helpers for the Cloud Agent environment.
#
# Why a loopback ext4 image?
#   InnoDB always probes the first tablespace page with O_DIRECT, regardless of
#   --innodb-flush-method. Some container overlay filesystems reject O_DIRECT
#   with EINVAL, so mysqld dies at InnoDB init ("Operating system error number
#   22"). Hosting the data directory on a loopback ext4 image guarantees
#   O_DIRECT support on every pod, independent of the host filesystem.

MYSQL_PASSWORD="${MYSQL_PASSWORD:-rootpassword}"
MYSQL_DB="${MYSQL_DB:-workorder_db}"
MYSQL_IMG="${MYSQL_IMG:-/var/lib/mysql-ext4.img}"
MYSQL_DATADIR="${MYSQL_DATADIR:-/var/lib/mysql-data}"
MYSQL_IMG_SIZE="${MYSQL_IMG_SIZE:-2G}"

# Keep the memory footprint small and skip components we do not need.
MYSQLD_ARGS=(
  --user=mysql
  --datadir="$MYSQL_DATADIR"
  --innodb-buffer-pool-size=64M
  --innodb-buffer-pool-instances=1
  --performance-schema=OFF
  --skip-mysqlx
)

mysql_port_open() { timeout 2 bash -c ': >/dev/tcp/127.0.0.1/3306' 2>/dev/null; }

# Ensure the loopback ext4 image exists and is mounted at $MYSQL_DATADIR.
mysql_ensure_mount() {
  if mountpoint -q "$MYSQL_DATADIR"; then
    return 0
  fi
  if ! command -v mkfs.ext4 >/dev/null 2>&1; then
    sudo DEBIAN_FRONTEND=noninteractive apt-get update -qq
    sudo DEBIAN_FRONTEND=noninteractive apt-get install -y -qq e2fsprogs
  fi
  if [ ! -f "$MYSQL_IMG" ]; then
    echo "Creating ext4 data image at $MYSQL_IMG ($MYSQL_IMG_SIZE, sparse)..."
    sudo truncate -s "$MYSQL_IMG_SIZE" "$MYSQL_IMG"
    sudo mkfs.ext4 -q -F "$MYSQL_IMG"
  fi
  sudo mkdir -p "$MYSQL_DATADIR"
  sudo mount -o loop "$MYSQL_IMG" "$MYSQL_DATADIR"
  sudo chown mysql:mysql "$MYSQL_DATADIR"
}

# True when the data directory already holds an initialized system schema.
mysql_datadir_initialized() {
  sudo test -d "$MYSQL_DATADIR/mysql"
}

# /var/run is tmpfs (cleared each boot); recreate it and drop stale sockets/pid.
mysql_prepare_rundir() {
  sudo mkdir -p /var/run/mysqld
  sudo chown mysql:mysql /var/run/mysqld
  sudo rm -f /var/run/mysqld/mysqld.pid /var/run/mysqld/mysqld.sock \
             /var/run/mysqld/mysqld.sock.lock /var/run/mysqld/mysqlx.sock \
             /var/run/mysqld/mysqlx.sock.lock 2>/dev/null || true
}
