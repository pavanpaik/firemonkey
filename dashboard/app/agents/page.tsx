"use client";

import { useState, useRef, useEffect, useCallback } from "react";
import {
  TrendingUp,
  Newspaper,
  Target,
  Shield,
  Briefcase,
  Zap,
  Sun,
  Play,
  Loader2,
  Trash2,
  ChevronDown,
  ChevronRight,
  Clock,
  Bot,
  AlertCircle,
  CheckCircle2,
} from "lucide-react";
import type { LucideIcon } from "lucide-react";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

interface AgentDef {
  skill: string;
  name: string;
  description: string;
  icon: LucideIcon;
  placeholder: string;
  requiresArgs: boolean;
}

interface RunRecord {
  id: string;
  agent: AgentDef;
  args: string;
  output: string | null;
  error: string | null;
  timestamp: Date;
  status: "running" | "success" | "error";
}

// ---------------------------------------------------------------------------
// Agent definitions
// ---------------------------------------------------------------------------

const agents: AgentDef[] = [
  {
    skill: "/market-analyst",
    name: "Market Analyst",
    description: "Technical + fundamental analysis",
    icon: TrendingUp,
    placeholder: "AAPL",
    requiresArgs: true,
  },
  {
    skill: "/news-sentiment",
    name: "News & Sentiment",
    description: "News aggregation and sentiment scoring",
    icon: Newspaper,
    placeholder: "TSLA",
    requiresArgs: true,
  },
  {
    skill: "/trade-strategist",
    name: "Trade Strategist",
    description: "Trade setup generation",
    icon: Target,
    placeholder: "NVDA long 1w",
    requiresArgs: true,
  },
  {
    skill: "/risk-manager",
    name: "Risk Manager",
    description: "Trade and portfolio risk validation",
    icon: Shield,
    placeholder: "No arguments required",
    requiresArgs: false,
  },
  {
    skill: "/portfolio-manager",
    name: "Portfolio Manager",
    description: "Holdings, P&L, rebalancing",
    icon: Briefcase,
    placeholder: "No arguments required",
    requiresArgs: false,
  },
  {
    skill: "/trade-executor",
    name: "Trade Executor",
    description: "Order submission via Alpaca",
    icon: Zap,
    placeholder: "No arguments required",
    requiresArgs: false,
  },
  {
    skill: "/morning-brief",
    name: "Morning Brief",
    description: "Daily comprehensive market overview",
    icon: Sun,
    placeholder: "No arguments required",
    requiresArgs: false,
  },
];

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function formatTimestamp(date: Date): string {
  return date.toLocaleTimeString("en-US", {
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
    hour12: true,
  });
}

// ---------------------------------------------------------------------------
// Page Component
// ---------------------------------------------------------------------------

