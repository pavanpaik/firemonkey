#!/usr/bin/env bash
# block-dangerous-commands.sh — PreToolUse hook for Bash
# Blocks dangerous shell commands that could cause data loss.

set -euo pipefail

INPUT=$(cat)

# Extract command if available
COMMAND=$(echo "$INPUT" | grep -oP '"command"\s*:\s*"[^"]*"' | head -1 | sed 's/"command"\s*:\s*"//;s/"$//' || echo "")

# Block patterns
BLOCKED_PATTERNS=(
    "rm -rf"
    "rm -fr"
    "DROP TABLE"
    "DROP DATABASE"
    "DELETE FROM"
    "TRUNCATE"
    "format "
    "mkfs"
    "> /dev/"
)

for pattern in "${BLOCKED_PATTERNS[@]}"; do
    if echo "$COMMAND" | grep -qi "$pattern"; then
        echo "BLOCKED: Dangerous command detected matching '$pattern'. This command is not allowed in FireMonkey." >&2
        exit 2
    fi
done

exit 0
