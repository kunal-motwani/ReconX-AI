#!/usr/bin/env bash
# =============================================================================
# ReconX-AI — One-command Startup Script
# =============================================================================
set -euo pipefail

RED='\033[0;31m'; GREEN='\033[0;32m'; YELLOW='\033[1;33m'
BLUE='\033[0;34m'; CYAN='\033[0;36m'; BOLD='\033[1m'; RESET='\033[0m'

info()    { echo -e "${CYAN}[INFO]${RESET} $*"; }
success() { echo -e "${GREEN}[OK]${RESET}   $*"; }
warn()    { echo -e "${YELLOW}[WARN]${RESET} $*"; }
error()   { echo -e "${RED}[ERR]${RESET}  $*"; }
header()  { echo -e "\n${BOLD}${BLUE}$*${RESET}"; }

REPO_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
TOOLS_BIN="$REPO_DIR/.tools/bin"
BACKEND_DIR="$REPO_DIR/backend"
FRONTEND_DIR="$REPO_DIR/frontend"
PID_DIR="$REPO_DIR/.pids"

BACKEND_PORT=5000
FRONTEND_PORT=3000

export PATH="$TOOLS_BIN:$PATH"

if [[ "${1:-}" == "--stop" ]]; then
  header "Stopping ReconX-AI services..."
  for svc in frontend backend; do
    PID_FILE="$PID_DIR/$svc.pid"
    if [[ -f "$PID_FILE" ]]; then
      PID=$(cat "$PID_FILE")
      if kill "$PID" 2>/dev/null; then success "Stopped $svc (PID $PID)"
      else warn "$svc was not running"; fi
      rm -f "$PID_FILE"
    fi
  done
  echo -e "\n${GREEN}All services stopped.${RESET}"
  exit 0
fi

header "ReconX-AI Startup"
echo -e "  Repo : $REPO_DIR"
echo -e "  Node : $(node --version 2>/dev/null || echo 'NOT FOUND')"

if ! command -v node &>/dev/null; then
  error "Node.js not found. Add .tools/bin to PATH or install Node.js 20."
  exit 1
fi

mkdir -p "$PID_DIR" "$REPO_DIR/.logs"

# 1/2 Backend (SQLite is created by Prisma in backend/prisma/dev.db)
header "1/2  Starting Backend API (port $BACKEND_PORT)..."
[[ ! -d "$BACKEND_DIR/node_modules" ]] && npm install --prefix "$BACKEND_DIR" --silent
cd "$BACKEND_DIR"
info "Pushing Prisma schema..."
npx prisma db push --skip-generate 2>&1 | tail -2
if [[ "${1:-}" == "--seed" ]] || [[ ! -f "$PID_DIR/.seeded" ]]; then
  info "Seeding demo data..."
  npx ts-node prisma/seed.ts 2>&1 | tail -3
  touch "$PID_DIR/.seeded"
fi
NODE_ENV=development npx ts-node src/server.ts >> "$REPO_DIR/.logs/backend.log" 2>&1 &
BACKEND_PID=$!
echo "$BACKEND_PID" > "$PID_DIR/backend.pid"
for i in $(seq 1 20); do
  curl -sf "http://localhost:$BACKEND_PORT/api/health" >/dev/null 2>&1 && break
  sleep 1
done
success "Backend started (PID $BACKEND_PID)"

# 2/2 Frontend
header "2/2  Starting Frontend Dev Server (port $FRONTEND_PORT)..."
[[ ! -d "$FRONTEND_DIR/node_modules" ]] && npm install --prefix "$FRONTEND_DIR" --silent
cd "$FRONTEND_DIR"
NEXT_PUBLIC_API_URL="http://localhost:$BACKEND_PORT/api" \
  npx next dev --port "$FRONTEND_PORT" >> "$REPO_DIR/.logs/frontend.log" 2>&1 &
FRONTEND_PID=$!
echo "$FRONTEND_PID" > "$PID_DIR/frontend.pid"
for i in $(seq 1 30); do
  curl -sf "http://localhost:$FRONTEND_PORT" >/dev/null 2>&1 && break
  sleep 2
done
success "Frontend started (PID $FRONTEND_PID)"

echo ""
echo -e "${BOLD}${GREEN}╔══════════════════════════════════════════════════════════╗${RESET}"
echo -e "${BOLD}${GREEN}║         ReconX-AI is up and running! 🚀                  ║${RESET}"
echo -e "${BOLD}${GREEN}╚══════════════════════════════════════════════════════════╝${RESET}"
echo ""
echo -e "  ${BOLD}Frontend${RESET}    →  http://localhost:$FRONTEND_PORT"
echo -e "  ${BOLD}Backend API${RESET} →  http://localhost:$BACKEND_PORT/api"
echo -e "  ${BOLD}Swagger UI${RESET}  →  http://localhost:$BACKEND_PORT/api/docs"
echo ""
echo -e "  ${BOLD}Demo Credentials${RESET}"
echo -e "  ┌─────────────────┬────────────────────────────┬────────────────┐"
echo -e "  │ Role            │ Email                      │ Password       │"
echo -e "  ├─────────────────┼────────────────────────────┼────────────────┤"
echo -e "  │ Admin           │ admin@abctech.com          │ Demo1234!      │"
echo -e "  │ Finance Manager │ manager@abctech.com        │ Demo1234!      │"
echo -e "  │ Finance Analyst │ analyst@abctech.com        │ Demo1234!      │"
echo -e "  └─────────────────┴────────────────────────────┴────────────────┘"
echo ""
echo -e "  Logs: .logs/backend.log  |  .logs/frontend.log"
echo -e "  Stop: ${CYAN}./start.sh --stop${RESET}"
echo ""
