"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import {
  ArrowUpRight,
  ArrowDownRight,
  Clock,
  CheckCircle,
  XCircle,
  TrendingUp,
  BarChart3,
  DollarSign,
  Activity,
  FileText,
  Loader2,
  Zap,
  ShieldCheck,
} from "lucide-react";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

interface Trade {
  timestamp: string;
  ticker: string;
  side: string;
  qty: number;
  price: number;
  order_type: string;
  status: string;
  pnl?: number;
  notes?: string;
}

interface PendingOrder {
  ticker: string;
  side: string;
  qty: number;
  order_type: string;
  limit_price?: number;
  stop_price?: number;
  status: string;
  submitted_at: string;
}

interface PortfolioData {
  pending_orders?: PendingOrder[];
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function formatUSD(value: number): string {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(value);
}

function formatDateTime(iso: string): string {
  const date = new Date(iso);
  return date.toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
    hour: "numeric",
    minute: "2-digit",
    hour12: true,
  });
}

function formatShortDate(iso: string): string {
  const date = new Date(iso);
  return date.toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
    hour12: true,
  });
}

function statusIcon(status: string) {
  const s = status.toLowerCase();
  if (s === "filled" || s === "completed" || s === "executed") {
    return <CheckCircle className="h-4 w-4 text-success" />;
  }
  if (s === "pending" || s === "open" || s === "new" || s === "accepted") {
    return <Clock className="h-4 w-4 text-warning" />;
  }
  if (s === "cancelled" || s === "canceled" || s === "rejected" || s === "failed") {
    return <XCircle className="h-4 w-4 text-danger" />;
  }
  return <Clock className="h-4 w-4 text-muted" />;
}

function pnlColor(pnl: number | undefined): string {
  if (pnl === undefined || pnl === 0) return "text-muted";
  return pnl > 0 ? "text-success" : "text-danger";
}

function sideColor(side: string): string {
  return side.toUpperCase() === "BUY" ? "text-success" : "text-danger";
}

function orderTypeBadge(type: string): string {
  const t = type.toLowerCase();
  if (t === "market") return "bg-accent/15 text-accent";
  if (t === "limit") return "bg-success/15 text-success";
  if (t === "stop" || t === "stop_limit") return "bg-warning/15 text-warning";
  return "bg-muted/15 text-muted";
}

// ---------------------------------------------------------------------------
// Stat Card
// ---------------------------------------------------------------------------

