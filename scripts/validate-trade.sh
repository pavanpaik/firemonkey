#!/usr/bin/env bash
# validate-trade.sh — PreToolUse hook for trade-executor
# Reads trade details from stdin (JSON), validates basic safety checks.
# Exit 0 = proceed, Exit 2 = block with reason in stderr.

set -euo pipefail

INPUT=$(cat)

# Safety check: Ensure we're in paper trading mode
ALPACA_URL="${ALPACA_BASE_URL:-}"
if [[ -n "$ALPACA_URL" ]] && [[ "$ALPACA_URL" != *"paper"* ]]; then
    echo "BLOCKED: Live trading detected. ALPACA_BASE_URL does not contain 'paper'. Set ALPACA_BASE_URL=https://paper-api.alpaca.markets for paper trading." >&2
    exit 2
fi

# Safety check: Verify portfolio state exists
if [[ ! -f "data/portfolio-state.json" ]]; then
    echo "WARNING: No portfolio state found at data/portfolio-state.json. Run /portfolio-manager first." >&2
    # Don't block, just warn
fi

# All checks passed
exit 0
