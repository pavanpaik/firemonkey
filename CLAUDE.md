# FireMonkey — Financial Agent Suite

## Project Overview

FireMonkey is a multi-agent financial market analysis and trading intelligence suite built natively on Claude Code's ecosystem (MCP servers, skills, hooks, subagents).

## Architecture

- **Skills (Agents):** `.claude/skills/` — Each agent is a skill with its own SKILL.md
- **Rules:** `.claude/rules/` — Risk limits, trading conventions, security guardrails
- **Hooks:** `.claude/settings.json` — Automation, validation gates, audit logging
- **MCP Servers:** `.mcp.json` — Financial data sources (Alpha Vantage, Finnhub, Alpaca, etc.)
- **Scripts:** `scripts/` — Hook implementation scripts
- **Data:** `data/` — Portfolio state, trade history, watchlists
- **Strategies:** `strategies/` — Trading strategy definitions
- **Templates:** `templates/` — Report and proposal templates

## Available Agent Skills

| Skill | Command | Purpose |
|---|---|---|
| Market Analyst | `/market-analyst [TICKER]` | Technical + fundamental analysis |
| News & Sentiment | `/news-sentiment [TICKER]` | News aggregation and sentiment scoring |
| Trade Strategist | `/trade-strategist [TICKER] [DIRECTION] [TIMEFRAME]` | Trade setup generation |
| Risk Manager | `/risk-manager` | Trade and portfolio risk validation |
| Portfolio Manager | `/portfolio-manager` | Holdings, P&L, rebalancing |
| Trade Executor | `/trade-executor` | Order submission via Alpaca (paper trading) |
| Morning Brief | `/morning-brief` | Compound daily market overview |

## Key Conventions

- All prices in USD unless specified
- Percentages to 2 decimal places
- Dates in ISO 8601 (YYYY-MM-DD), times in ET
- Cross-reference at least 2 data sources for any analysis
- All trades require human confirmation — never auto-execute
- Paper trading mode by default (Alpaca paper endpoint)

## Risk Rules

See `.claude/rules/risk-limits.md` for complete rules. Key limits:
- Max position size: 5% of portfolio
- Max loss per trade: 1% of portfolio
- Required stop-loss on every position
- Max sector concentration: 25%
- Cash reserve minimum: 20%

## Build & Run

- No build step — this is a Claude Code native project
- MCP servers auto-connect via `.mcp.json`
- Required: Set API keys in environment (see `.env.example`)
- Start: Open project in Claude Code, skills auto-load
