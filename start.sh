#!/usr/bin/env bash
# OmniMarkIt — one-command launcher (backend + frontend).
# First run creates a venv, installs deps, and seeds the database.
#
# Usage:  ./start.sh
# Then open http://localhost:3000  (API docs at http://localhost:8000/docs)
set -e

ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"

# --- Backend ---
cd "$ROOT/backend"
if [ ! -d ".venv" ]; then
  echo "▶ Creating Python venv and installing backend deps…"
  python3 -m venv .venv
  ./.venv/bin/pip install -q --upgrade pip
  ./.venv/bin/pip install -q -r requirements.txt
fi
if [ ! -f "omnimarkit.db" ]; then
  echo "▶ Seeding database…"
  ./.venv/bin/python -m app.seed
fi
echo "▶ Starting backend on :8000"
./.venv/bin/uvicorn app.main:app --reload --port 8000 &
BACKEND_PID=$!

# --- Frontend ---
cd "$ROOT/web"
if [ ! -d "node_modules" ]; then
  echo "▶ Installing frontend deps…"
  npm install
fi
[ -f .env.local ] || cp .env.local.example .env.local
echo "▶ Starting frontend on :3000"
npm run dev &
FRONTEND_PID=$!

trap "echo; echo '▶ Stopping…'; kill $BACKEND_PID $FRONTEND_PID 2>/dev/null" EXIT
echo ""
echo "✅ OmniMarkIt running:"
echo "   Frontend → http://localhost:3000"
echo "   API docs → http://localhost:8000/docs"
echo "   (Ctrl+C to stop both)"
wait
