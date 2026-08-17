#!/usr/bin/env bash
# Idempotent repository bootstrap for Cloud Agent environments.
# Installs MySQL (if missing), prepares an O_DIRECT-capable data directory,
# starts MySQL, creates server/.env, installs dependencies, generates the
# Prisma client, syncs the schema, and seeds baseline data.
set -euo pipefail

REPO_ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
cd "$REPO_ROOT"

# shellcheck source=/dev/null
source "$REPO_ROOT/.cursor/lib-mysql.sh"

# --- 1. Ensure MySQL server is installed (stable system dependency) ---
if ! command -v mysqld >/dev/null 2>&1; then
  sudo DEBIAN_FRONTEND=noninteractive apt-get update -qq
  sudo DEBIAN_FRONTEND=noninteractive apt-get install -y -qq mysql-server
fi

# Start mysqld as a DIRECT child of this script (same process group): the
# build's process supervisor reaps processes that escape via
# setsid/--daemonize/orphaning. Waits up to 60s for the port; returns 1 on
# failure. All fds are redirected so the daemon never holds this script's
# stdout pipe (which would hang the build's output capture).
try_start_mysqld() {
  sudo rm -f /tmp/mysqld.log 2>/dev/null || true
  sudo mysqld "${MYSQLD_ARGS[@]}" --log-error=/tmp/mysqld.log \
    >/tmp/mysqld-stdio.log 2>&1 </dev/null &
  local pid=$! i
  for i in $(seq 1 60); do
    mysql_port_open && return 0
    kill -0 "$pid" 2>/dev/null || return 1
    sleep 1
  done
  return 1
}

# --- 2. Ensure a MySQL instance is running for the setup steps below ---
if ! mysql_port_open; then
  mysql_ensure_mount
  mysql_prepare_rundir
  if ! mysql_datadir_initialized; then
    echo "Initializing fresh MySQL data directory at $MYSQL_DATADIR..."
    sudo mysqld --initialize-insecure "${MYSQLD_ARGS[@]}" --log-error=/tmp/mysqld.log
  fi
  echo "Starting mysqld for setup..."
  if ! try_start_mysqld; then
    echo "mysqld failed to start; recent error log:" >&2
    sudo cat /tmp/mysqld.log >&2 2>/dev/null || echo "(empty)" >&2
    cat /tmp/mysqld-stdio.log >&2 2>/dev/null || true
    exit 1
  fi
  echo "mysqld is ready"
fi

# --- 3. Configure root password + database (idempotent) ---
# Connect via whichever auth currently works: auth_socket, a freshly
# initialized empty password, or the already-configured password.
run_sql() {
  if sudo mysql -e "SELECT 1" >/dev/null 2>&1; then
    sudo mysql "$@"
  elif mysql --protocol=tcp -h127.0.0.1 -uroot -e "SELECT 1" >/dev/null 2>&1; then
    mysql --protocol=tcp -h127.0.0.1 -uroot "$@"
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
