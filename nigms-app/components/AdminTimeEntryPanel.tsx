'use client';

import { useState, useEffect, useCallback } from 'react';
import { createBrowserClient } from '@/lib/supabase-browser';
import TimeTracker, { type ClientSubscriptionInfo } from '@/components/TimeTracker';
import type { TimeEntry } from '@/lib/types';

// ─── Types ────────────────────────────────────────────────────────────────────

interface AdminTimeEntryPanelProps {
  workOrderId: string;
  /** Optional subscription info for the associated client — passed to TimeTracker */
  clientSubscription?: ClientSubscriptionInfo;
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

function formatDuration(minutes: number | null): string {
  if (minutes === null) return '—';
  const h = Math.floor(minutes / 60);
  const m = minutes % 60;
  if (h === 0) return `${m}m`;
  return `${h}h ${m}m`;
}

function formatDateTime(iso: string): string {
  return new Date(iso).toLocaleString(undefined, {
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}

// ─── Component ────────────────────────────────────────────────────────────────

/**
 * AdminTimeEntryPanel — admin UI to start/stop time entries against a work
 * order using the TimeTracker component. Displays running entries and history.
 *
 * Requirements: 8.8
 */
export default function AdminTimeEntryPanel({
  workOrderId,
  clientSubscription,
}: AdminTimeEntryPanelProps) {
  const [entries, setEntries] = useState<TimeEntry[]>([]);
  const [activeEntry, setActiveEntry] = useState<TimeEntry | null>(null);
  const [totalBillableMinutes, setTotalBillableMinutes] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchEntries = useCallback(async () => {
    setError(null);
    try {
      const supabase = createBrowserClient();
      const { data, error: fetchError } = await supabase
        .from('time_entries')
        .select('*')
        .eq('work_order_id', workOrderId)
        .order('started_at', { ascending: false });

      if (fetchError) throw new Error(fetchError.message);

      const allEntries = (data as TimeEntry[]) ?? [];
      setEntries(allEntries);

      // Find any running entry (no stopped_at)
      const running = allEntries.find((e) => e.stopped_at === null) ?? null;
      setActiveEntry(running);

      // Sum completed durations
      const total = allEntries.reduce((sum, e) => sum + (e.duration_minutes ?? 0), 0);
      setTotalBillableMinutes(total);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load time entries.');
    } finally {
      setLoading(false);
    }
  }, [workOrderId]);

  useEffect(() => {
    fetchEntries();
  }, [fetchEntries]);

  function handleEntryStarted(entry: TimeEntry) {
    setActiveEntry(entry);
    setEntries((prev) => [entry, ...prev]);
  }

  function handleEntryStopped(updatedEntry: TimeEntry, newTotalMinutes: number) {
    setActiveEntry(null);
    setTotalBillableMinutes(newTotalMinutes);
    setEntries((prev) =>
      prev.map((e) => (e.id === updatedEntry.id ? updatedEntry : e))
    );
  }

  const completedEntries = entries.filter((e) => e.stopped_at !== null);
  const totalCompletedMinutes = completedEntries.reduce(
    (sum, e) => sum + (e.duration_minutes ?? 0),
    0
  );

  return (
    <div className="flex flex-col gap-6">
      {/* Time Tracker controls */}
      <div>
        <h3
          className="text-sm font-semibold mb-3"
          style={{ color: 'var(--color-text-primary)' }}
        >
          Time Tracker
        </h3>
        <TimeTracker
          workOrderId={workOrderId}
          totalBillableMinutes={totalBillableMinutes}
          activeEntry={activeEntry}
          onEntryStarted={handleEntryStarted}
          onEntryStopped={handleEntryStopped}
          clientSubscription={clientSubscription}
        />
      </div>

      {/* Entry history */}
      <div>
        <h3
          className="text-sm font-semibold mb-3"
          style={{ color: 'var(--color-text-primary)' }}
        >
          Time Entry History
        </h3>

        {loading ? (
          <div
            className="flex items-center gap-2 text-sm"
            style={{ color: 'var(--color-text-muted)' }}
          >
            <span
              className="inline-block w-3 h-3 rounded-full animate-pulse"
              style={{ background: '#FF7F7F' }}
              aria-hidden="true"
            />
            Loading entries…
          </div>
        ) : error ? (
          <p className="text-sm" style={{ color: 'var(--color-error, #EF4444)' }} role="alert">
            {error}
          </p>
        ) : completedEntries.length === 0 && !activeEntry ? (
          <p className="text-sm" style={{ color: 'var(--color-text-muted)' }}>
            No time entries yet. Start the timer above to log time.
          </p>
        ) : (
          <div
            className="rounded-lg overflow-hidden"
            style={{ border: '1px solid var(--color-steel-mid)' }}
          >
            <table className="w-full text-sm">
              <thead>
                <tr style={{ background: 'var(--color-bg-elevated)' }}>
                  <th
                    className="px-4 py-2.5 text-left text-xs font-semibold uppercase tracking-wide"
                    style={{ color: 'var(--color-text-muted)' }}
                  >
                    Started
                  </th>
                  <th
                    className="px-4 py-2.5 text-left text-xs font-semibold uppercase tracking-wide"
                    style={{ color: 'var(--color-text-muted)' }}
                  >
                    Stopped
                  </th>
                  <th
                    className="px-4 py-2.5 text-right text-xs font-semibold uppercase tracking-wide"
                    style={{ color: 'var(--color-text-muted)' }}
                  >
                    Duration
                  </th>
                </tr>
              </thead>
              <tbody>
                {/* Running entry (if any) */}
                {activeEntry && (
                  <tr
                    key={activeEntry.id}
                    style={{ borderTop: '1px solid var(--color-steel-dim)' }}
                  >
                    <td
                      className="px-4 py-3"
                      style={{ color: 'var(--color-text-primary)' }}
                    >
                      {formatDateTime(activeEntry.started_at)}
                    </td>
                    <td className="px-4 py-3">
                      <span
                        className="inline-flex items-center gap-1.5 text-xs font-medium px-2 py-0.5 rounded-full"
                        style={{ background: '#DCFCE7', color: '#15803D' }}
                      >
                        <span
                          className="w-1.5 h-1.5 rounded-full animate-pulse"
                          style={{ background: '#22C55E' }}
                          aria-hidden="true"
                        />
                        Running
                      </span>
                    </td>
                    <td
                      className="px-4 py-3 text-right text-xs"
                      style={{ color: 'var(--color-text-muted)' }}
                    >
                      —
                    </td>
                  </tr>
                )}

                {/* Completed entries */}
                {completedEntries.map((entry) => (
                  <tr
                    key={entry.id}
                    style={{ borderTop: '1px solid var(--color-steel-dim)' }}
                  >
                    <td
                      className="px-4 py-3"
                      style={{ color: 'var(--color-text-primary)' }}
                    >
                      {formatDateTime(entry.started_at)}
                    </td>
                    <td
                      className="px-4 py-3"
                      style={{ color: 'var(--color-text-secondary)' }}
                    >
                      {entry.stopped_at ? formatDateTime(entry.stopped_at) : '—'}
                    </td>
                    <td
                      className="px-4 py-3 text-right font-medium"
                      style={{ color: 'var(--color-text-primary)' }}
                    >
                      {formatDuration(entry.duration_minutes)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {/* Total billable minutes */}
        {!loading && completedEntries.length > 0 && (
          <div
            className="mt-3 flex items-center justify-between px-4 py-2.5 rounded-md"
            style={{
              background: 'var(--color-bg-elevated)',
              border: '1px solid var(--color-steel-mid)',
            }}
          >
            <span className="text-xs font-medium" style={{ color: 'var(--color-text-muted)' }}>
              Total Billable Minutes
            </span>
            <span
              className="text-sm font-bold"
              style={{ color: '#1B263B' }}
            >
              {totalCompletedMinutes} min ({formatDuration(totalCompletedMinutes)})
            </span>
          </div>
        )}
      </div>
    </div>
  );
}
