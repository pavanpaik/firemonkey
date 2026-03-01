"use client";

import { useEffect, useState, useMemo } from "react";
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
} from "recharts";
import {
  DollarSign,
  TrendingUp,
  TrendingDown,
  Wallet,
  ShieldAlert,
  BarChart3,
  Activity,
  RefreshCw,
} from "lucide-react";

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

interface PortfolioState {
  last_updated: string;
  account: {
    mode: string;
    total_value: number;
    cash: number;
    buying_power: number;
  };
  positions: Position[];
  pending_orders: unknown[];
  daily_trades_count: number;
  drawdown_from_peak: number;
  peak_value: number;
}

const formatUSD = (n: number) =>
  new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    minimumFractionDigits: 2,
  }).format(n);

const formatPct = (n: number) => `${n >= 0 ? "+" : ""}${n.toFixed(2)}%`;

function generateMockHistory(currentValue: number) {
  const data = [];
  let value = 100000;
  for (let i = 30; i >= 0; i--) {
    const date = new Date();
    date.setDate(date.getDate() - i);
    if (i === 0) value = currentValue;
    else value = value * (1 + (Math.random() * 0.04 - 0.02));
    data.push({
      date: date.toLocaleDateString("en-US", { month: "short", day: "numeric" }),
      value: Math.round(value * 100) / 100,
    });
  }
  return data;
}

const PIE_COLORS = ["#3b82f6", "#10b981", "#f59e0b", "#ef4444", "#8b5cf6", "#ec4899", "#06b6d4"];

