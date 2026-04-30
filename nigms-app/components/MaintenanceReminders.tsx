'use client';

/**
 * MaintenanceReminders — displays recurring maintenance prompts for the
 * authenticated client's properties, sorted by due_date ascending.
 *
 * Fetches properties first, then queries maintenance_reminders for those
 * property IDs using the Supabase browser client.
 *
 * Requirements: 7.8
 */

import { useState, useEffect } from 'react';
import { createBrowserClient } from '@/lib/supabase-browser';
import type { MaintenanceReminder } from '@/lib/types';

// ─── Helpers ──────────────────────────────────────────────────────────────────

function formatDate(dateStr: string): string {
  // due_date is a DATE column (YYYY-MM-DD), parse as local date to avoid UTC shift
  const [year, month, day] = dateStr.split('-').map(Number);
  const d = new Date(year, month - 1, day);
  return d.toLocaleDateString(undefined, {
    weekday: 'short',
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  });
}

function isOverdue(dateStr: string): boolean {
  const [year, month, day] = dateStr.split('-').map(Number);
  const due = new Date(year, month - 1, day);
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  return due < today;
}

const recurrenceLabels: Record<MaintenanceReminder['recurrence'], string> = {
  none: 'One-time',
  monthly: 'Monthly',
  quarterly: 'Quarterly',
  biannual: 'Bi-annual',
  annual: 'Annual',
};

const recurrenceBadgeColors: Record<MaintenanceReminder['recurrence'], string> = {
  none: 'var(--color-steel-dim, #2a3a52)',
  monthly: '#1B263B',
  quarterly: '#2563EB',
  biannual: '#7C3AED',
  annual: '#059669',
};

// ─── Reminder card ────────────────────────────────────────────────────────────

interface ReminderCardProps {
  reminder: MaintenanceReminder;
  propertyAddress?: string;
}

function ReminderCard({ reminder, propertyAddress }: ReminderCardProps) {
  const overdue = isOverdue(reminder.due_date);
  const completed = !!reminder.completed_at;

  return (
    <div
      style={{
        padding: '1rem',
        borderRadius: 'var(--radius-md, 8px)',
        background: 'var(--color-bg-elevated, #1e2d42)',
        border: `1px solid ${overdue && !completed ? 'var(--color-coral, #FF7F7F)' : 'var(--color-steel-dim, #2a3a52)'}`,
        display: 'flex',
        flexDirection: 'column',
        gap: '0.4rem',
        opacity: completed ? 0.6 : 1,
      }}
    >
      {/* Title row */}
      <div
        style={{
          display: 'flex',
          alignItems: 'flex-start',
          justifyContent: 'space-between',
          gap: '0.75rem',
          flexWrap: 'wrap',
        }}
      >
        <p
          style={{
            fontFamily: 'var(--font-heading)',
            fontWeight: 700,
            fontSize: '0.9rem',
            color: 'var(--color-text-primary, #f0f4f8)',
            margin: 0,
            textDecoration: completed ? 'line-through' : 'none',
          }}
        >
          {reminder.title}
        </p>

        {/* Recurrence badge */}
        <span
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            padding: '0.15rem 0.55rem',
            borderRadius: '999px',
            background: recurrenceBadgeColors[reminder.recurrence],
            color: '#fff',
            fontSize: '0.7rem',
            fontWeight: 700,
            fontFamily: 'var(--font-heading)',
            letterSpacing: '0.06em',
            textTransform: 'uppercase',
            whiteSpace: 'nowrap',
            flexShrink: 0,
          }}
        >
          {recurrenceLabels[reminder.recurrence]}
        </span>
      </div>

      {/* Due date + overdue indicator */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', flexWrap: 'wrap' }}>
        <p
          style={{
            fontSize: '0.78rem',
            color: overdue && !completed
              ? 'var(--color-coral, #FF7F7F)'
              : 'var(--color-text-muted, #778DA9)',
            margin: 0,
            fontWeight: overdue && !completed ? 600 : 400,
          }}
        >
          Due: {formatDate(reminder.due_date)}
        </p>
        {overdue && !completed && (
          <span
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              padding: '0.1rem 0.45rem',
              borderRadius: '999px',
              background: 'var(--color-coral, #FF7F7F)',
              color: '#fff',
              fontSize: '0.65rem',
              fontWeight: 800,
              fontFamily: 'var(--font-heading)',
              letterSpacing: '0.06em',
              textTransform: 'uppercase',
            }}
          >
            Overdue
          </span>
        )}
        {completed && (
          <span
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              padding: '0.1rem 0.45rem',
              borderRadius: '999px',
              background: '#22C55E',
              color: '#fff',
              fontSize: '0.65rem',
              fontWeight: 800,
              fontFamily: 'var(--font-heading)',
              letterSpacing: '0.06em',
              textTransform: 'uppercase',
            }}
          >
            Completed
          </span>
        )}
      </div>

      {/* Property address */}
      {propertyAddress && (
        <p
          style={{
            fontSize: '0.75rem',
            color: 'var(--color-text-muted, #778DA9)',
            margin: 0,
          }}
        >
          📍 {propertyAddress}
        </p>
      )}

      {/* Description */}
      {reminder.description && (
        <p
          style={{
            fontSize: '0.8rem',
            color: 'var(--color-text-secondary, #a0b0c0)',
            margin: 0,
            marginTop: '0.15rem',
          }}
        >
          {reminder.description}
        </p>
      )}
    </div>
  );
}