function StatCard({
  label,
  value,
  icon: Icon,
  valueClass,
}: {
  label: string;
  value: string;
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
      <p className={`mt-2 text-2xl font-bold tracking-tight ${valueClass ?? "text-foreground"}`}>
        {value}
      </p>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Main Page
// ---------------------------------------------------------------------------

export default function TradesPage() {
  const [trades, setTrades] = useState<Trade[]>([]);
  const [pendingOrders, setPendingOrders] = useState<PendingOrder[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function fetchData() {
      setLoading(true);
      setError(null);

      try {
        const [tradesRes, portfolioRes] = await Promise.allSettled([
          fetch("/api/trades"),
          fetch("/api/portfolio"),
        ]);

        if (tradesRes.status === "fulfilled" && tradesRes.value.ok) {
          const tradesData = await tradesRes.value.json();
          setTrades(Array.isArray(tradesData) ? tradesData : tradesData.trades ?? []);
        }

        if (portfolioRes.status === "fulfilled" && portfolioRes.value.ok) {
          const portfolioData: PortfolioData = await portfolioRes.value.json();
          setPendingOrders(portfolioData.pending_orders ?? []);
        }
      } catch (err) {
        setError("Failed to fetch trade data. APIs may not be available yet.");
      } finally {
        setLoading(false);
      }
    }

    fetchData();
  }, []);

  // ---- Computed stats ----
  const totalTrades = trades.length;
  const tradesWithPnl = trades.filter((t) => t.pnl !== undefined && t.pnl !== null);
  const winCount = tradesWithPnl.filter((t) => (t.pnl ?? 0) > 0).length;
  const winRate = tradesWithPnl.length > 0 ? (winCount / tradesWithPnl.length) * 100 : 0;
  const totalPnl = tradesWithPnl.reduce((sum, t) => sum + (t.pnl ?? 0), 0);
  const avgPnl = tradesWithPnl.length > 0 ? totalPnl / tradesWithPnl.length : 0;

  // ---- Loading state ----
  if (loading) {
    return (
      <div className="flex h-full items-center justify-center">
        <div className="flex flex-col items-center gap-3 text-muted">
          <Loader2 className="h-8 w-8 animate-spin" />
          <span className="text-sm">Loading trade history...</span>
        </div>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-7xl space-y-6">
      {/* Page Header */}
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Trade History</h1>
        <p className="mt-1 text-sm text-muted">
          Track all trades, pending orders, and performance metrics.
        </p>
      </div>

      {/* Error Banner */}
      {error && (
        <div className="rounded-lg border border-warning/30 bg-warning/10 px-4 py-3 text-sm text-warning">
          {error}
        </div>
      )}

      {/* ================================================================== */}
      {/* 1. Trade Summary Stats                                             */}
      {/* ================================================================== */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard
          label="Total Trades"
          value={totalTrades.toString()}
          icon={BarChart3}
        />
        <StatCard
          label="Win Rate"
          value={tradesWithPnl.length > 0 ? `${winRate.toFixed(2)}%` : "--"}
          icon={TrendingUp}
          valueClass={
            winRate >= 50 ? "text-success" : winRate > 0 ? "text-danger" : undefined
          }
        />
        <StatCard
          label="Total P&L"
          value={tradesWithPnl.length > 0 ? formatUSD(totalPnl) : "--"}
          icon={DollarSign}
          valueClass={pnlColor(tradesWithPnl.length > 0 ? totalPnl : undefined)}
        />
        <StatCard
          label="Avg P&L / Trade"
          value={tradesWithPnl.length > 0 ? formatUSD(avgPnl) : "--"}
          icon={Activity}
          valueClass={pnlColor(tradesWithPnl.length > 0 ? avgPnl : undefined)}
        />
      </div>

      {/* ================================================================== */}
      {/* 2. Trade History Table                                             */}
      {/* ================================================================== */}
      <div className="rounded-xl border border-card-border bg-card">
        <div className="flex items-center gap-2 border-b border-card-border px-5 py-4">
          <FileText className="h-4 w-4 text-accent" />
          <h2 className="text-sm font-semibold">Trade History</h2>
          <span className="ml-auto rounded-full bg-accent/10 px-2.5 py-0.5 text-xs font-medium text-accent">
            {totalTrades} {totalTrades === 1 ? "trade" : "trades"}
          </span>
        </div>

        {trades.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16 text-center">
            <div className="flex h-14 w-14 items-center justify-center rounded-full bg-card-border/50">
              <TrendingUp className="h-6 w-6 text-muted" />
            </div>
            <p className="mt-4 text-sm font-medium text-foreground">No trades yet</p>
            <p className="mt-1 max-w-xs text-xs text-muted">
              Use the{" "}
              <code className="rounded bg-input-bg px-1.5 py-0.5 font-mono text-accent">
                /trade-executor
              </code>{" "}
              agent to start trading.
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table>
              <thead>
                <tr>
                  <th>Date / Time</th>
                  <th>Ticker</th>
                  <th>Side</th>
                  <th className="text-right">Qty</th>
                  <th className="text-right">Price</th>
                  <th>Type</th>
                  <th>Status</th>
                  <th className="text-right">P&L</th>
                  <th>Notes</th>
                </tr>
              </thead>
              <tbody>
                {trades.map((trade, i) => (
                  <tr key={`${trade.timestamp}-${trade.ticker}-${i}`}>
                    <td className="whitespace-nowrap text-muted">
                      {formatDateTime(trade.timestamp)}
                    </td>
                    <td className="font-semibold">{trade.ticker}</td>
                    <td>
                      <span
                        className={`inline-flex items-center gap-1 font-semibold ${sideColor(trade.side)}`}
                      >
                        {trade.side.toUpperCase() === "BUY" ? (
                          <ArrowUpRight className="h-3.5 w-3.5" />
                        ) : (
                          <ArrowDownRight className="h-3.5 w-3.5" />
                        )}
                        {trade.side.toUpperCase()}
                      </span>
                    </td>
                    <td className="text-right tabular-nums">{trade.qty}</td>
                    <td className="text-right tabular-nums">
                      {formatUSD(trade.price)}
                    </td>
                    <td>
                      <span
                        className={`inline-block rounded-full px-2 py-0.5 text-xs font-medium ${orderTypeBadge(trade.order_type)}`}
                      >
                        {trade.order_type.toUpperCase()}
                      </span>
                    </td>
                    <td>
                      <span className="inline-flex items-center gap-1.5 text-xs">
                        {statusIcon(trade.status)}
                        <span className="capitalize">{trade.status}</span>
                      </span>
                    </td>
                    <td className={`text-right tabular-nums font-medium ${pnlColor(trade.pnl)}`}>
                      {trade.pnl !== undefined && trade.pnl !== null ? (
                        <span className="inline-flex items-center gap-1">
                          {trade.pnl > 0 ? "+" : ""}
                          {formatUSD(trade.pnl)}
                        </span>
                      ) : (
                        <span className="text-muted">--</span>
                      )}
                    </td>
                    <td className="max-w-[200px] truncate text-xs text-muted">
                      {trade.notes ?? "--"}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* ================================================================== */}
      {/* 3. Pending Orders Panel                                            */}
      {/* ================================================================== */}
      <div className="rounded-xl border border-card-border bg-card">
        <div className="flex items-center gap-2 border-b border-card-border px-5 py-4">
          <Clock className="h-4 w-4 text-warning" />
          <h2 className="text-sm font-semibold">Pending Orders</h2>
          <span className="ml-auto rounded-full bg-warning/10 px-2.5 py-0.5 text-xs font-medium text-warning">
            {pendingOrders.length} {pendingOrders.length === 1 ? "order" : "orders"}
          </span>
        </div>

        {pendingOrders.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-12 text-center">
            <div className="flex h-12 w-12 items-center justify-center rounded-full bg-card-border/50">
              <CheckCircle className="h-5 w-5 text-muted" />
            </div>
            <p className="mt-3 text-sm text-muted">No pending orders.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table>
              <thead>
                <tr>
                  <th>Ticker</th>
                  <th>Side</th>
                  <th className="text-right">Qty</th>
                  <th>Type</th>
                  <th className="text-right">Limit Price</th>
                  <th className="text-right">Stop Price</th>
                  <th>Status</th>
                  <th>Submitted At</th>
                </tr>
              </thead>
              <tbody>
                {pendingOrders.map((order, i) => (
                  <tr key={`${order.submitted_at}-${order.ticker}-${i}`}>
                    <td className="font-semibold">{order.ticker}</td>
                    <td>
                      <span
                        className={`inline-flex items-center gap-1 font-semibold ${sideColor(order.side)}`}
                      >
                        {order.side.toUpperCase() === "BUY" ? (
                          <ArrowUpRight className="h-3.5 w-3.5" />
                        ) : (
                          <ArrowDownRight className="h-3.5 w-3.5" />
                        )}
                        {order.side.toUpperCase()}
                      </span>
                    </td>
                    <td className="text-right tabular-nums">{order.qty}</td>
                    <td>
                      <span
                        className={`inline-block rounded-full px-2 py-0.5 text-xs font-medium ${orderTypeBadge(order.order_type)}`}
                      >
                        {order.order_type.toUpperCase()}
                      </span>
                    </td>
                    <td className="text-right tabular-nums">
                      {order.limit_price !== undefined && order.limit_price !== null
                        ? formatUSD(order.limit_price)
                        : "--"}
                    </td>
                    <td className="text-right tabular-nums">
                      {order.stop_price !== undefined && order.stop_price !== null
                        ? formatUSD(order.stop_price)
                        : "--"}
                    </td>
                    <td>
                      <span className="inline-flex items-center gap-1.5 text-xs">
                        {statusIcon(order.status)}
                        <span className="capitalize">{order.status}</span>
                      </span>
                    </td>
                    <td className="whitespace-nowrap text-muted">
                      {formatShortDate(order.submitted_at)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* ================================================================== */}
      {/* 4. Quick Trade Panel                                               */}
      {/* ================================================================== */}
      <div className="rounded-xl border border-card-border bg-card p-5">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-start gap-3">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-accent/10">
              <Zap className="h-5 w-5 text-accent" />
            </div>
            <div>
              <h3 className="text-sm font-semibold">Quick Trade</h3>
              <p className="mt-0.5 flex items-center gap-1.5 text-xs text-muted">
                <ShieldCheck className="h-3.5 w-3.5 text-success" />
                All trades require human confirmation and are executed in paper trading mode.
              </p>
            </div>
          </div>
          <Link
            href="/agents"
            className="inline-flex items-center justify-center gap-2 rounded-lg bg-accent px-5 py-2.5 text-sm font-medium text-white transition-colors hover:bg-accent-hover"
          >
            <Zap className="h-4 w-4" />
            Run Trade Executor
          </Link>
        </div>
      </div>
    </div>
  );
}
