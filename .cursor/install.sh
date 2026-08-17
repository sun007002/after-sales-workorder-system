#!/usr/bin/env bash
# Idempotent repository bootstrap for Cloud Agent environments.
# Installs MySQL (if missing), prepares server/.env, installs dependencies,
# generates the Prisma client, syncs the schema, and seeds baseline data.
set -euo pipefail

REPO_ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
cd "$REPO_ROOT"

MYSQL_PASSWORD="rootpassword"
MYSQL_DB="workorder_db"

# Keep MySQL's memory footprint small so it survives the build container's
# tight cgroup memory limit (default buffers get the daemon OOM-killed).
MYSQLD_ARGS=(
  --user=mysql
  --innodb-buffer-pool-size=64M
  --innodb-buffer-pool-instances=1
  --performance-schema=OFF
  --skip-mysqlx
  --log-error=/tmp/mysqld.log
)

# --- 1. Ensure MySQL server is installed (stable system dependency) ---
if ! command -v mysqld >/dev/null 2>&1; then
  sudo DEBIAN_FRONTEND=noninteractive apt-get update -qq
  sudo DEBIAN_FRONTEND=noninteractive apt-get install -y -qq mysql-server
fi

# --- 2. Ensure a MySQL instance is running for the setup steps below ---
# /var/run is tmpfs (cleared each boot); recreate it and clear stale runtime
# files that a snapshot may have captured while MySQL was running.
port_open() { timeout 2 bash -c ': >/dev/tcp/127.0.0.1/3306' 2>/dev/null; }
if ! port_open; then
  sudo mkdir -p /var/run/mysqld
  sudo chown mysql:mysql /var/run/mysqld
  sudo rm -f /var/run/mysqld/mysqld.pid /var/run/mysqld/mysqld.sock \
             /var/run/mysqld/mysqld.sock.lock /var/run/mysqld/mysqlx.sock \
             /var/run/mysqld/mysqlx.sock.lock 2>/dev/null || true
  sudo rm -f /tmp/mysqld.log 2>/dev/null || true
  echo "Starting mysqld for setup..."
  # Launch mysqld as a DIRECT child of this script (same process group): the
  # build's process supervisor reaps processes that escape the install command
  # via setsid/--daemonize/orphaning. stdout/stderr go to a user-writable log
  # so the daemon never keeps this script's stdout pipe open (which would hang
  # the build's output capture); --log-error captures startup diagnostics.
  sudo mysqld "${MYSQLD_ARGS[@]}" >/tmp/mysqld-stdio.log 2>&1 </dev/null &
  MYSQLD_PID=$!
  started=""
  for i in $(seq 1 120); do
    if port_open; then started="yes"; echo "mysqld ready after ${i}s"; break; fi
    if ! kill -0 "$MYSQLD_PID" 2>/dev/null; then
      echo "mysqld process exited early." >&2
      break
    fi
    sleep 1
  done
  if [ -z "$started" ]; then
    echo "mysqld failed to start within 120s." >&2
    echo "--- /tmp/mysqld.log (error log) ---" >&2
    sudo cat /tmp/mysqld.log >&2 2>/dev/null || echo "(empty)" >&2
    echo "--- /tmp/mysqld-stdio.log ---" >&2
    cat /tmp/mysqld-stdio.log >&2 2>/dev/null || echo "(empty)" >&2
    exit 1
  fi
fi

# --- 3. Configure root password + database (idempotent) ---
# Fresh installs authenticate root via auth_socket (sudo mysql). Once the
# password is set, re-runs authenticate over TCP instead.
run_sql() {
  if sudo mysql -e "SELECT 1" >/dev/null 2>&1; then
    sudo mysql "$@"
  else
    mysql --protocol=tcp -h127.0.0.1 -uroot -p"$MYSQL_PASSWORD" "$@"
  fi
}
run_sql <<SQL
ALTER USER 'root'@'localhost' IDENTIFIED WITH caching_sha2_password BY '${MYSQL_PASSWORD}';
CREATE DATABASE IF NOT EXISTS ${MYSQL_DB} CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
FLUSH PRIVILEGES;
SQL

# --- 4. Create server/.env if missing (never overwrite a customized one) ---
if [ ! -f server/.env ]; then
  cat > server/.env <<ENV
MYSQL_ROOT_PASSWORD=${MYSQL_PASSWORD}
MYSQL_DATABASE=${MYSQL_DB}
DATABASE_URL=mysql://root:${MYSQL_PASSWORD}@127.0.0.1:3306/${MYSQL_DB}
JWT_SECRET=your-super-secret-key-at-least-32-chars-long
JWT_EXPIRES_IN=8h
PORT=3000
CLIENT_URL=http://localhost:5173
BCRYPT_SALT_ROUNDS=10
LOGIN_MAX_ATTEMPTS=5
LOCK_DURATION_MINUTES=30
ENV
fi

# --- 5. Backend dependencies + Prisma ---
cd server
npm ci
npx prisma generate
npx prisma db push --skip-generate
npm run prisma:seed
cd ..

# --- 6. Frontend dependencies ---
cd client
npm ci
cd ..

echo "install.sh completed successfully"
