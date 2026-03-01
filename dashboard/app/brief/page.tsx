"use client";

import { useState } from "react";
import {
  Sun,
  Play,
  Loader2,
  Clock,
  ChevronDown,
  ChevronRight,
  BarChart3,
  Newspaper,
  Briefcase,
  Target,
  CheckCircle2,
  AlertCircle,
} from "lucide-react";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

interface BriefRecord {
  id: string;
  output: string;
  timestamp: Date;
  status: "generating" | "success" | "error";
  error?: string;
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function formatTimestamp(date: Date): string {
  return date.toLocaleString("en-US", {
    weekday: "short",
    month: "short",
    day: "numeric",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
    hour12: true,
  });
}

function formatShortTimestamp(date: Date): string {
  return date.toLocaleTimeString("en-US", {
    hour: "2-digit",
    minute: "2-digit",
    hour12: true,
  });
}

// ---------------------------------------------------------------------------
// Analysis step items shown during loading
// ---------------------------------------------------------------------------

const analysisSteps = [
  { icon: BarChart3, label: "Market data", delay: "0ms" },
  { icon: Newspaper, label: "News & sentiment", delay: "150ms" },
  { icon: Briefcase, label: "Portfolio positions", delay: "300ms" },
  { icon: Target, label: "Today's setups", delay: "450ms" },
];

// ---------------------------------------------------------------------------
// Page Component
// ---------------------------------------------------------------------------

export default function MorningBriefPage() {
  const [briefs, setBriefs] = useState<BriefRecord[]>([]);
  const [expandedHistoryIds, setExpandedHistoryIds] = useState<Set<string>>(
    new Set()
  );

  const latestBrief = briefs.length > 0 ? briefs[0] : null;
  const isGenerating = latestBrief?.status === "generating";
  const pastBriefs = briefs.slice(1);

  // ---- Generate a new morning brief ----
  async function generateBrief() {
    const id = `brief-${Date.now()}`;
    const record: BriefRecord = {
      id,
      output: "",
      timestamp: new Date(),
      status: "generating",
    };

    setBriefs((prev) => [record, ...prev]);

    try {
      const res = await fetch("/api/agents", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ skill: "/morning-brief", args: "" }),
      });

      if (!res.ok) {
        const errorBody = await res.text();
        throw new Error(
          errorBody || `Request failed with status ${res.status}`
        );
      }

      const data = await res.json();

