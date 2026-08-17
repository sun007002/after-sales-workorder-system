#!/usr/bin/env bash
# Idempotent repository bootstrap for Cloud Agent environments.
# Installs MySQL (if missing), prepares server/.env, installs dependencies,
# generates the Prisma client, syncs the schema, and seeds baseline data.
set -euo pipefail

REPO_ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
cd "$REPO_ROOT"

MYSQL_PASSWORD="rootpassword"
MYSQL_DB="workorder_db"

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
  # Launch mysqld in a detached session and poll for readiness. `--daemonize`
  # is avoided on purpose: it fails with MY-011065 in nested containers.
  # All fds are redirected so the daemon never keeps this script's stdout
  # pipe open (which would hang callers that capture output).
  sudo setsid bash -c 'mysqld --user=mysql >>/var/log/mysql/manual-start.log 2>&1' </dev/null >/dev/null 2>&1 &
  started=""
  for _ in $(seq 1 120); do
    if port_open; then started="yes"; break; fi
    sleep 1
  done
  if [ -z "$started" ]; then
    echo "mysqld failed to start; recent error log:" >&2
    sudo tail -n 40 /var/log/mysql/error.log >&2 2>/dev/null || true
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
