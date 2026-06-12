#!/bin/bash
# PreToolUse hook — blocks dangerous shell patterns before execution.
# Exit 0 = allow. Exit 2 = block (Claude Code shows the stderr message).

INPUT=$(cat)

# Only inspect Bash tool calls
TOOL_NAME=$(echo "$INPUT" | python3 -c "
import sys, json
try:
    d = json.load(sys.stdin)
    print(d.get('tool_name', ''))
except Exception:
    print('')
" 2>/dev/null)

[ "$TOOL_NAME" != "Bash" ] && exit 0

COMMAND=$(echo "$INPUT" | python3 -c "
import sys, json
try:
    d = json.load(sys.stdin)
    print(d.get('tool_input', {}).get('command', ''))
except Exception:
    print('')
" 2>/dev/null)

# Blocked patterns — add OmniMarkIt-specific ones as needed
BLOCKED=(
  "rm -rf /"
  "rm -rf ~"
  "rm -rf $HOME"
  ":(){ :|:& };:"
  "dd if=/dev/zero"
  "mkfs."
  "chmod -R 777 /"
  "git push --force origin main"
  "git push -f origin main"
  "git push --force origin master"
  "git push -f origin master"
  "DROP TABLE"
  "DROP DATABASE"
  "TRUNCATE TABLE"
  "DELETE FROM"
)

for pattern in "${BLOCKED[@]}"; do
  if echo "$COMMAND" | grep -qF "$pattern"; then
    echo "BLOCKED by pre-tool-use hook: dangerous pattern detected." >&2
    echo "Pattern: '$pattern'" >&2
    echo "Review the command and run it manually if intentional." >&2
    exit 2
  fi
done

exit 0
