---
paths:
  - "**"
---

# Risk Management Rules

These rules are enforced by the Risk Manager agent and validated by hooks before trade execution.

## Per-Trade Limits
- Maximum position size: 5% of portfolio value
- Maximum loss per trade: 1% of portfolio value
- Required stop-loss on every position — no exceptions
- Minimum risk-reward ratio: 1:2
- No averaging down on losing positions without explicit approval

## Portfolio Limits
- Maximum single-sector concentration: 25%
- Maximum correlated positions: 3 (Pearson correlation > 0.7)
- Maximum portfolio drawdown trigger: 10% (halt all new trades until reviewed)
- Cash reserve minimum: 20% of portfolio value
- Maximum daily trades: 10 per session

## Execution Rules
- All trades require explicit human confirmation before submission
- No trading outside market hours except crypto and GTC orders
- Paper trading mode by default — ALPACA_BASE_URL must contain "paper"
- Live trading requires explicit environment variable override and user confirmation
- No market orders on low-liquidity assets (avg volume < 100K shares)

## Position Management
- Review all open positions daily
- Stop-loss orders must be submitted immediately after entry fill
- Trailing stops encouraged for profitable positions
- No holding through earnings without explicit approval

## Emergency Procedures
- If drawdown exceeds 10%: halt all new trades, review all positions
- If single position loss exceeds 2%: force review of stop-loss
- If VIX spikes above 30: reduce position sizes by 50%
