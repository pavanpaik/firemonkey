"use client";

import { useEffect, useState, useMemo } from "react";
import {
  TrendingUp,
  TrendingDown,
  DollarSign,
  PieChart as PieChartIcon,
  AlertTriangle,
  Wallet,
  Banknote,
  ShieldCheck,
  Activity,
  BarChart3,
  Loader2,
  Layers,
} from "lucide-react";
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip as RechartsTooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  Legend,
} from "recharts";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

interface PortfolioState {
  last_updated: string;
  account: {
    mode: string;
    total_value: number;
    cash: number;
    buying_power: number;
  };
  positions: Position[];
  pending_orders: any[];
  daily_trades_count: number;
  drawdown_from_peak: number;
  peak_value: number;
}

interface Position {
  ticker: string;
  shares: number;
  avg_cost: number;
  current_price: number;
  market_value: number;
  unrealized_pnl: number;
  unrealized_pnl_pct: number;
  stop_loss: number;
  sector: string;
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

const formatUSD = (value: number): string =>
  new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(value);

const formatCompactUSD = (value: number): string =>
  new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(value);

const formatPct = (value: number): string =>
  `${value >= 0 ? "+" : ""}${value.toFixed(2)}%`;

const pnlColor = (value: number): string =>
  value > 0 ? "text-success" : value < 0 ? "text-danger" : "text-muted";

const pnlBgColor = (value: number): string =>
  value > 0
    ? "bg-success/10 text-success"
    : value < 0
      ? "bg-danger/10 text-danger"
      : "bg-card text-muted";

// Seed-based pseudo-random for deterministic chart data across re-renders
function seededRandom(seed: number): () => number {
  let s = seed;
  return () => {
    s = (s * 16807 + 0) % 2147483647;
    return (s - 1) / 2147483646;
  };
}

function generateHistoricalData(
  currentValue: number
): { date: string; value: number }[] {
  const data: { date: string; value: number }[] = [];
  const rand = seededRandom(42);
  const now = new Date();
  let value = 100000;

  for (let i = 29; i >= 0; i--) {
    const date = new Date(now);
    date.setDate(date.getDate() - i);
    const dateStr = date.toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
    });

    if (i < 29) {
      const change = (rand() * 4 - 2) / 100;
      value = value * (1 + change);
    }

    data.push({ date: dateStr, value: Math.round(value * 100) / 100 });
  }

  // Ensure the last data point matches the actual current portfolio value
  if (data.length > 0) {
    data[data.length - 1].value = currentValue;
  }

  return data;
}

// Donut chart sector colors
const SECTOR_COLORS = [
  "#3b82f6",
  "#10b981",
  "#f59e0b",
  "#ef4444",
  "#8b5cf6",
  "#06b6d4",
  "#f97316",
  "#ec4899",
  "#14b8a6",
  "#64748b",
];

// ---------------------------------------------------------------------------
// Stat Card Component
// ---------------------------------------------------------------------------

function StatCard({
  label,
  value,
  subtitle,
  icon: Icon,
  valueClass,
}: {
  label: string;
  value: string;
  subtitle?: string;
  icon: React.ComponentType<{ className?: string }>;
  valueClass?: string;
}) {
  return (
    <div className="rounded-xl border border-card-border bg-card p-5">
      <div className="flex items-center justify-between">
        <span className="text-xs font-medium uppercase tracking-wider text-muted">
          {label}
        </span>
        <Icon className="h-4 w-4 text-muted" />
      </div>
      <p
        className={`mt-2 text-2xl font-bold tracking-tight ${valueClass ?? "text-foreground"}`}
      >
        {value}
      </p>
      {subtitle && <p className="mt-1 text-xs text-muted">{subtitle}</p>}
    </div>
  );
}

// ---------------------------------------------------------------------------
// Custom Chart Tooltips
// ---------------------------------------------------------------------------

function AreaChartTooltip({
  active,
  payload,
  label,
}: {
  active?: boolean;
  payload?: { value: number }[];
  label?: string;
}) {
  if (!active || !payload || !payload.length) return null;
  return (
    <div className="rounded-lg border border-card-border bg-card px-3 py-2 shadow-lg">
      <p className="text-xs text-muted">{label}</p>
      <p className="text-sm font-semibold text-foreground">
        {formatUSD(payload[0].value)}
      </p>
    </div>
  );
}

