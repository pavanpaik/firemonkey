---
paths:
  - "**"
---

# Security Rules

## API Key Protection
- NEVER log, display, or commit API keys or secrets
- All sensitive credentials must be in environment variables, never in files
- `.env` files must be in `.gitignore`
- Reject any request to display ALPACA_API_SECRET or similar

## Trade Safety
- Paper trading by default — verify ALPACA_BASE_URL contains "paper"
- Never switch to live trading without explicit multi-step confirmation
- All order submissions require human approval
- No batch order submission without individual review

## Data Safety
- Do not store personal financial data in committed files
- `data/` directory should be in `.gitignore` for sensitive data
- Sanitize any data before including in reports that might be shared

## Command Safety
- Block destructive shell commands (rm -rf, DROP TABLE, etc.)
- No execution of downloaded scripts without review
- No outbound network calls except to configured MCP servers
