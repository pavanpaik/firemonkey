#!/usr/bin/env bash
# log-trade.sh — PostToolUse hook for trade-executor
# Logs trade execution details to the trade history file.

set -euo pipefail

HISTORY_FILE="data/trade-history.json"
TIMESTAMP=$(date -u +"%Y-%m-%dT%H:%M:%SZ")

# Ensure data directory exists
mkdir -p data

# Initialize history file if it doesn't exist
if [[ ! -f "$HISTORY_FILE" ]]; then
    echo '{"trades": []}' > "$HISTORY_FILE"
fi

# Read tool output from stdin
INPUT=$(cat)

# Append a log entry with timestamp
TEMP_FILE=$(mktemp)
if command -v jq &> /dev/null; then
    jq --arg ts "$TIMESTAMP" --arg input "$INPUT" \
        '.trades += [{"timestamp": $ts, "details": $input}]' \
        "$HISTORY_FILE" > "$TEMP_FILE" && mv "$TEMP_FILE" "$HISTORY_FILE"
else
    # Fallback: simple append if jq not available
    echo "{\"timestamp\": \"$TIMESTAMP\", \"event\": \"trade_executed\"}" >> "${HISTORY_FILE}.log"
fi

echo "Trade logged at $TIMESTAMP"
exit 0
