import { readFile, writeFile } from "fs/promises";
import path from "path";

const DATA_DIR = path.join(process.cwd(), "..", "data");

export interface PortfolioState {
  last_updated: string;
  account: {
    mode: string;
    total_value: number;
    cash: number;
    buying_power: number;
  };
  positions: Position[];
  pending_orders: Order[];
  daily_trades_count: number;
  drawdown_from_peak: number;
  peak_value: number;
}

export interface Position {
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

export interface Order {
  id: string;
  ticker: string;
  side: string;
  qty: number;
  type: string;
  limit_price?: number;
  stop_price?: number;
  status: string;
  submitted_at: string;
}

export interface Trade {
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

export interface TradeHistory {
  trades: Trade[];
}

export interface WatchlistItem {
  ticker: string;
  name: string;
  notes: string;
  support: number | null;
  resistance: number | null;
}

export async function getPortfolioState(): Promise<PortfolioState> {
  const data = await readFile(path.join(DATA_DIR, "portfolio-state.json"), "utf-8");
  return JSON.parse(data);
}

export async function getTradeHistory(): Promise<TradeHistory> {
  const data = await readFile(path.join(DATA_DIR, "trade-history.json"), "utf-8");
  return JSON.parse(data);
}

export async function getWatchlist(): Promise<WatchlistItem[]> {
  const data = await readFile(
    path.join(DATA_DIR, "watchlists", "default.json"),
    "utf-8"
  );
  const parsed = JSON.parse(data);
  return parsed.watchlist || [];
}

export async function saveWatchlist(watchlist: WatchlistItem[]): Promise<void> {
  const data = JSON.stringify(
    {
      name: "default",
      last_updated: new Date().toISOString(),
      watchlist,
    },
    null,
    2
  );
  await writeFile(
    path.join(DATA_DIR, "watchlists", "default.json"),
    data,
    "utf-8"
  );
}

export async function savePortfolioState(state: PortfolioState): Promise<void> {
  const data = JSON.stringify(state, null, 2);
  await writeFile(path.join(DATA_DIR, "portfolio-state.json"), data, "utf-8");
}
