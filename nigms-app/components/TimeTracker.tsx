"use client";

import { useEffect, useState } from "react";
import { Play, Square } from "lucide-react";
import type { TimeEntry } from "@/lib/types";

interface TimeTrackerProps {
  workOrderId: string;
  totalBillableMinutes: number;
  activeEntry: TimeEntry | null;
  onEntryStarted: (entry: TimeEntry) => void;
  onEntryStopped: (entry: TimeEntry, newTotalMinutes: number) => void;
}

function formatElapsed(seconds: number): string {
  const h = Math.floor(seconds / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  const s = seconds % 60;
  return [h, m, s].map((v) => String(v).padStart(2, "0")).join(":");
}

export default function TimeTracker({
  workOrderId,
  totalBillableMinutes,
  activeEntry,
  onEntryStarted,
  onEntryStopped,
}: TimeTrackerProps) {
  const [elapsedSeconds, setElapsedSeconds] = useState<number>(() => {
    if (!activeEntry) return 0;
    return Math.floor(
      (Date.now() - new Date(activeEntry.started_at).getTime()) / 1000
    );
  });
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Reset elapsed when activeEntry changes
  useEffect(() => {
    if (!activeEntry) {
      setElapsedSeconds(0);
      return;
    }
    const initial = Math.floor(
      (Date.now() - new Date(activeEntry.started_at).getTime()) / 1000
    );
    setElapsedSeconds(initial);

    const interval = setInterval(() => {
      setElapsedSeconds((prev) => prev + 1);
    }, 1000);

    return () => clearInterval(interval);
  }, [activeEntry]);

  async function handleStart() {
    setIsLoading(true);
    setError(null);
    try {
      const res = await fetch(
        `/api/admin/work-orders/${workOrderId}/time-entries`,
        { method: "POST" }
      );
      if (!res.ok) {
        const body = await res.json().catch(() => ({}));
        throw new Error(body.error ?? `HTTP ${res.status}`);
      }
      const newEntry: TimeEntry = await res.json();
      onEntryStarted(newEntry);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to start timer.");
    } finally {
      setIsLoading(false);
    }
  }

  async function handleStop() {
    if (!activeEntry) return;
    setIsLoading(true);
    setError(null);
    try {
      const res = await fetch(
        `/api/admin/work-orders/${workOrderId}/time-entries/${activeEntry.id}`,
        { method: "PATCH" }
      );
      if (!res.ok) {
        const body = await res.json().catch(() => ({}));
        throw new Error(body.error ?? `HTTP ${res.status}`);
      }
      const updatedEntry: TimeEntry = await res.json();
      const addedMinutes = updatedEntry.duration_minutes ?? Math.floor(elapsedSeconds / 60);
      onEntryStopped(updatedEntry, totalBillableMinutes + addedMinutes);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to stop timer.");
    } finally {
      setIsLoading(false);
    }
  }

  const isRunning = activeEntry !== null;
  const totalHours = Math.floor(totalBillableMinutes / 60);
  const totalMins = totalBillableMinutes % 60;

  return (
    <div className="rounded-md border border-[#4A4A4A] bg-[#0d2550] px-4 py-4 flex flex-col gap-3">
      {/* Total accumulated */}
      <div>
        <p className="text-xs text-gray-400 uppercase tracking-widest mb-1">
          Total Billable
        </p>
        <p className="text-2xl font-semibold text-white">
          {totalHours}h {totalMins}m
        </p>
      </div>

      {/* Live elapsed */}
      {isRunning && (
        <div className="flex items-center gap-2">
          {/* Pulsing green dot */}
          <span className="relative flex h-2.5 w-2.5">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75" />
            <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-green-500" />
          </span>
          <span className="text-lg font-mono text-green-400">
            {formatElapsed(elapsedSeconds)}
          </span>
        </div>
      )}

      {/* Controls */}
      <div className="flex items-center gap-2">
        {!isRunning ? (
          <button
            onClick={handleStart}
            disabled={isLoading}
            className="flex items-center gap-1.5 px-3 py-1.5 text-sm font-medium bg-green-600 hover:bg-green-700 disabled:opacity-50 text-white rounded-md transition-colors"
          >
            <Play className="w-4 h-4" />
            Start
          </button>
        ) : (
          <button
            onClick={handleStop}
            disabled={isLoading || !activeEntry}
            className="flex items-center gap-1.5 px-3 py-1.5 text-sm font-medium bg-red-600 hover:bg-red-700 disabled:opacity-50 text-white rounded-md transition-colors"
          >
            <Square className="w-4 h-4" />
            Stop
          </button>
        )}
      </div>

      {error && <p className="text-xs text-red-400">{error}</p>}
    </div>
  );
}
