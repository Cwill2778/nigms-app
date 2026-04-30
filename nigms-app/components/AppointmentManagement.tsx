'use client';

import { useState, useEffect, useCallback } from 'react';
import StatusBadge from '@/components/StatusBadge';
import type { Appointment } from '@/lib/types';

// ─── Helpers ──────────────────────────────────────────────────────────────────

function formatDateTime(iso: string): string {
  return new Date(iso).toLocaleString(undefined, {
    weekday: 'short',
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}

function formatDuration(minutes: number): string {
  if (minutes < 60) return `${minutes} min`;
  const h = Math.floor(minutes / 60);
  const m = minutes % 60;
  return m > 0 ? `${h}h ${m}m` : `${h}h`;
}

// ─── Reschedule form ──────────────────────────────────────────────────────────

interface RescheduleFormProps {
  appointmentId: string;
  onSuccess: () => void;
  onCancel: () => void;
}

function RescheduleForm({ appointmentId, onSuccess, onCancel }: RescheduleFormProps) {
  const [newDate, setNewDate] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!newDate) {
      setError('Please select a new date and time.');
      return;
    }

    setSubmitting(true);
    setError(null);

    try {
      const res = await fetch(`/api/client/appointments/${appointmentId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          status: 'scheduled',
          scheduled_at: new Date(newDate).toISOString(),
        }),
      });

      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error((data as { error?: string }).error ?? 'Failed to reschedule');
      }

      onSuccess();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <form
      onSubmit={handleSubmit}
      style={{
        marginTop: '0.75rem',
        padding: '0.75rem',
        borderRadius: 'var(--radius-sm, 6px)',
        background: 'var(--color-bg-surface, #0f1e30)',
        border: '1px solid var(--color-steel-dim, #2a3a52)',
        display: 'flex',
        flexDirection: 'column',
        gap: '0.5rem',
      }}
    >
      <label
        htmlFor={`reschedule-date-${appointmentId}`}
        style={{
          fontSize: '0.75rem',
          fontWeight: 600,
          color: 'var(--color-text-secondary, #a0b0c0)',
          fontFamily: 'var(--font-heading)',
          textTransform: 'uppercase',
          letterSpacing: '0.06em',
        }}
      >
        New Date &amp; Time
      </label>
      <input
        id={`reschedule-date-${appointmentId}`}
        type="datetime-local"
        value={newDate}
        onChange={(e) => setNewDate(e.target.value)}
        min={new Date().toISOString().slice(0, 16)}
        required
        style={{
          padding: '0.4rem 0.6rem',
          borderRadius: 'var(--radius-sm, 6px)',
          border: '1px solid var(--color-navy, #1B263B)',
          background: 'var(--color-bg-elevated, #1e2d42)',
          color: 'var(--color-text-primary, #f0f4f8)',
          fontSize: '0.875rem',
          width: '100%',
        }}
      />
      {error && (
        <p style={{ color: 'var(--color-error, #EF4444)', fontSize: '0.8rem' }}>{error}</p>
      )}
      <div style={{ display: 'flex', gap: '0.5rem' }}>
        <button
          type="submit"
          disabled={submitting}
          style={{
            flex: 1,
            padding: '0.4rem 0.75rem',
            borderRadius: 'var(--radius-sm, 6px)',
            background: 'var(--color-coral, #FF7F7F)',
            color: '#fff',
            fontWeight: 700,
            fontSize: '0.8rem',
            border: 'none',
            cursor: submitting ? 'not-allowed' : 'pointer',
            opacity: submitting ? 0.7 : 1,
            fontFamily: 'var(--font-heading)',
          }}
        >
          {submitting ? 'Saving…' : 'Confirm Reschedule'}
        </button>
        <button
          type="button"
          onClick={onCancel}
          disabled={submitting}
          style={{
            padding: '0.4rem 0.75rem',
            borderRadius: 'var(--radius-sm, 6px)',
            background: 'transparent',
            color: 'var(--color-text-muted, #778DA9)',
            fontWeight: 600,
            fontSize: '0.8rem',
            border: '1px solid var(--color-steel-dim, #2a3a52)',
            cursor: 'pointer',
          }}
        >
          Cancel
        </button>
      </div>
    </form>
  );
}

// ─── Appointment row ──────────────────────────────────────────────────────────

interface AppointmentRowProps {
  appointment: Appointment;
  onRefresh: () => void;
}

function AppointmentRow({ appointment, onRefresh }: AppointmentRowProps) {
  const [showReschedule, setShowReschedule] = useState(false);
  const [cancelling, setCancelling] = useState(false);
  const [cancelError, setCancelError] = useState<string | null>(null);

  const isActionable = appointment.status === 'scheduled';

  async function handleCancel() {
    if (!confirm('Are you sure you want to cancel this appointment?')) return;

    setCancelling(true);
    setCancelError(null);

    try {
      const res = await fetch(`/api/client/appointments/${appointment.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: 'cancelled' }),
      });

      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error((data as { error?: string }).error ?? 'Failed to cancel');
      }

      onRefresh();
    } catch (err) {
      setCancelError(err instanceof Error ? err.message : 'An error occurred');
    } finally {
      setCancelling(false);
    }
  }

  return (
    <div
      style={{
        padding: '1rem',
        borderRadius: 'var(--radius-md, 8px)',
        background: 'var(--color-bg-elevated, #1e2d42)',
        border: '1px solid var(--color-steel-dim, #2a3a52)',
        display: 'flex',
        flexDirection: 'column',
        gap: '0.5rem',
      }}
    >
      {/* Header: date + status badge */}
      <div
        style={{
          display: 'flex',
          alignItems: 'flex-start',
          justifyContent: 'space-between',
          gap: '0.75rem',
          flexWrap: 'wrap',
        }}
      >
        <div>
          <p
            style={{
              fontFamily: 'var(--font-heading)',
              fontWeight: 600,
              fontSize: '0.9rem',
              color: 'var(--color-text-primary, #f0f4f8)',
              margin: 0,
            }}
          >
            {formatDateTime(appointment.scheduled_at)}
          </p>
          <p
            style={{
              fontSize: '0.75rem',
              color: 'var(--color-text-muted, #778DA9)',
              margin: '0.15rem 0 0',
            }}
          >
            Duration: {formatDuration(appointment.duration_minutes)}
          </p>
        </div>
        <StatusBadge status={appointment.status === 'scheduled' ? 'accepted' : appointment.status === 'completed' ? 'completed' : 'cancelled'} />
      </div>

      {/* Notes */}
      {appointment.notes && (
        <p
          style={{
            fontSize: '0.8rem',
            color: 'var(--color-text-secondary, #a0b0c0)',
            margin: 0,
          }}
        >
          {appointment.notes}
        </p>
      )}

      {/* Action buttons */}
      {isActionable && (
        <div style={{ display: 'flex', gap: '0.5rem', marginTop: '0.25rem' }}>
          <button
            type="button"
            onClick={() => setShowReschedule((v) => !v)}
            style={{
              padding: '0.35rem 0.75rem',
              borderRadius: 'var(--radius-sm, 6px)',
              background: 'transparent',
              color: 'var(--color-coral, #FF7F7F)',
              fontWeight: 600,
              fontSize: '0.78rem',
              border: '1px solid var(--color-coral, #FF7F7F)',
              cursor: 'pointer',
              fontFamily: 'var(--font-heading)',
            }}
          >
            {showReschedule ? 'Hide' : 'Reschedule'}
          </button>
          <button
            type="button"
            onClick={handleCancel}
            disabled={cancelling}
            style={{
              padding: '0.35rem 0.75rem',
              borderRadius: 'var(--radius-sm, 6px)',
              background: 'transparent',
              color: 'var(--color-text-muted, #778DA9)',
              fontWeight: 600,
              fontSize: '0.78rem',
              border: '1px solid var(--color-steel-dim, #2a3a52)',
              cursor: cancelling ? 'not-allowed' : 'pointer',
              opacity: cancelling ? 0.7 : 1,
            }}
          >
            {cancelling ? 'Cancelling…' : 'Cancel'}
          </button>
        </div>
      )}

      {cancelError && (
        <p style={{ color: 'var(--color-error, #EF4444)', fontSize: '0.8rem' }}>
          {cancelError}
        </p>
      )}

      {showReschedule && (
        <RescheduleForm
          appointmentId={appointment.id}
          onSuccess={() => {
            setShowReschedule(false);
            onRefresh();
          }}
          onCancel={() => setShowReschedule(false)}
        />
      )}
    </div>
  );
}

