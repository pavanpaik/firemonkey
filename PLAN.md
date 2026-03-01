# FireMonkey — Financial Agent Suite Plan

## Executive Summary

**FireMonkey** is a native Claude Code multi-agent project for financial market analysis, trading intelligence, and portfolio management. It leverages Claude's openly available ecosystem — **MCP servers**, **skills**, **hooks**, **subagents**, and the **Agent SDK** — to build a production-grade suite of specialized financial agents that collaborate on market research, trade analysis, risk management, and execution.

---

## 1. Architecture Overview

```
┌─────────────────────────────────────────────────────────┐
│                    CLAUDE CODE SESSION                    │
│                                                          │
│  CLAUDE.md  ←  Project instructions & conventions        │
│  .mcp.json  ←  Financial data MCP servers                │
│                                                          │
│  ┌──────────────────────────────────────────────────┐   │
│  │             ORCHESTRATOR (Lead Agent)              │   │
│  │  Coordinates tasks, delegates to specialists       │   │
│  └─────────┬───────────┬──────────┬─────────────────┘   │
│            │           │          │                       │
│  ┌─────────▼──┐ ┌──────▼────┐ ┌──▼──────────┐          │
│  │  MARKET    │ │  TRADE    │ │   RISK      │          │
│  │  ANALYST   │ │  STRATEGIST│ │  MANAGER    │          │
│  │  Agent     │ │  Agent     │ │  Agent      │          │
│  └─────┬──────┘ └─────┬─────┘ └──────┬──────┘          │
│        │              │               │                  │
│  ┌─────▼──┐     ┌─────▼────┐   ┌─────▼──────┐          │
│  │ NEWS & │     │ PORTFOLIO│   │ COMPLIANCE │          │
│  │ SENTI- │     │ MANAGER  │   │ CHECKER    │          │
│  │ MENT   │     │ Agent    │   │ Agent      │          │
│  └────────┘     └──────────┘   └────────────┘          │
│                                                          │
│  ┌──────────────────────────────────────────────────┐   │
│  │           MCP SERVER LAYER (Data Sources)          │   │
│  │                                                    │   │
│  │  Alpha Vantage │ Finnhub │ Financial Datasets     │   │
│  │  Alpaca Broker │ YFinance │ Polygon │ LSEG        │   │
│  │  PostgreSQL    │ GitHub   │ Slack Notifications    │   │
│  └──────────────────────────────────────────────────┘   │
│                                                          │
│  ┌──────────────────────────────────────────────────┐   │
│  │                HOOKS LAYER                         │   │
│  │                                                    │   │
│  │  PreToolUse:  Trade validation gate                │   │
│  │  PostToolUse: Audit logging                        │   │
│  │  Stop:        Risk check before session end        │   │
│  │  SessionStart: Load portfolio state                │   │
│  └──────────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────────┘
```

---

## 2. MCP Servers — Data Layer

These are openly available MCP servers that provide the financial data backbone.

### 2.1 Market Data Servers