export default function PortfolioPage() {
  const [portfolio, setPortfolio] = useState<PortfolioState | null>(null);
  const [loading, setLoading] = useState(true);

  const fetchPortfolio = async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/portfolio");
      const data = await res.json();
      setPortfolio(data);
    } catch {
      console.error("Failed to fetch portfolio");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPortfolio();
  }, []);

  const historyData = useMemo(
    () => generateMockHistory(portfolio?.account.total_value ?? 100000),
    [portfolio?.account.total_value]
  );

  const allocationData = useMemo(() => {
    if (!portfolio || portfolio.positions.length === 0) {
      return [{ name: "Cash", value: 100 }];
    }
    const sectors: Record<string, number> = {};
    let totalInvested = 0;
    for (const p of portfolio.positions) {
      sectors[p.sector] = (sectors[p.sector] || 0) + p.market_value;
      totalInvested += p.market_value;
    }
    const cashPct =
      ((portfolio.account.cash / portfolio.account.total_value) * 100);
    const entries = Object.entries(sectors).map(([name, val]) => ({
      name,
      value: Math.round((val / portfolio.account.total_value) * 10000) / 100,
    }));
    entries.push({ name: "Cash", value: Math.round(cashPct * 100) / 100 });
    return entries;
  }, [portfolio]);

  const dayPnl = useMemo(() => {
    if (!portfolio) return 0;
    return portfolio.positions.reduce((sum, p) => sum + p.unrealized_pnl, 0);
  }, [portfolio]);

  if (loading) {
    return (
      <div className="flex h-full items-center justify-center">
        <RefreshCw className="h-8 w-8 animate-spin text-accent" />
      </div>
    );
  }

  if (!portfolio) {
    return (
      <div className="flex h-full items-center justify-center text-muted">
        Failed to load portfolio data.
      </div>
    );
  }

  const { account, positions, daily_trades_count, drawdown_from_peak } = portfolio;
  const cashPct = (account.cash / account.total_value) * 100;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Portfolio Overview</h1>
          <p className="text-sm text-muted">
            Last updated: {new Date(portfolio.last_updated).toLocaleString()}
          </p>
        </div>
        <button
          onClick={fetchPortfolio}
          className="flex items-center gap-2 rounded-lg bg-card px-4 py-2 text-sm border border-card-border hover:bg-accent/10 transition-colors"
        >
          <RefreshCw className="h-4 w-4" />
          Refresh
        </button>
      </div>

      {/* Stat Cards */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard
          icon={<DollarSign className="h-5 w-5 text-accent" />}
          label="Total Value"
          value={formatUSD(account.total_value)}
        />
        <StatCard
          icon={<Wallet className="h-5 w-5 text-blue-400" />}
          label="Cash Balance"
          value={formatUSD(account.cash)}
          sub={`${cashPct.toFixed(1)}% of portfolio`}
        />
        <StatCard
          icon={
            dayPnl >= 0 ? (
              <TrendingUp className="h-5 w-5 text-success" />
            ) : (
              <TrendingDown className="h-5 w-5 text-danger" />
            )
          }
          label="Day P&L"
          value={formatUSD(dayPnl)}
          valueColor={dayPnl >= 0 ? "text-success" : "text-danger"}
        />
        <StatCard
          icon={<BarChart3 className="h-5 w-5 text-purple-400" />}
          label="Buying Power"
          value={formatUSD(account.buying_power)}
        />
      </div>

      {/* Charts Row */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        {/* Portfolio Value Chart */}
        <div className="lg:col-span-2 rounded-xl border border-card-border bg-card p-5">
          <h2 className="mb-4 text-sm font-semibold text-muted uppercase tracking-wide">
            Portfolio Value (30D)
          </h2>
          <ResponsiveContainer width="100%" height={280}>
            <AreaChart data={historyData}>
              <defs>
                <linearGradient id="valueGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#3b82f6" stopOpacity={0.3} />
                  <stop offset="100%" stopColor="#3b82f6" stopOpacity={0} />
                </linearGradient>
              </defs>
              <XAxis
                dataKey="date"
                tick={{ fill: "#64748b", fontSize: 11 }}
                axisLine={false}
                tickLine={false}
              />
              <YAxis
                tick={{ fill: "#64748b", fontSize: 11 }}
                axisLine={false}
                tickLine={false}
                domain={["auto", "auto"]}
                tickFormatter={(v: number) => `$${(v / 1000).toFixed(0)}k`}
              />
              <Tooltip
                contentStyle={{
                  background: "#111827",
                  border: "1px solid #1e293b",
                  borderRadius: "8px",
                  color: "#e2e8f0",
                  fontSize: "13px",
                }}
                formatter={(value: number | undefined) => [formatUSD(value ?? 0), "Value"]}
              />
              <Area
                type="monotone"
                dataKey="value"
                stroke="#3b82f6"
                strokeWidth={2}
                fill="url(#valueGrad)"
              />
            </AreaChart>
          </ResponsiveContainer>
        </div>

        {/* Allocation Pie */}
        <div className="rounded-xl border border-card-border bg-card p-5">
          <h2 className="mb-4 text-sm font-semibold text-muted uppercase tracking-wide">
            Allocation
          </h2>
          <ResponsiveContainer width="100%" height={200}>
            <PieChart>
              <Pie
                data={allocationData}
                cx="50%"
                cy="50%"
                innerRadius={55}
                outerRadius={80}
                dataKey="value"
                paddingAngle={2}
              >
                {allocationData.map((_, i) => (
                  <Cell key={i} fill={PIE_COLORS[i % PIE_COLORS.length]} />
                ))}
              </Pie>
              <Tooltip
                contentStyle={{
                  background: "#111827",
                  border: "1px solid #1e293b",
                  borderRadius: "8px",
                  color: "#e2e8f0",
                  fontSize: "13px",
                }}
                formatter={(value: number | undefined) => [`${value ?? 0}%`]}
              />
            </PieChart>
          </ResponsiveContainer>
          <div className="mt-3 space-y-1.5">
            {allocationData.map((item, i) => (
              <div key={item.name} className="flex items-center justify-between text-xs">
                <div className="flex items-center gap-2">
                  <span
                    className="h-2.5 w-2.5 rounded-full"
                    style={{ background: PIE_COLORS[i % PIE_COLORS.length] }}
                  />
                  <span className="text-foreground">{item.name}</span>
                </div>
                <span className="text-muted">{item.value}%</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Positions Table + Risk Metrics */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        {/* Positions */}
        <div className="lg:col-span-2 rounded-xl border border-card-border bg-card overflow-hidden">
          <div className="flex items-center justify-between border-b border-card-border px-5 py-3">
            <h2 className="text-sm font-semibold text-muted uppercase tracking-wide">
              Open Positions
            </h2>
            <span className="text-xs text-muted">{positions.length} positions</span>
          </div>
          {positions.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-16 text-muted">
              <Activity className="mb-3 h-10 w-10 opacity-40" />
              <p className="text-sm">No open positions</p>
              <p className="mt-1 text-xs">
                Use <code className="rounded bg-input-bg px-1.5 py-0.5">/trade-executor</code> to start trading
              </p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table>
                <thead>
                  <tr>
                    <th>Ticker</th>
                    <th>Shares</th>
                    <th>Avg Cost</th>
                    <th>Current</th>
                    <th>Mkt Value</th>
                    <th>P&L</th>
                    <th>P&L %</th>
                    <th>Stop Loss</th>
                  </tr>
                </thead>
                <tbody>
                  {positions.map((p) => (
                    <tr key={p.ticker}>
                      <td className="font-semibold">{p.ticker}</td>
                      <td>{p.shares}</td>
                      <td>{formatUSD(p.avg_cost)}</td>
                      <td>{formatUSD(p.current_price)}</td>
                      <td>{formatUSD(p.market_value)}</td>
                      <td className={p.unrealized_pnl >= 0 ? "text-success" : "text-danger"}>
                        {formatUSD(p.unrealized_pnl)}
                      </td>
                      <td className={p.unrealized_pnl_pct >= 0 ? "text-success" : "text-danger"}>
                        {formatPct(p.unrealized_pnl_pct)}
                      </td>
                      <td>{formatUSD(p.stop_loss)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* Risk Metrics */}
        <div className="rounded-xl border border-card-border bg-card p-5">
          <div className="mb-4 flex items-center gap-2">
            <ShieldAlert className="h-4 w-4 text-warning" />
            <h2 className="text-sm font-semibold text-muted uppercase tracking-wide">
              Risk Metrics
            </h2>
          </div>
          <div className="space-y-5">
            <RiskMetric
              label="Drawdown from Peak"
              value={`${drawdown_from_peak.toFixed(2)}%`}
              limit="10% max"
              pct={drawdown_from_peak / 10}
              color={drawdown_from_peak > 5 ? "#ef4444" : drawdown_from_peak > 2 ? "#f59e0b" : "#10b981"}
            />
            <RiskMetric
              label="Cash Reserve"
              value={`${cashPct.toFixed(1)}%`}
              limit="20% min"
              pct={Math.min(cashPct / 100, 1)}
              color={cashPct < 20 ? "#ef4444" : cashPct < 30 ? "#f59e0b" : "#10b981"}
            />
            <RiskMetric
              label="Daily Trades"
              value={`${daily_trades_count} / 10`}
              limit="10 max"
              pct={daily_trades_count / 10}
              color={daily_trades_count > 8 ? "#ef4444" : daily_trades_count > 5 ? "#f59e0b" : "#10b981"}
            />
            <RiskMetric
              label="Active Positions"
              value={`${positions.length}`}
              limit=""
              pct={positions.length / 20}
              color="#3b82f6"
            />
          </div>
        </div>
      </div>
    </div>
  );
}

function StatCard({
  icon,
  label,
  value,
  sub,
  valueColor,
}: {
  icon: React.ReactNode;
  label: string;
  value: string;
  sub?: string;
  valueColor?: string;
}) {
  return (
    <div className="rounded-xl border border-card-border bg-card p-5">
      <div className="flex items-center gap-2 mb-2">
        {icon}
        <span className="text-xs font-medium text-muted uppercase tracking-wide">{label}</span>
      </div>
      <div className={`text-2xl font-bold ${valueColor || "text-foreground"}`}>{value}</div>
      {sub && <div className="mt-1 text-xs text-muted">{sub}</div>}
    </div>
  );
}

function RiskMetric({
  label,
  value,
  limit,
  pct,
  color,
}: {
  label: string;
  value: string;
  limit: string;
  pct: number;
  color: string;
}) {
  return (
    <div>
      <div className="flex items-center justify-between mb-1.5">
        <span className="text-sm text-foreground">{label}</span>
        <span className="text-sm font-semibold" style={{ color }}>
          {value}
        </span>
      </div>
      <div className="h-1.5 rounded-full bg-input-bg overflow-hidden">
        <div
          className="h-full rounded-full transition-all duration-500"
          style={{ width: `${Math.min(pct * 100, 100)}%`, background: color }}
        />
      </div>
      {limit && <div className="mt-1 text-[10px] text-muted">{limit}</div>}
    </div>
  );
}
