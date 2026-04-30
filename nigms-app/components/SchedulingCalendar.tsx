'use client';

import { useState, useEffect, useCallback } from 'react';
import { createBrowserClient } from '@/lib/supabase-browser';
import type { Appointment } from '@/lib/types';

// ─── Types ────────────────────────────────────────────────────────────────────

interface AppointmentWithClient extends Appointment {
  client_name?: string | null;
  work_order_title?: string | null;
}

type ViewMode = 'month' | 'week';

// ─── Helpers ──────────────────────────────────────────────────────────────────

function formatTime(isoString: string): string {
  return new Date(isoString).toLocaleTimeString('en-US', {
    hour: 'numeric',
    minute: '2-digit',
    hour12: true,
  });
}

function formatDate(isoString: string): string {
  return new Date(isoString).toLocaleDateString('en-US', {
    weekday: 'short',
    month: 'short',
    day: 'numeric',
  });
}

function formatDuration(minutes: number): string {
  if (minutes < 60) return `${minutes}m`;
  const h = Math.floor(minutes / 60);
  const m = minutes % 60;
  return m > 0 ? `${h}h ${m}m` : `${h}h`;
}

/** Returns the ISO date string (YYYY-MM-DD) for a given Date */
function toDateKey(date: Date): string {
  return date.toISOString().slice(0, 10);
}

/** Returns an array of Date objects for the current week (Sun–Sat) */
function getWeekDays(anchor: Date): Date[] {
  const start = new Date(anchor);
  start.setDate(anchor.getDate() - anchor.getDay());
  return Array.from({ length: 7 }, (_, i) => {
    const d = new Date(start);
    d.setDate(start.getDate() + i);
    return d;
  });
}

/** Returns an array of Date objects for all days in the month of `anchor` */
function getMonthDays(anchor: Date): Date[] {
  const year = anchor.getFullYear();
  const month = anchor.getMonth();
  const firstDay = new Date(year, month, 1);
  const lastDay = new Date(year, month + 1, 0);
  const days: Date[] = [];
  for (let d = new Date(firstDay); d <= lastDay; d.setDate(d.getDate() + 1)) {
    days.push(new Date(d));
  }
  return days;
}

// ─── Status color ─────────────────────────────────────────────────────────────

const STATUS_COLORS: Record<string, string> = {
  scheduled: 'var(--color-accent-orange, #FF6B00)',
  completed: 'var(--color-status-green, #22C55E)',
  cancelled: 'var(--color-steel-bright, #8C8880)',
};

// ─── Appointment card ─────────────────────────────────────────────────────────

function AppointmentCard({ appt }: { appt: AppointmentWithClient }) {
  const color = STATUS_COLORS[appt.status] ?? STATUS_COLORS.scheduled;
  return (
    <div
      style={{
        background: 'var(--color-bg-elevated, #222120)',
        border: `1px solid ${color}44`,
        borderLeft: `3px solid ${color}`,
        borderRadius: '2px',
        padding: '0.4rem 0.6rem',
        marginBottom: '0.35rem',
        fontSize: '0.78rem',
      }}
    >
      <div
        style={{
          fontWeight: 600,
          color: 'var(--color-text-primary, #F2EDE8)',
          marginBottom: '0.15rem',
          lineHeight: 1.3,
        }}
      >
        {formatTime(appt.scheduled_at)}
        {appt.client_name && (
          <span
            style={{
              marginLeft: '0.4rem',
              color: 'var(--color-text-secondary, #C4BFB8)',
              fontWeight: 400,
            }}
          >
            — {appt.client_name}
          </span>
        )}
      </div>
      {appt.work_order_title && (
        <div
          style={{
            fontSize: '0.72rem',
            color: 'var(--color-text-muted, #6B6560)',
            marginBottom: '0.15rem',
          }}
        >
          {appt.work_order_title}
        </div>
      )}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: '0.5rem',
        }}
      >
        <span
          style={{
            fontSize: '0.65rem',
            color: 'var(--color-text-muted, #6B6560)',
          }}
        >
          {formatDuration(appt.duration_minutes)}
        </span>
        <span
          style={{
            fontSize: '0.62rem',
            fontWeight: 700,
            letterSpacing: '0.06em',
            textTransform: 'uppercase',
            color,
          }}
        >
          {appt.status}
        </span>
      </div>
    </div>
  );
}

// ─── Day cell ─────────────────────────────────────────────────────────────────

