# Momentum Breakout Strategy

## Overview
Trade stocks breaking out of consolidation patterns with increasing volume, riding the momentum in the direction of the breakout.

## Entry Criteria
- Price breaks above resistance (or below support for short)
- Volume on breakout day >= 1.5x average volume
- RSI between 50-70 (not overbought at entry)
- MACD histogram positive and increasing
- Price above 20-DMA and 50-DMA (long bias)

## Exit Criteria
- **Target:** 2-3x the height of the consolidation range
- **Stop-loss:** Below the breakout level (or below the consolidation low)
- **Trailing stop:** Move stop to breakeven after 1R profit, then trail 2x ATR

## Position Sizing
- Risk 1% of portfolio per trade
- Position size = Risk amount / (Entry - Stop)

## Best Conditions
- Works best in trending markets (VIX < 25)
- Strongest with sector rotation confirmation
- Avoid around major macro events (FOMC, NFP)

## Timeframe
- Swing: Hold 2-10 days
- Best entries: First 30 minutes or on daily close above resistance
