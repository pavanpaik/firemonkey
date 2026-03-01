#!/usr/bin/env bash
# load-portfolio.sh — Load and display portfolio state on session start

set -euo pipefail

PORTFOLIO_FILE="data/portfolio-state.json"

if [[ -f "$PORTFOLIO_FILE" ]]; then
    echo "=== Portfolio State Loaded ==="
    cat "$PORTFOLIO_FILE"
else
    echo "=== No Portfolio State ==="
    echo "Run /portfolio-manager to initialize your portfolio tracking."
fi