function DayCell({
  date,
  appointments,
  isToday,
}: {
  date: Date;
  appointments: AppointmentWithClient[];
  isToday: boolean;
}) {
  const dayNum = date.getDate();
  const dayLabel = date.toLocaleDateString('en-US', { weekday: 'short' });

  return (
    <div
      style={{
        background: isToday
          ? 'var(--color-navy-mid, #243660)'
          : 'var(--color-bg-surface, #1A1917)',
        border: isToday
          ? '1px solid var(--color-accent-orange, #FF6B00)'
          : '1px solid var(--color-steel-dim, #38352F)',
        borderRadius: '3px',
        padding: '0.5rem',
        minHeight: '100px',
      }}
    >
      <div
        style={{
          display: 'flex',
          alignItems: 'baseline',
          gap: '0.3rem',
          marginBottom: '0.4rem',
        }}
      >
        <span
          style={{
            fontSize: '0.65rem',
            fontWeight: 700,
            letterSpacing: '0.06em',
            textTransform: 'uppercase',
            color: isToday
              ? 'var(--color-accent-orange, #FF6B00)'
              : 'var(--color-text-muted, #6B6560)',
          }}
        >
          {dayLabel}
        </span>
        <span
          style={{
            fontSize: '0.9rem',
            fontWeight: isToday ? 800 : 600,
            color: isToday
              ? 'var(--color-accent-orange, #FF6B00)'
              : 'var(--color-text-secondary, #C4BFB8)',
          }}
        >
          {dayNum}
        </span>
      </div>
      {appointments.map((appt) => (
        <AppointmentCard key={appt.id} appt={appt} />
      ))}
    </div>
  );
}

// ─── SchedulingCalendar ───────────────────────────────────────────────────────

/**
 * SchedulingCalendar — Dynamic Scheduling & Dispatch (Requirement 8.3)
 *
 * Client component that fetches all appointments from Supabase and renders
 * them in a month or week grid view. Each appointment shows date, time,
 * client name, and duration.
 */