export default function AgentsPage() {
  const [argValues, setArgValues] = useState<Record<string, string>>({});
  const [runs, setRuns] = useState<RunRecord[]>([]);
  const [activeRunId, setActiveRunId] = useState<string | null>(null);
  const [historyExpanded, setHistoryExpanded] = useState(false);
  const outputRef = useRef<HTMLDivElement>(null);

  const activeRun = runs.find((r) => r.id === activeRunId) ?? null;
  const pastRuns = runs.filter(
    (r) => r.id !== activeRunId && r.status !== "running"
  );

  // Auto-scroll to output console when a run starts or finishes
  const scrollToOutput = useCallback(() => {
    if (outputRef.current) {
      outputRef.current.scrollIntoView({ behavior: "smooth", block: "start" });
    }
  }, []);

  useEffect(() => {
    if (activeRun) {
      scrollToOutput();
    }
  }, [activeRun, activeRun?.status, scrollToOutput]);

  // ------ Run an agent ------
  const runAgent = async (agent: AgentDef) => {
    const args = argValues[agent.skill]?.trim() ?? "";

    const id = `${agent.skill}-${Date.now()}`;
    const record: RunRecord = {
      id,
      agent,
      args,
      output: null,
      error: null,
      timestamp: new Date(),
      status: "running",
    };

    setRuns((prev) => [record, ...prev]);
    setActiveRunId(id);

    try {
      const res = await fetch("/api/agents", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ skill: agent.skill, args }),
      });

      if (!res.ok) {
        const errorBody = await res.json().catch(() => null);
        throw new Error(
          errorBody?.error || `Request failed with status ${res.status}`
        );
      }

      const data = await res.json();
      const failed = data.exitCode !== 0 || (!data.output && data.error);
      setRuns((prev) =>
        prev.map((r) =>
          r.id === id
            ? {
                ...r,
                output: data.output || null,
                error: failed
                  ? data.error || `Agent exited with code ${data.exitCode}`
                  : null,
                status: failed ? ("error" as const) : ("success" as const),
              }
            : r
        )
      );
    } catch (err) {
      const message =
        err instanceof Error ? err.message : "Unknown error occurred";
      setRuns((prev) =>
        prev.map((r) =>
          r.id === id
            ? { ...r, error: message, status: "error" as const }
            : r
        )
      );
    }
  };

  // ------ Clear all runs ------
  const clearConsole = () => {
    setRuns([]);
    setActiveRunId(null);
    setHistoryExpanded(false);
  };

  const isAnyRunning = runs.some((r) => r.status === "running");

  // =========================================================================
  // Render
  // =========================================================================

  return (
    <div className="mx-auto max-w-7xl space-y-8">
      {/* ------------------------------------------------------------------ */}
      {/* Page Header                                                        */}
      {/* ------------------------------------------------------------------ */}
      <div>
        <h1 className="text-2xl font-bold tracking-tight">
          Agent Operations Hub
        </h1>
        <p className="mt-1 text-sm text-muted">
          Run FireMonkey agent skills to analyze markets, manage risk, and
          execute trades.
        </p>
      </div>

      {/* ------------------------------------------------------------------ */}
      {/* Agent Cards Grid                                                   */}
      {/* ------------------------------------------------------------------ */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
        {agents.map((agent) => {
          const Icon = agent.icon;
          const isRunning =
            isAnyRunning &&
            runs.some(
              (r) => r.agent.skill === agent.skill && r.status === "running"
            );

          return (
            <div
              key={agent.skill}
              className="flex flex-col rounded-xl border border-card-border bg-card p-5 transition-colors hover:border-accent/30"
            >
              {/* Icon + Name */}
              <div className="mb-3 flex items-center gap-3">
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-accent/10">
                  <Icon className="h-5 w-5 text-accent" />
                </div>
                <div>
                  <h3 className="text-sm font-semibold leading-tight">
                    {agent.name}
                  </h3>
                  <p className="text-xs text-muted">{agent.description}</p>
                </div>
              </div>

              {/* Skill Command */}
              <div className="mb-3">
                <code className="text-xs font-mono text-muted">
                  {agent.skill}
                  {agent.requiresArgs ? " [args]" : ""}
                </code>
              </div>

              {/* Input + Run Button */}
              <div className="mt-auto flex gap-2">
                {agent.requiresArgs && (
                  <input
                    type="text"
                    value={argValues[agent.skill] ?? ""}
                    onChange={(e) =>
                      setArgValues((prev) => ({
                        ...prev,
                        [agent.skill]: e.target.value,
                      }))
                    }
                    placeholder={agent.placeholder}
                    onKeyDown={(e) => {
                      if (e.key === "Enter" && !isAnyRunning) {
                        runAgent(agent);
                      }
                    }}
                    disabled={isAnyRunning}
                    className="min-w-0 flex-1 rounded-lg border border-input-border bg-input-bg px-3 py-2 text-sm text-foreground placeholder:text-muted/60 focus:border-accent focus:outline-none disabled:opacity-50"
                  />
                )}
                <button
                  onClick={() => runAgent(agent)}
                  disabled={isAnyRunning}
                  className={`flex items-center justify-center gap-1.5 whitespace-nowrap rounded-lg bg-accent px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-accent-hover disabled:cursor-not-allowed disabled:opacity-50 ${agent.requiresArgs ? "shrink-0" : "w-full"}`}
                >
                  {isRunning ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <Play className="h-4 w-4" />
                  )}
                  {isRunning ? "Running" : "Run"}
                </button>
              </div>
            </div>
          );
        })}
      </div>

      {/* ------------------------------------------------------------------ */}
      {/* Output Console                                                     */}
      {/* ------------------------------------------------------------------ */}
      <div ref={outputRef} className="rounded-xl border border-card-border bg-card">
        {/* Console Header */}
        <div className="flex items-center justify-between border-b border-card-border px-5 py-3">
          <div className="flex items-center gap-2">
            <Bot className="h-4 w-4 text-accent" />
            <h2 className="text-sm font-semibold">Output Console</h2>
            {runs.length > 0 && (
              <span className="rounded-full bg-accent/10 px-2 py-0.5 text-xs text-accent">
                {runs.length} run{runs.length !== 1 ? "s" : ""}
              </span>
            )}
          </div>
          {runs.length > 0 && (
            <button
              onClick={clearConsole}
              className="flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs text-muted transition-colors hover:bg-input-bg hover:text-foreground"
            >
              <Trash2 className="h-3.5 w-3.5" />
              Clear Console
            </button>
          )}
        </div>

        {/* Active Run Output */}
        <div className="p-5">
          {/* Empty state */}
          {!activeRun && runs.length === 0 && (
            <div className="flex flex-col items-center justify-center py-16 text-center">
              <Bot className="mb-3 h-10 w-10 text-muted/40" />
              <p className="text-sm text-muted">
                No agent runs yet. Select an agent above and click Run to get
                started.
              </p>
            </div>
          )}

          {activeRun && (
            <div>
              {/* Run Info Bar */}
              <div className="mb-4 flex items-center gap-3">
                <div className="flex items-center gap-2">
                  {activeRun.status === "running" && (
                    <span className="relative flex h-3 w-3">
                      <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-accent opacity-75" />
                      <span className="relative inline-flex h-3 w-3 rounded-full bg-accent" />
                    </span>
                  )}
                  {activeRun.status === "success" && (
                    <CheckCircle2 className="h-4 w-4 text-success" />
                  )}
                  {activeRun.status === "error" && (
                    <AlertCircle className="h-4 w-4 text-danger" />
                  )}
                  <span className="text-sm font-medium">
                    {activeRun.agent.name}
                  </span>
                  {activeRun.args && (
                    <code className="rounded bg-input-bg px-2 py-0.5 text-xs font-mono text-muted">
                      {activeRun.args}
                    </code>
                  )}
                </div>
                <div className="ml-auto flex items-center gap-1.5 text-xs text-muted">
                  <Clock className="h-3 w-3" />
                  {formatTimestamp(activeRun.timestamp)}
                </div>
              </div>

              {/* Running State */}
              {activeRun.status === "running" && (
                <div className="flex items-center gap-3 rounded-lg border border-card-border bg-input-bg px-4 py-6">
                  <Loader2 className="h-5 w-5 animate-spin text-accent" />
                  <div>
                    <p className="text-sm font-medium">
                      Running {activeRun.agent.name}...
                    </p>
                    <p className="text-xs text-muted">
                      This may take a moment depending on the analysis scope.
                    </p>
                  </div>
                </div>
              )}

              {/* Success Output */}
              {activeRun.status === "success" && activeRun.output && (
                <div className="agent-output rounded-lg border border-card-border bg-input-bg p-4 text-sm leading-relaxed">
                  <pre className="whitespace-pre-wrap break-words font-sans">
                    {activeRun.output}
                  </pre>
                </div>
              )}

              {/* Error Output */}
              {activeRun.status === "error" && activeRun.error && (
                <div className="rounded-lg border border-danger/30 bg-danger/5 p-4">
                  <div className="flex items-start gap-2">
                    <AlertCircle className="mt-0.5 h-4 w-4 shrink-0 text-danger" />
                    <div>
                      <p className="text-sm font-medium text-danger">
                        Agent Error
                      </p>
                      <p className="mt-1 text-sm text-danger/80">
                        {activeRun.error}
                      </p>
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>

        {/* ---------------------------------------------------------------- */}
        {/* Run History (collapsible)                                        */}
        {/* ---------------------------------------------------------------- */}
        {pastRuns.length > 0 && (
          <div className="border-t border-card-border">
            <button
              onClick={() => setHistoryExpanded(!historyExpanded)}
              className="flex w-full items-center gap-2 px-5 py-3 text-left text-sm font-medium text-muted transition-colors hover:text-foreground"
            >
              {historyExpanded ? (
                <ChevronDown className="h-4 w-4" />
              ) : (
                <ChevronRight className="h-4 w-4" />
              )}
              Previous Runs ({pastRuns.length})
            </button>

            {historyExpanded && (
              <div className="space-y-2 px-5 pb-4">
                {pastRuns.map((run) => {
                  const RunIcon = run.agent.icon;
                  return (
                    <button
                      key={run.id}
                      onClick={() => setActiveRunId(run.id)}
                      className="flex w-full items-center gap-3 rounded-lg border border-card-border bg-input-bg/50 px-4 py-3 text-left transition-colors hover:border-accent/30 hover:bg-input-bg"
                    >
                      <RunIcon className="h-4 w-4 text-muted" />
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-2">
                          <span className="text-sm font-medium">
                            {run.agent.name}
                          </span>
                          {run.args && (
                            <code className="truncate rounded bg-card px-1.5 py-0.5 text-xs font-mono text-muted">
                              {run.args}
                            </code>
                          )}
                        </div>
                      </div>
                      <div className="flex shrink-0 items-center gap-2">
                        {run.status === "success" && (
                          <CheckCircle2 className="h-3.5 w-3.5 text-success" />
                        )}
                        {run.status === "error" && (
                          <AlertCircle className="h-3.5 w-3.5 text-danger" />
                        )}
                        <span className="text-xs text-muted">
                          {formatTimestamp(run.timestamp)}
                        </span>
                      </div>
                    </button>
                  );
                })}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
