# Mean Reversion Strategy

## Overview
Trade oversold/overbought conditions expecting price to revert to the mean (moving average). Buy dips in uptrends, sell rips in downtrends.

## Entry Criteria (Long)
- Price >= 2 standard deviations below 20-DMA (Bollinger Band touch)
- RSI <= 30 (oversold)
- Stock in a longer-term uptrend (above 200-DMA)
- No negative fundamental catalyst (earnings miss, downgrade)
- Increasing volume on the bounce candle

## Entry Criteria (Short)
- Price >= 2 standard deviations above 20-DMA
- RSI >= 70 (overbought)
- Stock in a longer-term downtrend (below 200-DMA)
- No positive fundamental catalyst

## Exit Criteria
- **Target:** Return to 20-DMA (mean)
- **Extended target:** Touch of opposite Bollinger Band
- **Stop-loss:** Beyond the extreme (below the oversold low / above the overbought high)
- **Time stop:** Exit if not reverting within 5 days

## Position Sizing
- Risk 0.75% of portfolio (tighter due to counter-trend nature)
- Smaller position sizes than momentum trades

## Best Conditions
- Range-bound or low-volatility markets
- High-quality, liquid stocks with mean-reverting tendencies
- Avoid in strong trending markets or during earnings

## Timeframe
- Day trade to short swing: 1-5 days
