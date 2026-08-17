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

# --- 2. Start a temporary MySQL instance for setup steps ---
sudo mkdir -p /var/run/mysqld
sudo chown mysql:mysql /var/run/mysqld
if ! mysqladmin -uroot -p"$MYSQL_PASSWORD" -h127.0.0.1 ping >/dev/null 2>&1 \
   && ! sudo mysqladmin ping >/dev/null 2>&1; then
  sudo setsid mysqld_safe >/tmp/mysqld-install.log 2>&1 < /dev/null &
fi
for _ in $(seq 1 60); do
  if sudo mysqladmin ping >/dev/null 2>&1 \
     || mysqladmin -uroot -p"$MYSQL_PASSWORD" -h127.0.0.1 ping >/dev/null 2>&1; then
    break
  fi
  sleep 1
done

# --- 3. Configure root password + database (idempotent) ---
# Fresh installs authenticate root via auth_socket (sudo mysql). Once the
# password is set, re-runs authenticate over TCP instead.
run_sql() {
  if sudo mysql -e "SELECT 1" >/dev/null 2>&1; then
    sudo mysql "$@"
  else
    mysql -uroot -p"$MYSQL_PASSWORD" -h127.0.0.1 "$@"
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