export default function SchedulingCalendar() {
  const [appointments, setAppointments] = useState<AppointmentWithClient[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [viewMode, setViewMode] = useState<ViewMode>('week');
  const [anchor, setAnchor] = useState(() => new Date());

  const fetchAppointments = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const supabase = createBrowserClient();

      // Fetch appointments with joined client names and work order titles
      const { data, error: fetchError } = await supabase
        .from('appointments')
        .select(
          `
          id,
          client_id,
          work_order_id,
          scheduled_at,
          duration_minutes,
          notes,
          status,
          created_at,
          updated_at
        `
        )
        .order('scheduled_at', { ascending: true });

      if (fetchError) throw fetchError;

      const appts = (data ?? []) as AppointmentWithClient[];

      // Enrich with client names if possible
      if (appts.length > 0) {
        const clientIds = [...new Set(appts.map((a) => a.client_id))];
        const { data: profiles } = await supabase
          .from('users')
          .select('id, full_name')
          .in('id', clientIds);

        const profileMap = new Map(
          (profiles ?? []).map((p: { id: string; full_name: string | null }) => [
            p.id,
            p.full_name,
          ])
        );

        // Enrich with work order titles if possible
        const woIds = appts
          .map((a) => a.work_order_id)
          .filter((id): id is string => id !== null);

        let woMap = new Map<string, string>();
        if (woIds.length > 0) {
          const { data: workOrders } = await supabase
            .from('work_orders')
            .select('id, title')
            .in('id', woIds);
          woMap = new Map(
            (workOrders ?? []).map((wo: { id: string; title: string }) => [
              wo.id,
              wo.title,
            ])
          );
        }

        setAppointments(
          appts.map((a) => ({
            ...a,
            client_name: profileMap.get(a.client_id) ?? null,
            work_order_title: a.work_order_id ? woMap.get(a.work_order_id) ?? null : null,
          }))
        );
      } else {
        setAppointments([]);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load appointments');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchAppointments();
  }, [fetchAppointments]);

  // Group appointments by date key
  const appointmentsByDate = appointments.reduce<
    Record<string, AppointmentWithClient[]>
  >((acc, appt) => {
    const key = toDateKey(new Date(appt.scheduled_at));
    if (!acc[key]) acc[key] = [];
    acc[key].push(appt);
    return acc;
  }, {});

  const today = toDateKey(new Date());

  // Navigation
  const navigate = (direction: -1 | 1) => {
    setAnchor((prev) => {
      const next = new Date(prev);
      if (viewMode === 'week') {
        next.setDate(prev.getDate() + direction * 7);
      } else {
        next.setMonth(prev.getMonth() + direction);
      }
      return next;
    });
  };

  const goToToday = () => setAnchor(new Date());

  // Days to display
  const days = viewMode === 'week' ? getWeekDays(anchor) : getMonthDays(anchor);

  // Period label
  const periodLabel =
    viewMode === 'week'
      ? (() => {
          const weekDays = getWeekDays(anchor);
          const start = weekDays[0];
          const end = weekDays[6];
          return `${start.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })} – ${end.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}`;
        })()
      : anchor.toLocaleDateString('en-US', { month: 'long', year: 'numeric' });

  // List view: appointments in the current period
  const periodStart = days[0];
  const periodEnd = days[days.length - 1];
  const periodAppointments = appointments.filter((a) => {
    const d = new Date(a.scheduled_at);
    return d >= periodStart && d <= new Date(periodEnd.getTime() + 86400000);
  });

  // Group by date for list view
  const groupedByDate = periodAppointments.reduce<
    Record<string, AppointmentWithClient[]>
  >((acc, appt) => {
    const key = toDateKey(new Date(appt.scheduled_at));
    if (!acc[key]) acc[key] = [];
    acc[key].push(appt);
    return acc;
  }, {});

  return (
    <div>
      {/* Toolbar */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: '0.75rem',
          marginBottom: '1rem',
          flexWrap: 'wrap',
        }}
      >
        {/* View toggle */}
        <div
          style={{
            display: 'flex',
            border: '1px solid var(--color-steel-mid, #5A5650)',
            borderRadius: '3px',
            overflow: 'hidden',
          }}
        >
          {(['week', 'month'] as ViewMode[]).map((mode) => (
            <button
              key={mode}
              onClick={() => setViewMode(mode)}
              style={{
                padding: '0.35rem 0.75rem',
                fontSize: '0.72rem',
                fontWeight: 700,
                letterSpacing: '0.06em',
                textTransform: 'uppercase',
                border: 'none',
                cursor: 'pointer',
                background:
                  viewMode === mode
                    ? 'var(--color-accent-orange, #FF6B00)'
                    : 'var(--color-bg-elevated, #222120)',
                color:
                  viewMode === mode
                    ? 'var(--color-text-inverse, #111110)'
                    : 'var(--color-text-secondary, #C4BFB8)',
                transition: 'background 0.15s ease, color 0.15s ease',
              }}
            >
              {mode}
            </button>
          ))}
        </div>

        {/* Navigation */}
        <button
          onClick={() => navigate(-1)}
          className="btn-ghost"
          style={{ padding: '0.35rem 0.6rem' }}
          aria-label="Previous period"
        >
          ‹
        </button>
        <span
          style={{
            fontSize: '0.85rem',
            fontWeight: 600,
            color: 'var(--color-text-primary, #F2EDE8)',
            minWidth: '180px',
            textAlign: 'center',
          }}
        >
          {periodLabel}
        </span>
        <button
          onClick={() => navigate(1)}
          className="btn-ghost"
          style={{ padding: '0.35rem 0.6rem' }}
          aria-label="Next period"
        >
          ›
        </button>

        <button onClick={goToToday} className="btn-secondary" style={{ padding: '0.35rem 0.75rem', fontSize: '0.72rem' }}>
          Today
        </button>

        <button
          onClick={fetchAppointments}
          className="btn-ghost"
          style={{ marginLeft: 'auto', fontSize: '0.72rem' }}
          aria-label="Refresh appointments"
        >
          ↻ Refresh
        </button>
      </div>

      {/* Error */}
      {error && (
        <div className="alert alert-error" style={{ marginBottom: '1rem' }} role="alert">
          {error}
        </div>
      )}

      {/* Loading */}
      {loading ? (
        <div
          style={{
            padding: '2rem',
            textAlign: 'center',
            color: 'var(--color-text-muted, #6B6560)',
            fontSize: '0.875rem',
          }}
        >
          Loading appointments…
        </div>
      ) : viewMode === 'week' ? (
        /* ── Week grid ── */
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(7, 1fr)',
            gap: '0.5rem',
          }}
        >
          {days.map((day) => {
            const key = toDateKey(day);
            return (
              <DayCell
                key={key}
                date={day}
                appointments={appointmentsByDate[key] ?? []}
                isToday={key === today}
              />
            );
          })}
        </div>
      ) : (
        /* ── Month list view ── */
        <div>
          {Object.keys(groupedByDate).length === 0 ? (
            <div
              style={{
                padding: '2rem',
                textAlign: 'center',
                color: 'var(--color-text-muted, #6B6560)',
                fontSize: '0.875rem',
                fontStyle: 'italic',
              }}
            >
              No appointments scheduled for this period.
            </div>
          ) : (
            Object.entries(groupedByDate)
              .sort(([a], [b]) => a.localeCompare(b))
              .map(([dateKey, appts]) => (
                <div key={dateKey} style={{ marginBottom: '1.25rem' }}>
                  <div
                    style={{
                      fontSize: '0.72rem',
                      fontWeight: 800,
                      letterSpacing: '0.1em',
                      textTransform: 'uppercase',
                      color: dateKey === today
                        ? 'var(--color-accent-orange, #FF6B00)'
                        : 'var(--color-steel-shine, #C4BFB8)',
                      marginBottom: '0.5rem',
                      paddingBottom: '0.25rem',
                      borderBottom: '1px solid var(--color-steel-dim, #38352F)',
                    }}
                  >
                    {formatDate(dateKey + 'T00:00:00')}
                    {dateKey === today && (
                      <span
                        style={{
                          marginLeft: '0.5rem',
                          color: 'var(--color-accent-orange, #FF6B00)',
                          fontSize: '0.65rem',
                        }}
                      >
                        TODAY
                      </span>
                    )}
                  </div>
                  {appts.map((appt) => (
                    <AppointmentCard key={appt.id} appt={appt} />
                  ))}
                </div>
              ))
          )}
        </div>
      )}

      {/* Summary */}
      {!loading && (
        <div
          style={{
            marginTop: '1rem',
            fontSize: '0.72rem',
            color: 'var(--color-text-muted, #6B6560)',
            textAlign: 'right',
          }}
        >
          {periodAppointments.length} appointment{periodAppointments.length !== 1 ? 's' : ''} in this period
        </div>
      )}
    </div>
  );
}
