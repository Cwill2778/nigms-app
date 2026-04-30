"use client";

import { useEffect, useState } from "react";
import { Play, Square } from "lucide-react";
import type { TimeEntry } from "@/lib/types";

// ─── Types ────────────────────────────────────────────────────────────────────

export interface ClientSubscriptionInfo {
  minutes_used: number;
  monthly_allocation_minutes: number;
  tier: string;
}

interface TimeTrackerProps {
  workOrderId: string;
  totalBillableMinutes: number;
  activeEntry: TimeEntry | null;
  onEntryStarted: (entry: TimeEntry) => void;
  onEntryStopped: (entry: TimeEntry, newTotalMinutes: number) => void;
  /** Optional subscription info for the associated client — shows progress bar */
  clientSubscription?: ClientSubscriptionInfo;
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

function formatElapsed(seconds: number): string {
  const h = Math.floor(seconds / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  const s = seconds % 60;
  return [h, m, s].map((v) => String(v).padStart(2, "0")).join(":");
}

// ─── Component ────────────────────────────────────────────────────────────────

export default function TimeTracker({
  workOrderId,
  totalBillableMinutes,
  activeEntry,
  onEntryStarted,
  onEntryStopped,
  clientSubscription,
}: TimeTrackerProps) {
  const [elapsedSeconds, setElapsedSeconds] = useState<number>(() =>
    activeEntry
      ? Math.floor((Date.now() - new Date(activeEntry.started_at).getTime()) / 1000)
      : 0
  );
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!activeEntry) { setElapsedSeconds(0); return; }
    const initial = Math.floor((Date.now() - new Date(activeEntry.started_at).getTime()) / 1000);
    setElapsedSeconds(initial);
    const interval = setInterval(() => setElapsedSeconds((p) => p + 1), 1000);
    return () => clearInterval(interval);
  }, [activeEntry]);

  async function handleStart() {
    setIsLoading(true); setError(null);
    try {
      const res = await fetch(`/api/admin/work-orders/${workOrderId}/time-entries`, { method: "POST" });
      if (!res.ok) { const b = await res.json().catch(() => ({})); throw new Error(b.error ?? `HTTP ${res.status}`); }
      const body = await res.json();
      // API returns { entry_id } — reconstruct a minimal TimeEntry for the callback
      const entry: TimeEntry = {
        id: body.entry_id ?? body.id,
        work_order_id: workOrderId,
        started_at: new Date().toISOString(),
        stopped_at: null,
        duration_minutes: null,
        created_at: new Date().toISOString(),
      };
      onEntryStarted(entry);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to start timer.");
    } finally { setIsLoading(false); }
  }

  async function handleStop() {
    if (!activeEntry) return;
    setIsLoading(true); setError(null);
    try {
      const res = await fetch(`/api/admin/work-orders/${workOrderId}/time-entries/${activeEntry.id}`, { method: "PATCH" });
      if (!res.ok) { const b = await res.json().catch(() => ({})); throw new Error(b.error ?? `HTTP ${res.status}`); }
      const updated: TimeEntry = await res.json();
      onEntryStopped(updated, totalBillableMinutes + (updated.duration_minutes ?? Math.floor(elapsedSeconds / 60)));
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to stop timer.");
    } finally { setIsLoading(false); }
  }

  const isRunning = activeEntry !== null;
  const totalHours = Math.floor(totalBillableMinutes / 60);
  const totalMins = totalBillableMinutes % 60;

  // Subscription progress bar values
  const subUsed = clientSubscription?.minutes_used ?? 0;
  const subAllocation = clientSubscription?.monthly_allocation_minutes ?? 0;
  const progressPercent = subAllocation > 0
    ? Math.min(100, Math.round((subUsed / subAllocation) * 100))
    : 0;
  const isOverage = subUsed >= subAllocation && subAllocation > 0;

  return (
    <div
      className="flex flex-col gap-3 px-4 py-4"
      style={{
        borderRadius: "var(--radius-md)",
        border: "1px solid var(--color-steel-mid)",
        background: "var(--color-bg-elevated)",
      }}
    >
      {/* Total billable for this work order */}
      <div>
        <div className="stat-label">Total Billable</div>
        <div className="stat-value mt-1">{totalHours}h {totalMins}m</div>
      </div>

      {/* Elapsed timer when running */}
      {isRunning && (
        <div className="flex items-center gap-2">
          <span className="relative flex h-2.5 w-2.5">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full opacity-75" style={{ background: "var(--color-success)" }} />
            <span className="relative inline-flex rounded-full h-2.5 w-2.5" style={{ background: "var(--color-success)" }} />
          </span>
          <span
            className="text-lg"
            style={{ fontFamily: "var(--font-mono)", color: "var(--color-success)" }}
          >
            {formatElapsed(elapsedSeconds)}
          </span>
        </div>
      )}

      {/* Start / Stop controls */}
      <div className="flex items-center gap-2">
        {!isRunning ? (
          <button
            onClick={handleStart}
            disabled={isLoading}
            className="flex items-center gap-1.5 px-3 py-1.5 text-sm font-medium transition-colors disabled:opacity-50"
            style={{
              background: "var(--color-success)",
              color: "#fff",
              borderRadius: "var(--radius-sm)",
            }}
          >
            <Play className="w-4 h-4" /> Start
          </button>
        ) : (
          <button
            onClick={handleStop}
            disabled={isLoading || !activeEntry}
            className="flex items-center gap-1.5 px-3 py-1.5 text-sm font-medium transition-colors disabled:opacity-50"
            style={{
              background: "var(--color-error)",
              color: "#fff",
              borderRadius: "var(--radius-sm)",
            }}
          >
            <Square className="w-4 h-4" /> Stop
          </button>
        )}
      </div>

      {/* Client subscription progress bar */}
      {clientSubscription && (
        <div className="flex flex-col gap-1 mt-1">
          <div className="flex items-center justify-between text-xs" style={{ color: "var(--color-text-secondary)" }}>
            <span>Client Minutes Used</span>
            <span
              style={{
                color: isOverage ? "#F59E0B" : "var(--color-text-primary)",
                fontWeight: isOverage ? 600 : 400,
              }}
            >
              {subUsed} / {subAllocation} Minutes Used
            </span>
          </div>
          <div
            className="w-full h-2 rounded-full overflow-hidden"
            style={{ background: "#E5E7EB" }}
            role="progressbar"
            aria-valuenow={subUsed}
            aria-valuemin={0}
            aria-valuemax={subAllocation}
            aria-label={`${subUsed} of ${subAllocation} minutes used`}
          >
            <div
              className="h-full rounded-full transition-all duration-300"
              style={{
                width: `${progressPercent}%`,
                background: isOverage ? "#F59E0B" : "#FF7F7F", // gold on overage, precision-coral otherwise
              }}
            />
          </div>
          {isOverage && (
            <p className="text-xs font-medium" style={{ color: "#F59E0B" }}>
              ⚠ Overage — additional charges will apply
            </p>
          )}
        </div>
      )}

      {error && (
        <p className="text-xs" style={{ color: "var(--color-error)" }}>{error}</p>
      )}
    </div>
  );
}