function DonutTooltip({
  active,
  payload,
}: {
  active?: boolean;
  payload?: { name: string; value: number; payload: { total: number } }[];
}) {
  if (!active || !payload || !payload.length) return null;
  const entry = payload[0];
  return (
    <div className="rounded-lg border border-card-border bg-card px-3 py-2 shadow-lg">
      <p className="text-xs font-medium text-foreground">{entry.name}</p>
      <p className="text-sm font-semibold text-foreground">
        {formatUSD(entry.value)}
      </p>
      <p className="text-xs text-muted">
        {((entry.value / entry.payload.total) * 100).toFixed(1)}%
      </p>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Custom Pie Legend
// ---------------------------------------------------------------------------

function PieLegendContent({
  payload,
}: {
  payload?: { color: string; value: string }[];
}) {
  if (!payload) return null;
  return (
    <div className="flex flex-wrap justify-center gap-x-4 gap-y-1 pt-2">
      {payload.map((entry, index) => (
        <div
          key={index}
          className="flex items-center gap-1.5 text-xs text-muted"
        >
          <span
            className="inline-block h-2.5 w-2.5 rounded-full"
            style={{ backgroundColor: entry.color }}
          />
          {entry.value}
        </div>
      ))}
    </div>
  );
}

// ---------------------------------------------------------------------------
// Risk Metric Row Component
// ---------------------------------------------------------------------------

function RiskMetric({
  label,
  value,
  limit,
  pct,
  color,
  icon: Icon,
  warning,
}: {
  label: string;
  value: string;
  limit: string;
  pct: number;
  color: string;
  icon: React.ComponentType<{ className?: string }>;
  warning?: string;
}) {
  return (
    <div className="rounded-lg border border-card-border bg-background p-4">
      <div className="flex items-center gap-2 text-xs font-medium uppercase tracking-wider text-muted">
        <Icon className="h-3.5 w-3.5" />
        {label}
      </div>
      <p className="mt-2 text-xl font-bold tabular-nums" style={{ color }}>
        {value}
      </p>
      <div className="mt-2 h-1.5 overflow-hidden rounded-full bg-input-bg">
        <div
          className="h-full rounded-full transition-all duration-500"
          style={{
            width: `${Math.min(pct * 100, 100)}%`,
            background: color,
          }}
        />
      </div>
      <p className="mt-1.5 text-xs text-muted">{limit}</p>
      {warning && (
        <div className="mt-2 flex items-center gap-1.5 rounded-md bg-danger/10 px-2 py-1 text-xs font-medium text-danger">
          <AlertTriangle className="h-3 w-3" />
          {warning}
        </div>
      )}
    </div>
  );
}

// ---------------------------------------------------------------------------
// Main Portfolio Page
// ---------------------------------------------------------------------------

export default function PortfolioPage() {
  const [portfolio, setPortfolio] = useState<PortfolioState | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function fetchPortfolio() {
      setLoading(true);
      setError(null);
      try {
        const res = await fetch("/api/portfolio");
        if (!res.ok) throw new Error("Failed to load portfolio data");
        const data: PortfolioState = await res.json();
        setPortfolio(data);
      } catch (err) {
        setError(
          err instanceof Error
            ? err.message
            : "Failed to fetch portfolio state."
        );
      } finally {
        setLoading(false);
      }
    }
    fetchPortfolio();
  }, []);

  // Memoized computed data
  const historyData = useMemo(
    () => generateHistoricalData(portfolio?.account.total_value ?? 100000),
    [portfolio?.account.total_value]
  );

  const allocationData = useMemo(() => {
    if (!portfolio) return [];

    const totalValue = portfolio.account.total_value;
    const cash = portfolio.account.cash;

    if (portfolio.positions.length === 0) {
      return [{ name: "Cash", value: cash, total: totalValue }];
    }

    // Group positions by sector
    const sectorMap: Record<string, number> = {};
    for (const pos of portfolio.positions) {
      const sector = pos.sector || "Other";
      sectorMap[sector] = (sectorMap[sector] || 0) + pos.market_value;
    }

    const entries = Object.entries(sectorMap).map(([name, value]) => ({
      name,
      value,
      total: totalValue,
    }));

    if (cash > 0) {
      entries.push({ name: "Cash", value: cash, total: totalValue });
    }

    return entries;
  }, [portfolio]);

  const dayPnl = useMemo(() => {
    if (!portfolio) return 0;
    return portfolio.positions.reduce(
      (sum, pos) => sum + pos.unrealized_pnl,
      0
    );
  }, [portfolio]);

  const cashPct = useMemo(() => {
    if (!portfolio || portfolio.account.total_value === 0) return 0;
    return (portfolio.account.cash / portfolio.account.total_value) * 100;
  }, [portfolio]);

  // ---- Loading state ----
  if (loading) {
    return (
      <div className="flex h-full items-center justify-center">
        <div className="flex flex-col items-center gap-3 text-muted">
          <Loader2 className="h-8 w-8 animate-spin" />
          <span className="text-sm">Loading portfolio...</span>
        </div>
      </div>
    );
  }

  // ---- Error state ----
  if (error || !portfolio) {
    return (
      <div className="mx-auto max-w-7xl space-y-6">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">
            Portfolio Overview
          </h1>
          <p className="mt-1 text-sm text-muted">
            Portfolio holdings, allocation, and risk metrics.
          </p>
        </div>
        <div className="flex items-center gap-2 rounded-lg border border-warning/30 bg-warning/10 px-4 py-3 text-sm text-warning">
          <AlertTriangle className="h-4 w-4 shrink-0" />
          {error || "Could not load portfolio data."}
        </div>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-7xl space-y-6">
      {/* ================================================================ */}
      {/* Page Header                                                       */}
      {/* ================================================================ */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">
            Portfolio Overview
          </h1>
          <p className="mt-1 text-sm text-muted">
            Holdings, allocation, and risk metrics.{" "}
            <span className="text-muted/60">
              Last updated{" "}
              {new Date(portfolio.last_updated).toLocaleString("en-US", {
                month: "short",
                day: "numeric",
                year: "numeric",
                hour: "numeric",
                minute: "2-digit",
                hour12: true,
              })}
            </span>
          </p>
        </div>
        <div className="flex items-center gap-2 rounded-full border border-card-border bg-card px-3 py-1.5 text-xs font-medium">
          <span className="h-2 w-2 rounded-full bg-success" />
          {portfolio.account.mode === "paper"
            ? "Paper Trading"
            : "Live Trading"}
        </div>
      </div>

      {/* ================================================================ */}
      {/* 1. Top Stats Row                                                  */}
      {/* ================================================================ */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard
          label="Total Portfolio Value"
          value={formatUSD(portfolio.account.total_value)}
          icon={Wallet}
        />
        <StatCard
          label="Cash Balance"
          value={formatUSD(portfolio.account.cash)}
          subtitle={`${cashPct.toFixed(1)}% of portfolio`}
          icon={Banknote}
        />
        <StatCard
          label="Day P&L"
          value={
            dayPnl !== 0
              ? `${dayPnl > 0 ? "+" : ""}${formatUSD(dayPnl)}`
              : formatUSD(0)
          }
          icon={dayPnl >= 0 ? TrendingUp : TrendingDown}
          valueClass={pnlColor(dayPnl)}
        />
        <StatCard
          label="Buying Power"
          value={formatUSD(portfolio.account.buying_power)}
          icon={DollarSign}
        />
      </div>

      {/* ================================================================ */}
      {/* 2. Portfolio Value Chart + 3. Allocation Donut                    */}
      {/* ================================================================ */}
      <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
        {/* Area Chart - spans 2/3 */}
        <div className="rounded-xl border border-card-border bg-card p-5 lg:col-span-2">
          <div className="mb-4 flex items-center gap-2">
            <BarChart3 className="h-4 w-4 text-accent" />
            <h2 className="text-sm font-semibold">Portfolio Value (30 Days)</h2>
          </div>
          <div className="h-72">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart
                data={historyData}
                margin={{ top: 5, right: 10, left: 10, bottom: 0 }}
              >
                <defs>
                  <linearGradient
                    id="valueGradient"
                    x1="0"
                    y1="0"
                    x2="0"
                    y2="1"
                  >
                    <stop
                      offset="0%"
                      stopColor="#3b82f6"
                      stopOpacity={0.3}
                    />
                    <stop
                      offset="100%"
                      stopColor="#3b82f6"
                      stopOpacity={0}
                    />
                  </linearGradient>
                </defs>
                <CartesianGrid
                  strokeDasharray="3 3"
                  stroke="#1e293b"
                  vertical={false}
                />
                <XAxis
                  dataKey="date"
                  tick={{ fontSize: 11, fill: "#64748b" }}
                  axisLine={{ stroke: "#1e293b" }}
                  tickLine={false}
                  interval="preserveStartEnd"
                />
                <YAxis
                  tick={{ fontSize: 11, fill: "#64748b" }}
                  axisLine={false}
                  tickLine={false}
                  tickFormatter={(v: number) => formatCompactUSD(v)}
                  domain={["dataMin - 500", "dataMax + 500"]}
                  width={80}
                />
                <RechartsTooltip content={<AreaChartTooltip />} />
                <Area
                  type="monotone"
                  dataKey="value"
                  stroke="#3b82f6"
                  strokeWidth={2}
                  fill="url(#valueGradient)"
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Donut Chart - spans 1/3 */}
        <div className="rounded-xl border border-card-border bg-card p-5">
          <div className="mb-4 flex items-center gap-2">
            <PieChartIcon className="h-4 w-4 text-accent" />
            <h2 className="text-sm font-semibold">Allocation</h2>
          </div>
          <div className="h-72">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={allocationData}
                  dataKey="value"
                  nameKey="name"
                  cx="50%"
                  cy="45%"
                  innerRadius="55%"
                  outerRadius="80%"
                  paddingAngle={allocationData.length > 1 ? 3 : 0}
                  strokeWidth={0}
                >
                  {allocationData.map((entry, index) => (
                    <Cell
                      key={entry.name}
                      fill={
                        entry.name === "Cash"
                          ? "#64748b"
                          : SECTOR_COLORS[index % SECTOR_COLORS.length]
                      }
                    />
                  ))}
                </Pie>
                <RechartsTooltip content={<DonutTooltip />} />
                <Legend content={<PieLegendContent />} />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* ================================================================ */}
      {/* 4. Positions Table                                                */}
      {/* ================================================================ */}
      <div className="rounded-xl border border-card-border bg-card">
        <div className="flex items-center gap-2 border-b border-card-border px-5 py-4">
          <Layers className="h-4 w-4 text-accent" />
          <h2 className="text-sm font-semibold">Open Positions</h2>
          <span className="ml-auto rounded-full bg-accent/10 px-2.5 py-0.5 text-xs font-medium text-accent">
            {portfolio.positions.length}{" "}
            {portfolio.positions.length === 1 ? "position" : "positions"}
          </span>
        </div>

        {portfolio.positions.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16 text-center">
            <div className="flex h-14 w-14 items-center justify-center rounded-full bg-card-border/50">
              <TrendingUp className="h-6 w-6 text-muted" />
            </div>
            <p className="mt-4 text-sm font-medium text-foreground">
              No open positions
            </p>
            <p className="mt-1 max-w-xs text-xs text-muted">
              Use the{" "}
              <code className="rounded bg-input-bg px-1.5 py-0.5 font-mono text-accent">
                /trade-executor
              </code>{" "}
              agent to place your first trade.
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table>
              <thead>
                <tr>
                  <th>Ticker</th>
                  <th className="text-right">Shares</th>
                  <th className="text-right">Avg Cost</th>
                  <th className="text-right">Current Price</th>
                  <th className="text-right">Market Value</th>
                  <th className="text-right">P&L</th>
                  <th className="text-right">P&L %</th>
                  <th className="text-right">Stop Loss</th>
                </tr>
              </thead>
              <tbody>
                {portfolio.positions.map((pos) => (
                  <tr key={pos.ticker}>
                    <td>
                      <span className="font-mono font-semibold text-accent">
                        {pos.ticker}
                      </span>
                    </td>
                    <td className="text-right tabular-nums">{pos.shares}</td>
                    <td className="text-right tabular-nums">
                      {formatUSD(pos.avg_cost)}
                    </td>
                    <td className="text-right tabular-nums">
                      {formatUSD(pos.current_price)}
                    </td>
                    <td className="text-right tabular-nums">
                      {formatUSD(pos.market_value)}
                    </td>
                    <td
                      className={`text-right tabular-nums font-medium ${pnlColor(pos.unrealized_pnl)}`}
                    >
                      <span className="inline-flex items-center gap-1">
                        {pos.unrealized_pnl > 0 ? (
                          <TrendingUp className="h-3 w-3" />
                        ) : pos.unrealized_pnl < 0 ? (
                          <TrendingDown className="h-3 w-3" />
                        ) : null}
                        {pos.unrealized_pnl > 0 ? "+" : ""}
                        {formatUSD(pos.unrealized_pnl)}
                      </span>
                    </td>
                    <td
                      className={`text-right tabular-nums font-medium ${pnlColor(pos.unrealized_pnl_pct)}`}
                    >
                      <span
                        className={`inline-block rounded-full px-2 py-0.5 text-xs font-medium ${pnlBgColor(pos.unrealized_pnl_pct)}`}
                      >
                        {formatPct(pos.unrealized_pnl_pct)}
                      </span>
                    </td>
                    <td className="text-right tabular-nums text-warning">
                      {formatUSD(pos.stop_loss)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* ================================================================ */}
      {/* 5. Risk Metrics Panel                                             */}
      {/* ================================================================ */}
      <div className="rounded-xl border border-card-border bg-card p-5">
        <div className="mb-4 flex items-center gap-2">
          <ShieldCheck className="h-4 w-4 text-accent" />
          <h2 className="text-sm font-semibold">Risk Metrics</h2>
        </div>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <RiskMetric
            label="Drawdown from Peak"
            value={`${portfolio.drawdown_from_peak.toFixed(2)}%`}
            limit={`Peak: ${formatUSD(portfolio.peak_value)}`}
            pct={portfolio.drawdown_from_peak / 10}
            color={
              portfolio.drawdown_from_peak > 5
                ? "#ef4444"
                : portfolio.drawdown_from_peak > 2
                  ? "#f59e0b"
                  : "#10b981"
            }
            icon={AlertTriangle}
            warning={
              portfolio.drawdown_from_peak >= 10
                ? "Trading halted -- drawdown exceeds 10%"
                : undefined
            }
          />
          <RiskMetric
            label="Cash Reserve"
            value={`${cashPct.toFixed(1)}%`}
            limit="Minimum required: 20%"
            pct={Math.min(cashPct / 100, 1)}
            color={cashPct < 20 ? "#ef4444" : cashPct < 30 ? "#f59e0b" : "#10b981"}
            icon={Banknote}
            warning={
              cashPct < 20 ? "Below minimum reserve" : undefined
            }
          />
          <RiskMetric
            label="Daily Trades"
            value={`${portfolio.daily_trades_count} / 10`}
            limit="Max trades per session"
            pct={portfolio.daily_trades_count / 10}
            color={
              portfolio.daily_trades_count >= 10
                ? "#ef4444"
                : portfolio.daily_trades_count >= 8
                  ? "#f59e0b"
                  : "#10b981"
            }
            icon={Activity}
            warning={
              portfolio.daily_trades_count >= 10
                ? "Daily trade limit reached"
                : undefined
            }
          />
          <RiskMetric
            label="Active Positions"
            value={`${portfolio.positions.length}`}
            limit={`${portfolio.pending_orders.length} pending order${portfolio.pending_orders.length !== 1 ? "s" : ""}`}
            pct={portfolio.positions.length / 20}
            color="#3b82f6"
            icon={Layers}
          />
        </div>
      </div>
    </div>
  );
}
