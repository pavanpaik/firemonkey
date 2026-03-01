"use client";

import { useEffect, useState, useCallback } from "react";
import Link from "next/link";
import {
  Plus,
  Pencil,
  Trash2,
  Save,
  X,
  Search,
  ListChecks,
  ArrowUpDown,
  Loader2,
  AlertTriangle,
} from "lucide-react";

interface WatchlistItem {
  ticker: string;
  name: string;
  notes: string;
  support: number | null;
  resistance: number | null;
}

export default function WatchlistPage() {
  const [watchlist, setWatchlist] = useState<WatchlistItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [editingIndex, setEditingIndex] = useState<number | null>(null);
  const [editItem, setEditItem] = useState<WatchlistItem | null>(null);
  const [deleteConfirmIndex, setDeleteConfirmIndex] = useState<number | null>(null);
  const [showAddForm, setShowAddForm] = useState(false);
  const [newItem, setNewItem] = useState<WatchlistItem>({
    ticker: "",
    name: "",
    notes: "",
    support: null,
    resistance: null,
  });

  const fetchWatchlist = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const res = await fetch("/api/watchlist");
      if (!res.ok) throw new Error("Failed to fetch watchlist");
      const data = await res.json();
      setWatchlist(data.watchlist || []);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load watchlist");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchWatchlist();
  }, [fetchWatchlist]);

  async function saveWatchlist(updated: WatchlistItem[]) {
    try {
      setSaving(true);
      setError(null);
      const res = await fetch("/api/watchlist", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ watchlist: updated }),
      });
      if (!res.ok) throw new Error("Failed to save watchlist");
      setWatchlist(updated);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to save watchlist");
    } finally {
      setSaving(false);
    }
  }

  function handleAdd() {
    if (!newItem.ticker.trim() || !newItem.name.trim()) return;
    const item: WatchlistItem = {
      ticker: newItem.ticker.toUpperCase().trim(),
      name: newItem.name.trim(),
      notes: newItem.notes.trim(),
      support: newItem.support,
      resistance: newItem.resistance,
    };
    const updated = [...watchlist, item];
    saveWatchlist(updated);
    setNewItem({ ticker: "", name: "", notes: "", support: null, resistance: null });
    setShowAddForm(false);
  }

  function handleDelete(index: number) {
    const updated = watchlist.filter((_, i) => i !== index);
    saveWatchlist(updated);
    setDeleteConfirmIndex(null);
  }

  function startEdit(index: number) {
    setEditingIndex(index);
    setEditItem({ ...watchlist[index] });
  }

  function cancelEdit() {
    setEditingIndex(null);
    setEditItem(null);
  }

  function saveEdit() {
    if (editingIndex === null || !editItem) return;
    const updated = [...watchlist];
    updated[editingIndex] = {
      ...editItem,
      ticker: editItem.ticker.toUpperCase().trim(),
      name: editItem.name.trim(),
      notes: editItem.notes.trim(),
    };
    saveWatchlist(updated);
    setEditingIndex(null);
    setEditItem(null);
  }

  function formatPrice(value: number | null): string {
    if (value === null || value === undefined) return "--";
    return `$${value.toFixed(2)}`;
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <ListChecks className="h-6 w-6 text-accent" />
          <h1 className="text-2xl font-bold">Watchlist</h1>
          <span className="rounded-full bg-card px-2.5 py-0.5 text-xs text-muted">
            {watchlist.length} tickers
          </span>
        </div>
        <button
          onClick={() => setShowAddForm(!showAddForm)}
          className="flex items-center gap-2 rounded-lg bg-accent px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-accent-hover"
        >
          {showAddForm ? (
            <>
              <X className="h-4 w-4" />
              Cancel
            </>
          ) : (
            <>
              <Plus className="h-4 w-4" />
              Add Ticker
            </>
          )}
        </button>
      </div>

      {/* Error banner */}
      {error && (
        <div className="flex items-center gap-2 rounded-lg border border-danger/30 bg-danger/10 px-4 py-3 text-sm text-danger">
          <AlertTriangle className="h-4 w-4 shrink-0" />
          {error}
        </div>
      )}

      {/* Add Ticker Form */}
      {showAddForm && (
        <div className="rounded-xl border border-card-border bg-card p-5">
          <h2 className="mb-4 text-sm font-semibold uppercase tracking-wider text-muted">
            Add New Ticker
          </h2>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-5">
            <div>
              <label className="mb-1.5 block text-xs font-medium text-muted">
                Ticker *
              </label>
              <input
                type="text"
                value={newItem.ticker}
                onChange={(e) =>
                  setNewItem({ ...newItem, ticker: e.target.value })
                }
                placeholder="AAPL"
                className="w-full rounded-lg border border-input-border bg-input-bg px-3 py-2 text-sm text-foreground placeholder:text-muted/60 focus:border-accent focus:outline-none focus:ring-1 focus:ring-accent"
              />
            </div>
            <div>
              <label className="mb-1.5 block text-xs font-medium text-muted">
                Company Name *
              </label>
              <input
                type="text"
                value={newItem.name}
                onChange={(e) =>
                  setNewItem({ ...newItem, name: e.target.value })
                }
                placeholder="Apple Inc."
                className="w-full rounded-lg border border-input-border bg-input-bg px-3 py-2 text-sm text-foreground placeholder:text-muted/60 focus:border-accent focus:outline-none focus:ring-1 focus:ring-accent"
              />
            </div>
            <div>
              <label className="mb-1.5 block text-xs font-medium text-muted">
                Notes
              </label>
              <input
                type="text"
                value={newItem.notes}
                onChange={(e) =>
                  setNewItem({ ...newItem, notes: e.target.value })
                }
                placeholder="Watching for earnings..."
                className="w-full rounded-lg border border-input-border bg-input-bg px-3 py-2 text-sm text-foreground placeholder:text-muted/60 focus:border-accent focus:outline-none focus:ring-1 focus:ring-accent"
              />
            </div>
            <div>
              <label className="mb-1.5 block text-xs font-medium text-muted">
                Support Level
              </label>
              <input
                type="number"
                step="0.01"
                value={newItem.support ?? ""}
                onChange={(e) =>
                  setNewItem({
                    ...newItem,
                    support: e.target.value ? parseFloat(e.target.value) : null,
                  })
                }
                placeholder="150.00"
                className="w-full rounded-lg border border-input-border bg-input-bg px-3 py-2 text-sm text-foreground placeholder:text-muted/60 focus:border-accent focus:outline-none focus:ring-1 focus:ring-accent"
              />
            </div>
            <div>
              <label className="mb-1.5 block text-xs font-medium text-muted">
                Resistance Level
              </label>
              <input
                type="number"
                step="0.01"
                value={newItem.resistance ?? ""}
                onChange={(e) =>
                  setNewItem({
                    ...newItem,
                    resistance: e.target.value
                      ? parseFloat(e.target.value)
                      : null,
                  })
                }
                placeholder="185.00"
                className="w-full rounded-lg border border-input-border bg-input-bg px-3 py-2 text-sm text-foreground placeholder:text-muted/60 focus:border-accent focus:outline-none focus:ring-1 focus:ring-accent"
              />
            </div>
          </div>
          <div className="mt-4 flex justify-end">
            <button
              onClick={handleAdd}
              disabled={!newItem.ticker.trim() || !newItem.name.trim() || saving}
              className="flex items-center gap-2 rounded-lg bg-success px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-success/80 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {saving ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <Plus className="h-4 w-4" />
              )}
              Add to Watchlist
            </button>
          </div>
        </div>
      )}

      {/* Watchlist Table */}
      <div className="rounded-xl border border-card-border bg-card">
        {loading ? (
          <div className="flex items-center justify-center py-16">
            <Loader2 className="h-6 w-6 animate-spin text-accent" />
            <span className="ml-3 text-sm text-muted">Loading watchlist...</span>
          </div>
        ) : watchlist.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16 text-center">
            <Search className="mb-3 h-10 w-10 text-muted/40" />
            <p className="text-sm text-muted">No tickers in your watchlist yet.</p>
            <p className="mt-1 text-xs text-muted/60">
              Click &quot;Add Ticker&quot; to start building your watchlist.
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table>
              <thead>
                <tr>
                  <th>
                    <div className="flex items-center gap-1">
                      Ticker
                      <ArrowUpDown className="h-3 w-3" />
                    </div>
                  </th>
                  <th>Company Name</th>
                  <th>Notes</th>
                  <th className="text-right">Support</th>
                  <th className="text-right">Resistance</th>
                  <th className="text-right">Actions</th>
                </tr>
              </thead>
              <tbody>
                {watchlist.map((item, index) => (
                  <tr key={`${item.ticker}-${index}`}>
                    {editingIndex === index && editItem ? (
                      <>
                        <td>
                          <input
                            type="text"
                            value={editItem.ticker}
                            onChange={(e) =>
                              setEditItem({
                                ...editItem,
                                ticker: e.target.value,
                              })
                            }
                            className="w-24 rounded border border-input-border bg-input-bg px-2 py-1 text-sm text-foreground focus:border-accent focus:outline-none"
                          />
                        </td>
                        <td>
                          <input
                            type="text"
                            value={editItem.name}
                            onChange={(e) =>
                              setEditItem({
                                ...editItem,
                                name: e.target.value,
                              })
                            }
                            className="w-full rounded border border-input-border bg-input-bg px-2 py-1 text-sm text-foreground focus:border-accent focus:outline-none"
                          />
                        </td>
                        <td>
                          <input
                            type="text"
                            value={editItem.notes}
                            onChange={(e) =>
                              setEditItem({
                                ...editItem,
                                notes: e.target.value,
                              })
                            }
                            className="w-full rounded border border-input-border bg-input-bg px-2 py-1 text-sm text-foreground focus:border-accent focus:outline-none"
                          />
                        </td>
                        <td>
                          <input
                            type="number"
                            step="0.01"
                            value={editItem.support ?? ""}
                            onChange={(e) =>
                              setEditItem({
                                ...editItem,
                                support: e.target.value
                                  ? parseFloat(e.target.value)
                                  : null,
                              })
                            }
                            className="w-24 rounded border border-input-border bg-input-bg px-2 py-1 text-right text-sm text-foreground focus:border-accent focus:outline-none"
                          />
                        </td>
                        <td>
                          <input
                            type="number"
                            step="0.01"
                            value={editItem.resistance ?? ""}
                            onChange={(e) =>
                              setEditItem({
                                ...editItem,
                                resistance: e.target.value
                                  ? parseFloat(e.target.value)
                                  : null,
                              })
                            }
                            className="w-24 rounded border border-input-border bg-input-bg px-2 py-1 text-right text-sm text-foreground focus:border-accent focus:outline-none"
                          />
                        </td>
                        <td>
                          <div className="flex items-center justify-end gap-1">
                            <button
                              onClick={saveEdit}
                              disabled={saving}
                              className="rounded p-1.5 text-success transition-colors hover:bg-success/10"
                              title="Save"
                            >
                              {saving ? (
                                <Loader2 className="h-4 w-4 animate-spin" />
                              ) : (
                                <Save className="h-4 w-4" />
                              )}
                            </button>
                            <button
                              onClick={cancelEdit}
                              className="rounded p-1.5 text-muted transition-colors hover:bg-card-border hover:text-foreground"
                              title="Cancel"
                            >
                              <X className="h-4 w-4" />
                            </button>
                          </div>
                        </td>
                      </>
                    ) : (
                      <>
                        <td>
                          <span className="font-mono font-semibold text-accent">
                            {item.ticker}
                          </span>
                        </td>
                        <td className="text-foreground">{item.name}</td>
                        <td className="max-w-xs truncate text-muted">
                          {item.notes || "--"}
                        </td>
                        <td className="text-right font-mono text-success">
                          {formatPrice(item.support)}
                        </td>
                        <td className="text-right font-mono text-danger">
                          {formatPrice(item.resistance)}
                        </td>
                        <td>
                          <div className="flex items-center justify-end gap-1">
                            <Link
                              href={`/agents?skill=market-analyst&args=${item.ticker}`}
                              className="rounded px-2 py-1.5 text-xs font-medium text-accent transition-colors hover:bg-accent/10"
                              title="Analyze"
                            >
                              Analyze
                            </Link>
                            <button
                              onClick={() => startEdit(index)}
                              className="rounded p-1.5 text-muted transition-colors hover:bg-card-border hover:text-foreground"
                              title="Edit"
                            >
                              <Pencil className="h-3.5 w-3.5" />
                            </button>
                            {deleteConfirmIndex === index ? (
                              <div className="flex items-center gap-1">
                                <button
                                  onClick={() => handleDelete(index)}
                                  className="rounded px-2 py-1 text-xs font-medium text-danger transition-colors hover:bg-danger/10"
                                >
                                  Confirm
                                </button>
                                <button
                                  onClick={() => setDeleteConfirmIndex(null)}
                                  className="rounded px-2 py-1 text-xs text-muted transition-colors hover:bg-card-border"
                                >
                                  Cancel
                                </button>
                              </div>
                            ) : (
                              <button
                                onClick={() => setDeleteConfirmIndex(index)}
                                className="rounded p-1.5 text-muted transition-colors hover:bg-danger/10 hover:text-danger"
                                title="Delete"
                              >
                                <Trash2 className="h-3.5 w-3.5" />
                              </button>
                            )}
                          </div>
                        </td>
                      </>
                    )}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Saving indicator */}
      {saving && (
        <div className="fixed bottom-6 right-6 flex items-center gap-2 rounded-lg border border-card-border bg-card px-4 py-2.5 text-sm shadow-lg">
          <Loader2 className="h-4 w-4 animate-spin text-accent" />
          <span className="text-muted">Saving changes...</span>
        </div>
      )}
    </div>
  );
}