| MCP Server | Source | Transport | What It Provides | API Key Required |
|---|---|---|---|---|
| **Alpha Vantage** | [mcp.alphavantage.co](https://mcp.alphavantage.co/) | HTTP | Real-time & historical stock data, forex, crypto, technical indicators | Yes (free tier) |
| **Financial Datasets** | [github.com/financial-datasets/mcp-server](https://github.com/financial-datasets/mcp-server) | stdio | Income statements, balance sheets, cash flow, stock prices, market news | Yes |
| **Finnhub** | [github.com/cfdude/mcp-finnhub](https://github.com/cfdude/mcp-finnhub) | stdio | 50+ technical indicators, news sentiment, SEC filings, ESG scores, crypto, forex | Yes (free tier) |
| **YFinance Trader** | [mcpmarket.com/server/yfinance-trader-1](https://mcpmarket.com/server/yfinance-trader-1) | stdio | Stock quotes, company overviews, analyst recommendations, insider transactions | No |
| **LSEG (Refinitiv)** | [lseg.com](https://www.lseg.com/en/insights/supercharge-claudes-financial-skills-with-lseg-data) | HTTP | Institutional-grade: yield curves, FX spot rates, swap pricing, volatility surfaces | Yes (enterprise) |

### 2.2 Trading & Execution Servers

| MCP Server | Source | Transport | What It Provides | API Key Required |
|---|---|---|---|---|
| **Alpaca** | [github.com/alpacahq/alpaca-mcp-server](https://github.com/alpacahq/alpaca-mcp-server) | stdio | Live trading (stocks, ETFs, crypto, options), order management, position tracking | Yes (free paper trading) |

### 2.3 Infrastructure Servers

| MCP Server | Source | Transport | What It Provides |
|---|---|---|---|
| **PostgreSQL** | modelcontextprotocol/servers | stdio | Persist trade history, portfolio state, analytics |
| **GitHub** | modelcontextprotocol/servers | stdio | Version control for strategies, collaboration |
| **Slack** | modelcontextprotocol/servers | stdio | Alert notifications, trade confirmations |
| **Filesystem** | modelcontextprotocol/servers | stdio | Read/write local strategy files, configs |

### 2.4 .mcp.json Configuration

```json
{
  "mcpServers": {
    "alpha-vantage": {
      "type": "http",
      "url": "https://mcp.alphavantage.co/mcp",
      "note": "Real-time stock market data"
    },
    "financial-datasets": {
      "type": "stdio",
      "command": "npx",
      "args": ["-y", "@financial-datasets/mcp-server"],
      "env": {
        "FINANCIAL_DATASETS_API_KEY": "${FINANCIAL_DATASETS_API_KEY}"
      }
    },
    "finnhub": {
      "type": "stdio",
      "command": "npx",
      "args": ["-y", "mcp-finnhub"],
      "env": {
        "FINNHUB_API_KEY": "${FINNHUB_API_KEY}"
      }
    },
    "alpaca": {
      "type": "stdio",
      "command": "npx",
      "args": ["-y", "@alpacahq/alpaca-mcp-server"],
      "env": {
        "ALPACA_API_KEY": "${ALPACA_API_KEY}",
        "ALPACA_API_SECRET": "${ALPACA_API_SECRET}",
        "ALPACA_BASE_URL": "https://paper-api.alpaca.markets"
      }
    },
    "yfinance": {
      "type": "stdio",
      "command": "uvx",
      "args": ["yfinance-mcp-server"]
    },
    "postgres": {
      "type": "stdio",
      "command": "npx",
      "args": ["-y", "@modelcontextprotocol/server-postgres"],
      "env": {
        "DATABASE_URL": "${DATABASE_URL}"
      }
    }
  }
}
```

---

## 3. Agent Definitions — Specialist Agents

### 3.1 Market Analyst Agent

**Purpose:** Gather and analyze market data, identify trends, and produce research reports.

**File:** `.claude/skills/market-analyst/SKILL.md`

```yaml
---
name: market-analyst
description: Analyzes market conditions, trends, price action, and fundamentals for any ticker or sector
argument-hint: "[TICKER or SECTOR]"
allowed-tools: Read, Grep, Glob, Bash
model: sonnet
user-invocable: true
context: fork
---
```

**Capabilities:**
- Fetch real-time quotes, historical OHLCV data via Alpha Vantage / Finnhub / YFinance MCP
- Run technical analysis: RSI, MACD, Bollinger Bands, moving averages (50+ indicators via Finnhub)
- Retrieve fundamental data: income statements, balance sheets, cash flow (Financial Datasets MCP)
- Analyze SEC filings and insider transactions
- Generate structured market reports with buy/sell/hold signals

**Invocation:** `/market-analyst AAPL` or `/market-analyst technology sector`

---

### 3.2 News & Sentiment Agent

**Purpose:** Monitor news feeds and social sentiment for actionable trading signals.

**File:** `.claude/skills/news-sentiment/SKILL.md`

```yaml
---
name: news-sentiment
description: Monitors financial news, social media sentiment, and event-driven catalysts
argument-hint: "[TICKER or TOPIC]"
allowed-tools: Read, Bash, Grep, Glob, WebSearch
model: sonnet
user-invocable: true
context: fork
---
```

**Capabilities:**
- Aggregate financial news via Finnhub news sentiment API
- Web search for breaking news and earnings announcements
- ESG score analysis and controversy tracking (Finnhub alternative data)
- Insider transaction monitoring
- Sentiment scoring: bullish / bearish / neutral with confidence levels

**Invocation:** `/news-sentiment TSLA` or `/news-sentiment "Fed rate decision"`

---

### 3.3 Trade Strategist Agent

**Purpose:** Formulate trade ideas with entry/exit criteria, position sizing, and risk parameters.

**File:** `.claude/skills/trade-strategist/SKILL.md`

```yaml
---
name: trade-strategist
description: Generates actionable trade strategies with entry, exit, stop-loss, and position sizing
argument-hint: "[TICKER] [DIRECTION long/short] [TIMEFRAME]"
allowed-tools: Read, Bash, Grep, Glob
model: opus
user-invocable: true
context: fork
---
```

**Capabilities:**
- Combine technical + fundamental + sentiment analysis from other agents
- Generate specific trade setups: entry price, target, stop-loss, R:R ratio
- Position sizing based on portfolio risk tolerance (Kelly criterion, fixed fractional)
- Backtesting against historical data
- Multi-timeframe analysis (intraday, swing, position)

**Invocation:** `/trade-strategist NVDA long swing`

---

### 3.4 Risk Manager Agent

**Purpose:** Validate all trade proposals against risk rules and portfolio constraints.

**File:** `.claude/skills/risk-manager/SKILL.md`

```yaml
---
name: risk-manager
description: Validates trades for risk limits, portfolio correlation, drawdown rules, and compliance
argument-hint: "[trade proposal or portfolio review]"
allowed-tools: Read, Bash, Grep, Glob
model: sonnet
user-invocable: true
context: fork
---
```

**Capabilities:**
- Portfolio-level risk: max drawdown, sector concentration, correlation matrix
- Per-trade risk: max position size (% of portfolio), max loss per trade
- Check against user-defined risk rules in `.claude/rules/risk-limits.md`
- VaR (Value at Risk) estimation
- Margin requirement validation
- APPROVE / REJECT / MODIFY decision with reasoning

**Invocation:** `/risk-manager` (auto-invoked before trade execution via hooks)

---

### 3.5 Portfolio Manager Agent

**Purpose:** Track current holdings, P&L, and rebalancing opportunities.

**File:** `.claude/skills/portfolio-manager/SKILL.md`

```yaml
---
name: portfolio-manager
description: Tracks portfolio holdings, P&L, allocation, and rebalancing recommendations
allowed-tools: Read, Bash, Grep, Glob, Edit
model: sonnet
user-invocable: true
context: fork
---
```

**Capabilities:**
- Fetch current positions and account balance from Alpaca MCP
- Calculate portfolio metrics: total return, Sharpe ratio, max drawdown
- Sector/asset allocation analysis
- Rebalancing recommendations based on target allocation
- Daily P&L summary generation
- Persist portfolio snapshots to local data store

**Invocation:** `/portfolio-manager`

---

### 3.6 Trade Executor Agent

**Purpose:** Execute approved trades through the broker API with proper safeguards.

**File:** `.claude/skills/trade-executor/SKILL.md`

```yaml
---
name: trade-executor
description: Executes approved trades via Alpaca broker with confirmation and logging
argument-hint: "[approved trade details]"
allowed-tools: Read, Bash, Grep, Glob, Edit
model: sonnet
user-invocable: true
context: fork
---
```

**Capabilities:**
- Submit market / limit / stop orders via Alpaca MCP
- Order confirmation flow (always requires human approval via hooks)
- Order status monitoring and fill reporting
- Trade logging to local audit trail
- Cancel/modify open orders

**Safety:** All trade executions require explicit human confirmation via a `PreToolUse` hook.

**Invocation:** `/trade-executor` (typically called by orchestrator after risk approval)

---

## 4. Hooks — Safety, Automation & Audit

### 4.1 Hooks Configuration

**File:** `.claude/settings.json`

```json
{
  "hooks": {
    "SessionStart": [
      {
        "matcher": "startup",
        "hooks": [
          {
            "type": "command",
            "command": "cat data/portfolio-state.json 2>/dev/null || echo '{\"status\": \"no portfolio loaded\"}'",
            "timeout": 5
          }
        ]
      }
    ],
    "PreToolUse": [
      {
        "matcher": "trade-executor",
        "hooks": [
          {
            "type": "command",
            "command": "scripts/validate-trade.sh",
            "timeout": 10
          }
        ]
      },
      {
        "matcher": "Bash",
        "hooks": [
          {
            "type": "command",
            "command": "scripts/block-dangerous-commands.sh",
            "timeout": 5
          }
        ]
      }
    ],
    "PostToolUse": [
      {
        "matcher": "trade-executor",
        "hooks": [
          {
            "type": "command",
            "command": "scripts/log-trade.sh",
            "timeout": 10
          }
        ]
      }
    ],
    "Stop": [
      {
        "hooks": [
          {
            "type": "prompt",
            "prompt": "Before ending: Are there any open orders that need monitoring or risk exposures that need attention? Respond {\"ok\": true} if clear, or {\"ok\": false, \"reason\": \"details\"} if action needed."
          }
        ]
      }
    ]
  }
}
```

### 4.2 Hook Behaviors

| Hook Event | Trigger | Action |
|---|---|---|
| `SessionStart` | Session opens | Load portfolio state, check market hours, display account summary |
| `PreToolUse` (trade-executor) | Before any trade | Validate risk limits, require human confirmation, check market hours |
| `PreToolUse` (Bash) | Before shell commands | Block dangerous commands (rm -rf, DROP TABLE, etc.) |
| `PostToolUse` (trade-executor) | After trade executes | Log trade to audit file, update portfolio state, notify via Slack |
| `Stop` | Session ending | Check for orphaned orders, summarize session activity |

---

## 5. Rules — Guardrails & Conventions

### 5.1 Risk Limits

**File:** `.claude/rules/risk-limits.md`

```markdown
---
paths:
  - "**"
---

# Risk Management Rules

## Per-Trade Limits
- Maximum position size: 5% of portfolio value
- Maximum loss per trade: 1% of portfolio value
- Required stop-loss on every position
- Minimum risk-reward ratio: 1:2

## Portfolio Limits
- Maximum sector concentration: 25%
- Maximum correlated positions: 3 (correlation > 0.7)
- Maximum drawdown trigger: 10% (halt all new trades)
- Cash reserve minimum: 20% of portfolio

## Execution Rules
- All trades require human confirmation
- No trading outside market hours (except crypto)
- Paper trading mode by default (set ALPACA_BASE_URL to paper endpoint)
- Maximum 10 trades per session
```

### 5.2 Trading Conventions

**File:** `.claude/rules/trading-conventions.md`

```markdown
---
paths:
  - ".claude/skills/**"
---

# Trading Conventions

## Report Format
All market analysis reports must include:
1. Ticker / Asset identification
2. Current price and % change
3. Technical setup (support/resistance, indicators)
4. Fundamental summary (if equity)
5. Sentiment score (bullish/bearish/neutral)
6. Risk factors
7. Recommended action with confidence level

## Data Sources
- Always cross-reference at least 2 data sources
- Prefer real-time data over cached/stale data
- Timestamp all data points
- Note data source in reports

## Notation
- Prices in USD unless specified
- Percentages to 2 decimal places
- Dates in ISO 8601 (YYYY-MM-DD)
- Times in ET (Eastern Time) for US markets
```

---

## 6. Project Directory Structure

```
firemonkey/
├── CLAUDE.md                          # Project-level instructions
├── CLAUDE.local.md                    # Local overrides (API keys, preferences)
├── .mcp.json                          # MCP server configurations (shared)
├── .claude/
│   ├── settings.json                  # Hooks, permissions, project settings
│   ├── settings.local.json            # Local settings (not committed)
│   ├── skills/                        # Agent skill definitions
│   │   ├── market-analyst/
│   │   │   └── SKILL.md
│   │   ├── news-sentiment/
│   │   │   └── SKILL.md
│   │   ├── trade-strategist/
│   │   │   └── SKILL.md
│   │   ├── risk-manager/
│   │   │   └── SKILL.md
│   │   ├── portfolio-manager/
│   │   │   └── SKILL.md
│   │   ├── trade-executor/
│   │   │   └── SKILL.md
│   │   └── morning-brief/
│   │       └── SKILL.md
│   └── rules/                         # Guardrails & conventions
│       ├── risk-limits.md
│       ├── trading-conventions.md
│       └── security.md
├── scripts/                           # Hook scripts
│   ├── validate-trade.sh
│   ├── log-trade.sh
│   ├── block-dangerous-commands.sh
│   └── load-portfolio.sh
├── data/                              # Local data store
│   ├── portfolio-state.json
│   ├── trade-history.json
│   └── watchlists/
│       ├── default.json
│       └── earnings-calendar.json
├── strategies/                        # Trading strategy definitions
│   ├── momentum.md
│   ├── mean-reversion.md
│   └── earnings-play.md
├── templates/                         # Report templates
│   ├── market-report.md
│   ├── trade-proposal.md
│   └── daily-summary.md
├── .env.example                       # Required environment variables
├── .gitignore
├── package.json                       # For npx MCP server dependencies
└── README.md
```

---

## 7. Workflows — How the Agents Collaborate

### 7.1 Morning Market Brief (Daily Workflow)

```
User: /morning-brief

  1. Market Analyst → Fetch pre-market data, overnight moves, futures
  2. News Sentiment → Scan overnight news, earnings, macro events
  3. Portfolio Manager → Current holdings, overnight P&L, margin status
  4. Trade Strategist → Today's watchlist, key levels, potential setups
  5. Orchestrator → Compile into structured morning brief
```

### 7.2 Trade Idea → Execution (End-to-End)

```
User: "Analyze NVDA for a swing trade opportunity"

  1. Market Analyst → Technical + fundamental analysis on NVDA
  2. News Sentiment → Recent news, earnings sentiment, insider activity
  3. Trade Strategist → Formulate trade setup (entry, target, stop)
  4. Risk Manager → Validate against portfolio limits
     ├── APPROVED → Proceed to execution
     └── REJECTED → Return with reason, suggest modifications
  5. Trade Executor → Present order for human confirmation
  6. [Human approves] → Submit order to Alpaca
  7. PostToolUse hook → Log trade, update portfolio, notify Slack
```

### 7.3 Risk Alert (Automated Monitoring)

```
SessionStart hook → Load portfolio state

  1. Portfolio Manager → Check current positions against stop-losses
  2. Risk Manager → Evaluate portfolio-level metrics
     ├── ALL CLEAR → Continue session
     └── ALERT → Flag positions breaching limits
  3. If alert → Suggest hedging or position reduction
```

---

## 8. Available MCP Server Discovery

All servers referenced come from these public registries:

| Registry | URL | Description |
|---|---|---|
| **Official MCP Registry** | [registry.modelcontextprotocol.io](https://registry.modelcontextprotocol.io/) | Authoritative, community-owned |
| **GitHub MCP Servers** | [github.com/modelcontextprotocol/servers](https://github.com/modelcontextprotocol/servers) | Reference implementations |
| **MCP.so** | [mcp.so](https://mcp.so/) | Discovery & search |
| **Claude MCP Directory** | [claudemcp.org](https://www.claudemcp.org/) | Curated directory |
| **MCPServers.org** | [mcpservers.org](https://mcpservers.org/) | Community catalog |
| **LobeHub MCP** | [lobehub.com/mcp](https://lobehub.com/mcp) | Marketplace |

---

## 9. Agent SDK Integration (Programmatic)

For automation and CI/CD beyond interactive Claude Code sessions, use the **Claude Agent SDK**:

```python
# Example: Automated morning brief via Agent SDK
from claude_agent_sdk import Agent, Session

market_agent = Agent(
    name="market-analyst",
    model="sonnet",
    tools=["mcp:alpha-vantage", "mcp:finnhub", "read", "grep"],
    instructions_file=".claude/skills/market-analyst/SKILL.md"
)

sentiment_agent = Agent(
    name="news-sentiment",
    model="sonnet",
    tools=["mcp:finnhub", "web_search", "read"],
    instructions_file=".claude/skills/news-sentiment/SKILL.md"
)

# Run in parallel
with Session(setting_sources=["project"]) as session:
    market_result = session.run(market_agent, "Analyze pre-market conditions")
    sentiment_result = session.run(sentiment_agent, "Today's key news catalysts")
    brief = session.synthesize([market_result, sentiment_result])
```

---

## 10. Implementation Phases

### Phase 1 — Foundation (Current Sprint)
- [x] Project plan
- [ ] Directory structure and scaffolding
- [ ] CLAUDE.md with project conventions
- [ ] .mcp.json with core data servers (Alpha Vantage, Finnhub, YFinance)
- [ ] First 3 skills: market-analyst, news-sentiment, portfolio-manager
- [ ] Basic hooks: session start, trade validation
- [ ] Risk rules

### Phase 2 — Trading Pipeline
- [ ] Trade strategist skill
- [ ] Risk manager skill with full validation logic
- [ ] Trade executor skill with Alpaca paper trading
- [ ] Audit logging hooks
- [ ] Trade proposal and execution templates

### Phase 3 — Automation & Intelligence
- [ ] Morning brief compound skill
- [ ] Watchlist management
- [ ] Backtesting integration
- [ ] Strategy library (momentum, mean-reversion, earnings plays)
- [ ] Agent SDK scripts for scheduled automation

### Phase 4 — Production Hardening
- [ ] Agent Teams for parallel research workflows
- [ ] PostgreSQL MCP for persistent storage
- [ ] Slack MCP for notifications
- [ ] Comprehensive test suite
- [ ] Security audit and compliance rules
- [ ] Documentation and README

---

## 11. Environment Variables Required

```bash
# .env.example
ALPHA_VANTAGE_API_KEY=       # Free: https://www.alphavantage.co/support/#api-key
FINNHUB_API_KEY=             # Free: https://finnhub.io/register
FINANCIAL_DATASETS_API_KEY=  # https://financialdatasets.ai/
ALPACA_API_KEY=              # Free paper: https://app.alpaca.markets/signup
ALPACA_API_SECRET=
ALPACA_BASE_URL=https://paper-api.alpaca.markets  # Paper trading (safe)
DATABASE_URL=                # Optional: PostgreSQL for persistence
SLACK_WEBHOOK_URL=           # Optional: Trade notifications
```

---

*This plan uses only openly available, community MCP servers and Claude's native skill/hook/agent infrastructure. No proprietary dependencies required.*
