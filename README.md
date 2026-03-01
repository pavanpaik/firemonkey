# FireMonkey — Financial Agent Suite

A multi-agent financial market analysis and trading intelligence suite built natively on **Claude Code's** ecosystem — MCP servers, skills, hooks, subagents, and rules.

## Quick Start

1. **Clone and open in Claude Code:**
   ```bash
   cd firemonkey
   claude
   ```

2. **Set up API keys:**
   ```bash
   cp .env.example .env
   # Edit .env with your API keys
   ```

3. **Use the agents:**
   ```
   /market-analyst AAPL          # Technical + fundamental analysis
   /news-sentiment TSLA          # News and sentiment report
   /trade-strategist NVDA long swing  # Generate trade setup
   /risk-manager                  # Validate a trade proposal
   /portfolio-manager             # View holdings and P&L
   /trade-executor                # Execute an approved trade
   /morning-brief                 # Daily market overview
   ```

## Architecture

| Layer | Location | Purpose |
|-------|----------|---------|
| **Skills** | `.claude/skills/` | 7 specialist agent definitions |
| **Rules** | `.claude/rules/` | Risk limits, conventions, security |
| **Hooks** | `.claude/settings.json` | Automation, validation, audit |
| **MCP Servers** | `.mcp.json` | Financial data sources |
| **Strategies** | `strategies/` | Trading strategy playbooks |
| **Templates** | `templates/` | Report format standards |
| **Data** | `data/` | Portfolio state, history, watchlists |

## MCP Data Sources

| Server | Data |
|--------|------|
| Alpha Vantage | Real-time quotes, technicals, forex, crypto |
| Finnhub | 50+ indicators, news, ESG, insider trades |
| Financial Datasets | Financial statements, market news |
| Alpaca | Paper trading, order management |
| YFinance | Company overviews, analyst data |

## API Keys (Free Tiers Available)

- [Alpha Vantage](https://www.alphavantage.co/support/#api-key) — Free
- [Finnhub](https://finnhub.io/register) — Free
- [Alpaca](https://app.alpaca.markets/signup) — Free paper trading
- [Financial Datasets](https://financialdatasets.ai/) — Free tier

## Safety

- **Paper trading by default** — Alpaca is configured to paper endpoint
- **Human confirmation required** for all trade executions
- **Risk limits enforced** by hooks and the Risk Manager agent
- **Audit logging** of all trade activity
- **No secrets in code** — all credentials via environment variables

## License

MIT