// ─── Main Component ───────────────────────────────────────────────────────────

/**
 * AppointmentManagement — lists scheduled appointments with reschedule and
 * cancel actions. Calls PATCH /api/client/appointments/[id] which updates
 * status and triggers admin notification.
 *
 * Requirements: 7.3, 7.4
 */
export default function AppointmentManagement() {
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchAppointments = useCallback(async () => {
    setLoading(true);
    setError(null);

    try {
      const res = await fetch('/api/client/appointments');
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error((data as { error?: string }).error ?? 'Failed to load appointments');
      }
      const data = await res.json() as { appointments: Appointment[] };
      setAppointments(data.appointments ?? []);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchAppointments();
  }, [fetchAppointments]);

  if (loading) {
    return (
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: '0.5rem',
          color: 'var(--color-text-muted, #778DA9)',
          fontSize: '0.875rem',
        }}
      >
        <span
          style={{
            display: 'inline-block',
            width: '1rem',
            height: '1rem',
            borderRadius: '50%',
            background: 'var(--color-coral, #FF7F7F)',
            animation: 'pulse 1.5s ease-in-out infinite',
          }}
        />
        Loading appointments…
      </div>
    );
  }

  if (error) {
    return (
      <p style={{ color: 'var(--color-error, #EF4444)', fontSize: '0.875rem' }}>
        Failed to load appointments: {error}
      </p>
    );
  }

  if (appointments.length === 0) {
    return (
      <p style={{ color: 'var(--color-text-muted, #778DA9)', fontSize: '0.875rem' }}>
        No appointments scheduled.
      </p>
    );
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
      {appointments.map((appt) => (
        <AppointmentRow key={appt.id} appointment={appt} onRefresh={fetchAppointments} />
      ))}
    </div>
  );
}
