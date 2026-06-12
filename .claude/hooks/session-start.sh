#!/bin/bash
# SessionStart hook — logs each session start for audit trail.
# Capped at 500 lines (~3 months at 5 sessions/day).

LOGS_DIR="${CLAUDE_PROJECT_DIR}/logs"
mkdir -p "$LOGS_DIR"

LOG_FILE="${LOGS_DIR}/sessions.log"

# Rolling trim: keep last 500 lines
if [ -f "$LOG_FILE" ] && [ "$(wc -l < "$LOG_FILE")" -gt 500 ]; then
  tail -n 500 "$LOG_FILE" > "${LOG_FILE}.tmp" && mv "${LOG_FILE}.tmp" "$LOG_FILE"
fi

INPUT=$(cat)
SESSION_ID=$(echo "$INPUT" | python3 -c "
import sys, json
try:
    d = json.load(sys.stdin)
    print(d.get('session_id', 'unknown'))
except Exception:
    print('unknown')
" 2>/dev/null || echo "unknown")

TIMESTAMP=$(date '+%Y-%m-%d %H:%M:%S')
echo "${TIMESTAMP} | session_start | session=${SESSION_ID} | project=OmniMarkIt" >> "$LOG_FILE"

exit 0