// ─── Main Component ───────────────────────────────────────────────────────────

interface ReminderWithAddress extends MaintenanceReminder {
  propertyAddress?: string;
}

/**
 * MaintenanceReminders — fetches and displays recurring maintenance prompts
 * for the authenticated client's properties, sorted by due_date ascending.
 *
 * Requirements: 7.8
 */
export default function MaintenanceReminders() {
  const [reminders, setReminders] = useState<ReminderWithAddress[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const supabase = createBrowserClient();

    async function fetchReminders() {
      setLoading(true);
      setError(null);

      const {
        data: { session },
      } = await supabase.auth.getSession();

      if (!session) {
        setError('Not authenticated');
        setLoading(false);
        return;
      }

      // Step 1: fetch client's properties
      const { data: properties, error: propError } = await supabase
        .from('properties')
        .select('id, address')
        .eq('user_id', session.user.id);

      if (propError) {
        // Table may not exist in dev
        if (propError.code === '42P01') {
          setReminders([]);
          setLoading(false);
          return;
        }
        setError(propError.message);
        setLoading(false);
        return;
      }

      if (!properties || properties.length === 0) {
        setReminders([]);
        setLoading(false);
        return;
      }

      const propertyIds = (properties as { id: string; address: string }[]).map((p) => p.id);
      const addressMap = Object.fromEntries(
        (properties as { id: string; address: string }[]).map((p) => [p.id, p.address]),
      );

      // Step 2: fetch reminders for those property IDs, sorted by due_date
      const { data: rows, error: remError } = await supabase
        .from('maintenance_reminders')
        .select('*')
        .in('property_id', propertyIds)
        .order('due_date', { ascending: true });

      if (remError) {
        if (remError.code === '42P01') {
          setReminders([]);
          setLoading(false);
          return;
        }
        setError(remError.message);
        setLoading(false);
        return;
      }

      const enriched: ReminderWithAddress[] = ((rows as MaintenanceReminder[]) ?? []).map(
        (r) => ({
          ...r,
          propertyAddress: addressMap[r.property_id],
        }),
      );

      setReminders(enriched);
      setLoading(false);
    }

    fetchReminders();
  }, []);

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
        Loading maintenance reminders…
      </div>
    );
  }

  if (error) {
    return (
      <p style={{ color: 'var(--color-error, #EF4444)', fontSize: '0.875rem' }}>
        Failed to load reminders: {error}
      </p>
    );
  }

  if (reminders.length === 0) {
    return (
      <p style={{ color: 'var(--color-text-muted, #778DA9)', fontSize: '0.875rem' }}>
        No maintenance reminders scheduled.
      </p>
    );
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
      {reminders.map((reminder) => (
        <ReminderCard
          key={reminder.id}
          reminder={reminder}
          propertyAddress={reminder.propertyAddress}
        />
      ))}
    </div>
  );
}