      setBriefs((prev) =>
        prev.map((b) =>
          b.id === id
            ? {
                ...b,
                output: data.output ?? JSON.stringify(data, null, 2),
                status: "success",
              }
            : b
        )
      );
    } catch (err) {
      const message =
        err instanceof Error ? err.message : "Unknown error occurred";
      setBriefs((prev) =>
        prev.map((b) =>
          b.id === id ? { ...b, error: message, status: "error" } : b
        )
      );
    }
  }

  // ---- Toggle history expansion ----
  function toggleHistoryItem(id: string) {
    setExpandedHistoryIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }
      return next;
    });
  }

  return (
    <div className="mx-auto max-w-4xl space-y-6">
      {/* ================================================================ */}
      {/* Page Header                                                      */}
      {/* ================================================================ */}
      <div>
        <div className="flex items-center gap-3">
          <Sun className="h-6 w-6 text-warning" />
          <h1 className="text-2xl font-bold tracking-tight">Morning Brief</h1>
        </div>
        <p className="mt-1 text-sm text-muted">
          Generate a comprehensive daily market overview powered by the
          FireMonkey agent suite.
        </p>
      </div>

      {/* ================================================================ */}
      {/* Generate Button                                                  */}
      {/* ================================================================ */}
      <div className="rounded-xl border border-card-border bg-card p-6">
        <div className="flex flex-col items-center gap-4 text-center">
          <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-warning/10">
            <Sun className="h-8 w-8 text-warning" />
          </div>
          <div>
            <h2 className="text-lg font-semibold">Daily Market Intelligence</h2>
            <p className="mt-1 max-w-md text-sm text-muted">
              Analyzes market data, news sentiment, your portfolio positions, and
              identifies today's top trade setups.
            </p>
          </div>
          <button
            onClick={generateBrief}
            disabled={isGenerating}
            className="flex items-center gap-2.5 rounded-xl bg-accent px-8 py-3.5 text-base font-semibold text-white transition-colors hover:bg-accent-hover disabled:cursor-not-allowed disabled:opacity-50"
          >
            {isGenerating ? (
              <>
                <Loader2 className="h-5 w-5 animate-spin" />
                Generating...
              </>
            ) : (
              <>
                <Play className="h-5 w-5" />
                Generate Morning Brief
              </>
            )}
          </button>
        </div>
      </div>

      {/* ================================================================ */}
      {/* Loading State                                                    */}
      {/* ================================================================ */}
      {isGenerating && (
        <div className="rounded-xl border border-card-border bg-card p-6">
          <div className="flex flex-col items-center gap-5">
            {/* Pulsing animation */}
            <div className="relative flex items-center justify-center">
              <span className="absolute h-12 w-12 animate-ping rounded-full bg-accent/20" />
              <span className="absolute h-8 w-8 animate-pulse rounded-full bg-accent/30" />
              <Loader2 className="relative h-6 w-6 animate-spin text-accent" />
            </div>

            <div className="text-center">
              <p className="text-sm font-semibold">
                Generating your morning brief...
              </p>
              <p className="mt-1 text-xs text-muted">
                This may take a minute while agents analyze multiple data
                sources.
              </p>
            </div>

            {/* Analysis steps */}
            <div className="w-full max-w-sm space-y-2">
              {analysisSteps.map((step) => {
                const Icon = step.icon;
                return (
                  <div
                    key={step.label}
                    className="flex items-center gap-3 rounded-lg border border-card-border bg-input-bg px-4 py-3 animate-pulse"
                    style={{ animationDelay: step.delay }}
                  >
                    <Icon className="h-4 w-4 text-accent" />
                    <span className="text-sm text-foreground">{step.label}</span>
                    <Loader2 className="ml-auto h-3.5 w-3.5 animate-spin text-muted" />
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}

      {/* ================================================================ */}
      {/* Brief Display (latest result)                                    */}
      {/* ================================================================ */}
      {latestBrief && latestBrief.status === "success" && (
        <div className="rounded-xl border border-card-border bg-card">
          {/* Header */}
          <div className="flex items-center justify-between border-b border-card-border px-5 py-3">
            <div className="flex items-center gap-2">
              <CheckCircle2 className="h-4 w-4 text-success" />
              <h2 className="text-sm font-semibold">Morning Brief</h2>
            </div>
            <div className="flex items-center gap-1.5 text-xs text-muted">
              <Clock className="h-3 w-3" />
              {formatTimestamp(latestBrief.timestamp)}
            </div>
          </div>

          {/* Content */}
          <div className="agent-output p-5 text-sm leading-relaxed">
            <pre className="whitespace-pre-wrap break-words font-sans">
              {latestBrief.output}
            </pre>
          </div>
        </div>
      )}

      {/* ================================================================ */}
      {/* Error Display                                                    */}
      {/* ================================================================ */}
      {latestBrief && latestBrief.status === "error" && (
        <div className="rounded-xl border border-danger/30 bg-danger/5 p-5">
          <div className="flex items-start gap-3">
            <AlertCircle className="mt-0.5 h-5 w-5 shrink-0 text-danger" />
            <div>
              <p className="text-sm font-semibold text-danger">
                Failed to generate morning brief
              </p>
              <p className="mt-1 text-sm text-danger/80">
                {latestBrief.error}
              </p>
              <button
                onClick={generateBrief}
                className="mt-3 flex items-center gap-2 rounded-lg bg-danger/10 px-4 py-2 text-sm font-medium text-danger transition-colors hover:bg-danger/20"
              >
                <Play className="h-4 w-4" />
                Try Again
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ================================================================ */}
      {/* Brief History                                                    */}
      {/* ================================================================ */}
      {pastBriefs.length > 0 && (
        <div className="rounded-xl border border-card-border bg-card">
          <div className="flex items-center gap-2 border-b border-card-border px-5 py-4">
            <Clock className="h-4 w-4 text-muted" />
            <h2 className="text-sm font-semibold">Previous Briefs</h2>
            <span className="ml-auto rounded-full bg-accent/10 px-2.5 py-0.5 text-xs font-medium text-accent">
              {pastBriefs.length}
            </span>
          </div>

          <div className="divide-y divide-card-border">
            {pastBriefs.map((brief) => {
              const isExpanded = expandedHistoryIds.has(brief.id);

              return (
                <div key={brief.id}>
                  {/* Collapsible header */}
                  <button
                    onClick={() => toggleHistoryItem(brief.id)}
                    className="flex w-full items-center gap-3 px-5 py-3 text-left transition-colors hover:bg-input-bg/50"
                  >
                    {isExpanded ? (
                      <ChevronDown className="h-4 w-4 shrink-0 text-muted" />
                    ) : (
                      <ChevronRight className="h-4 w-4 shrink-0 text-muted" />
                    )}

                    <div className="flex flex-1 items-center gap-2">
                      {brief.status === "success" ? (
                        <CheckCircle2 className="h-3.5 w-3.5 text-success" />
                      ) : (
                        <AlertCircle className="h-3.5 w-3.5 text-danger" />
                      )}
                      <span className="text-sm font-medium">Morning Brief</span>
                    </div>

                    <div className="flex items-center gap-1.5 text-xs text-muted">
                      <Clock className="h-3 w-3" />
                      {formatShortTimestamp(brief.timestamp)}
                    </div>
                  </button>

                  {/* Expanded content */}
                  {isExpanded && (
                    <div className="border-t border-card-border bg-input-bg/30 px-5 py-4">
                      <div className="mb-2 text-xs text-muted">
                        Generated at {formatTimestamp(brief.timestamp)}
                      </div>
                      {brief.status === "success" ? (
                        <div className="agent-output text-sm leading-relaxed">
                          <pre className="whitespace-pre-wrap break-words font-sans">
                            {brief.output}
                          </pre>
                        </div>
                      ) : (
                        <div className="flex items-start gap-2 text-sm text-danger/80">
                          <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" />
                          {brief.error}
                        </div>
                      )}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* ================================================================ */}
      {/* Empty State (no briefs generated yet)                            */}
      {/* ================================================================ */}
      {briefs.length === 0 && (
        <div className="rounded-xl border border-dashed border-card-border bg-card/50 p-8 text-center">
          <Newspaper className="mx-auto mb-3 h-10 w-10 text-muted/40" />
          <p className="text-sm text-muted">
            No briefs generated yet this session.
          </p>
          <p className="mt-1 text-xs text-muted/60">
            Click &quot;Generate Morning Brief&quot; above to get your daily
            market intelligence.
          </p>
        </div>
      )}
    </div>
  );
}
