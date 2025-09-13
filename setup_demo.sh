#!/usr/bin/env bash
set -e

ROOT_DIR="$(cd "$(dirname "$0")" && pwd)"
cd "$ROOT_DIR"

echo "== Logistiko Cloud - Quick Setup Script =="

# Helper
check_cmd(){ command -v "$1" >/dev/null 2>&1; }

# 1) Prefer docker-compose if available
if check_cmd docker-compose || check_cmd docker; then
  echo "docker or docker-compose found -> using Docker path"
  if check_cmd docker-compose; then
    echo "Building and starting containers with docker-compose..."
    docker-compose build --pull --no-cache
    docker-compose up -d
  else
    echo "docker-compose not found but docker is available. Using docker build/run (simple)."
    IMAGE_NAME="logistiko-cloud-demo"
    docker build -t "$IMAGE_NAME" .
    docker run -d -p 3000:3000 -v "$ROOT_DIR/uploads":/app/uploads --name "$IMAGE_NAME" "$IMAGE_NAME"
  fi
  echo "Waiting for the service to become available on http://localhost:3000 ..."
  for i in {1..20}; do
    if curl -sS http://localhost:3000/ >/dev/null 2>&1; then
      echo "Service is up! Open http://localhost:3000"
      exit 0
    fi
    sleep 1
  done
  echo "Timed out waiting for http://localhost:3000 - check docker containers with 'docker ps'"
  exit 1
fi

# 2) Fallback: npm + pm2 path
echo "docker-compose not found -> using local Node + PM2 path"

if ! check_cmd npm; then
  echo "npm is required but not found. Install Node/npm first (https://nodejs.org/)" >&2
  exit 1
fi

echo "Installing dependencies (production)..."
npm install --no-audit --no-fund

# Initialize DB (safe to call multiple times)
echo "Initializing database (demo users)..."
curl -s -X POST http://localhost:3000/api/init || true

# Start app via PM2
if check_cmd npx; then
  echo "Starting app with PM2 (npx pm2)..."
  npx pm2 start server.js --name logistiko-cloud --watch || true
  npx pm2 save || true
else
  echo "npx not found, starting directly with node"
  nohup node server.js > server.log 2>&1 &
fi

# Wait for service
echo "Waiting for the service to become available on http://localhost:3000 ..."
for i in {1..20}; do
  if curl -sS http://localhost:3000/ >/dev/null 2>&1; then
    echo "Service is up! Open http://localhost:3000"
    echo
    echo "Demo credentials: DEMO123 / demo2024  and CLIENT456 / client2024"
    echo
    echo "To enable PM2 on boot (macOS launchd), run (requires sudo):"
    echo "  sudo env PATH=\$PATH:/usr/local/bin pm2 startup launchd -u $(whoami) --hp $HOME"
    echo "  npx pm2 save"
    exit 0
  fi
  sleep 1
done

echo "Timed out waiting for http://localhost:3000 - check logs (npx pm2 logs logistiko-cloud) or server.log"
exit 1
