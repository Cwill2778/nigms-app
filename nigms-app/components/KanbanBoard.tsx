'use client';

import { useState, useTransition } from 'react';
import type { WorkOrder, WorkOrderStatus } from '@/lib/types';
import StatusBadge from '@/components/StatusBadge';

// ─── Column definitions ───────────────────────────────────────────────────────

interface KanbanColumn {
  id: WorkOrderStatus | 'invoiced';
  label: string;
  /** The actual DB status this column maps to */
  dbStatus: WorkOrderStatus;
  headerColor: string;
}

const COLUMNS: KanbanColumn[] = [
  {
    id: 'pending',
    label: 'New',
    dbStatus: 'pending',
    headerColor: 'var(--color-precision-coral, #FF7F7F)',
  },
  {
    id: 'accepted',
    label: 'Accepted',
    dbStatus: 'accepted',
    headerColor: 'var(--color-status-gold, #F59E0B)',
  },
  {
    id: 'in_progress',
    label: 'In Progress',
    dbStatus: 'in_progress',
    headerColor: 'var(--color-status-gold, #F59E0B)',
  },
  {
    id: 'completed',
    label: 'Completed',
    dbStatus: 'completed',
    headerColor: 'var(--color-status-green, #22C55E)',
  },
  {
    id: 'invoiced',
    label: 'Invoiced',
    dbStatus: 'completed',
    headerColor: 'var(--color-trust-navy, #1B263B)',
  },
];

// Columns the user can move a card TO (excludes 'invoiced' as a target — it's a display state)
const MOVEABLE_STATUSES: { value: WorkOrderStatus; label: string }[] = [
  { value: 'pending', label: 'New' },
  { value: 'accepted', label: 'Accepted' },
  { value: 'in_progress', label: 'In Progress' },
  { value: 'completed', label: 'Completed' },
];

// ─── Urgency badge ────────────────────────────────────────────────────────────

const URGENCY_COLORS: Record<string, { bg: string; color: string }> = {
  low: { bg: 'rgba(119,141,169,0.15)', color: '#778DA9' },
  medium: { bg: 'rgba(245,158,11,0.15)', color: '#F59E0B' },
  high: { bg: 'rgba(255,107,0,0.15)', color: '#FF6B00' },
  emergency: { bg: 'rgba(239,68,68,0.15)', color: '#EF4444' },
};

function UrgencyBadge({ urgency }: { urgency: string | null }) {
  if (!urgency) return null;
  const style = URGENCY_COLORS[urgency] ?? URGENCY_COLORS.low;
  return (
    <span
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        padding: '0.15rem 0.45rem',
        fontSize: '0.62rem',
        fontWeight: 700,
        letterSpacing: '0.08em',
        textTransform: 'uppercase',
        borderRadius: '2px',
        background: style.bg,
        color: style.color,
        border: `1px solid ${style.color}40`,
      }}
    >
      {urgency}
    </span>
  );
}

// ─── Kanban card ──────────────────────────────────────────────────────────────

interface KanbanCardProps {
  workOrder: WorkOrder & { client_name?: string | null };
  onMove: (id: string, newStatus: WorkOrderStatus) => void;
  isPending: boolean;
}

function KanbanCard({ workOrder, onMove, isPending }: KanbanCardProps) {
  const [menuOpen, setMenuOpen] = useState(false);

  const availableTargets = MOVEABLE_STATUSES.filter(
    (s) => s.value !== workOrder.status
  );

  return (
    <div
      style={{
        background: 'var(--color-bg-elevated, #222120)',
        border: '1px solid var(--color-steel-dim, #38352F)',
        borderRadius: '3px',
        padding: '0.75rem',
        marginBottom: '0.5rem',
        opacity: isPending ? 0.6 : 1,
        transition: 'opacity 0.15s ease, box-shadow 0.15s ease',
        boxShadow: '0 1px 4px rgba(0,0,0,0.3)',
        position: 'relative',
      }}
    >
      {/* WO number + title */}
      <div style={{ marginBottom: '0.4rem' }}>
        {workOrder.wo_number && (
          <span
            style={{
              fontSize: '0.65rem',
              fontWeight: 700,
              letterSpacing: '0.08em',
              textTransform: 'uppercase',
              color: 'var(--color-steel-bright, #8C8880)',
              marginRight: '0.4rem',
            }}
          >
            {workOrder.wo_number}
          </span>
        )}
        <span
          style={{
            fontSize: '0.85rem',
            fontWeight: 600,
            color: 'var(--color-text-primary, #F2EDE8)',
            lineHeight: 1.3,
          }}
        >
          {workOrder.title}
        </span>
      </div>

      {/* Client name */}
      {workOrder.client_name && (
        <div
          style={{
            fontSize: '0.75rem',
            color: 'var(--color-text-muted, #6B6560)',
            marginBottom: '0.4rem',
          }}
        >
          {workOrder.client_name}
        </div>
      )}

      {/* Badges row */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: '0.35rem',
          flexWrap: 'wrap',
          marginBottom: '0.5rem',
        }}
      >
        <StatusBadge status={workOrder.status} />
        <UrgencyBadge urgency={workOrder.urgency} />
      </div>

      {/* Move to dropdown */}
      {availableTargets.length > 0 && (
        <div style={{ position: 'relative' }}>
          <button
            onClick={() => setMenuOpen((v) => !v)}
            disabled={isPending}
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '0.3rem',
              padding: '0.25rem 0.6rem',
              fontSize: '0.7rem',
              fontWeight: 700,
              letterSpacing: '0.06em',
              textTransform: 'uppercase',
              background: 'transparent',
              color: 'var(--color-accent-orange, #FF6B00)',
              border: '1px solid var(--color-accent-orange, #FF6B00)',
              borderRadius: '2px',
              cursor: isPending ? 'not-allowed' : 'pointer',
              transition: 'background 0.1s ease',
            }}
            onMouseEnter={(e) => {
              (e.currentTarget as HTMLButtonElement).style.background =
                'rgba(255,107,0,0.1)';
            }}
            onMouseLeave={(e) => {
              (e.currentTarget as HTMLButtonElement).style.background =
                'transparent';
            }}
          >
            Move to ▾
          </button>

          {menuOpen && (
            <div
              style={{
                position: 'absolute',
                top: '100%',
                left: 0,
                zIndex: 50,
                background: 'var(--color-bg-overlay, #2C2B29)',
                border: '1px solid var(--color-steel-mid, #5A5650)',
                borderRadius: '3px',
                minWidth: '130px',
                boxShadow: '0 4px 16px rgba(0,0,0,0.5)',
                marginTop: '2px',
              }}
            >
              {availableTargets.map((target) => (
                <button
                  key={target.value}
                  onClick={() => {
                    setMenuOpen(false);
                    onMove(workOrder.id, target.value);
                  }}
                  style={{
                    display: 'block',
                    width: '100%',
                    padding: '0.5rem 0.75rem',
                    textAlign: 'left',
                    fontSize: '0.78rem',
                    fontWeight: 600,
                    color: 'var(--color-text-secondary, #C4BFB8)',
                    background: 'transparent',
                    border: 'none',
                    cursor: 'pointer',
                    transition: 'background 0.1s ease, color 0.1s ease',
                  }}
                  onMouseEnter={(e) => {
                    (e.currentTarget as HTMLButtonElement).style.background =
                      'var(--color-bg-elevated, #222120)';
                    (e.currentTarget as HTMLButtonElement).style.color =
                      'var(--color-text-primary, #F2EDE8)';
                  }}
                  onMouseLeave={(e) => {
                    (e.currentTarget as HTMLButtonElement).style.background =
                      'transparent';
                    (e.currentTarget as HTMLButtonElement).style.color =
                      'var(--color-text-secondary, #C4BFB8)';
                  }}
                >
                  {target.label}
                </button>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}

// ─── KanbanBoard ──────────────────────────────────────────────────────────────

export interface KanbanBoardProps {
  workOrders: (WorkOrder & { client_name?: string | null })[];
  onStatusChange?: (id: string, newStatus: WorkOrderStatus) => void;
}

/**
 * KanbanBoard — Project Pipeline Management (Requirement 8.1, 8.2)
 *
 * Displays work orders in columns: New, Accepted, In Progress, Completed, Invoiced.
 * Each card has a "Move to" dropdown that calls PATCH /api/admin/work-orders/[id]/status
 * and triggers the optional onStatusChange callback to notify the parent.
 *
 * Note: @dnd-kit/core is not installed; drag-and-drop is implemented via
 * "Move to" dropdown buttons on each card.
 */
export default function KanbanBoard({ workOrders, onStatusChange }: KanbanBoardProps) {
  const [localOrders, setLocalOrders] = useState(workOrders);
  const [pendingId, setPendingId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [, startTransition] = useTransition();

  // Assign cards to columns
  // "Invoiced" column = completed work orders that have an invoice (we show all completed here
  // as a display state; in a real scenario you'd check for invoice records)
  const getColumnCards = (col: KanbanColumn) => {
    if (col.id === 'invoiced') {
      // Show completed orders in the invoiced column as a display state
      // (In production, filter by those that have invoices generated)
      return [];
    }
    return localOrders.filter((wo) => wo.status === col.dbStatus);
  };

  const handleMove = async (id: string, newStatus: WorkOrderStatus) => {
    setError(null);
    setPendingId(id);

    // Optimistic update
    const previousOrders = localOrders;
    startTransition(() => {
      setLocalOrders((prev) =>
        prev.map((wo) => (wo.id === id ? { ...wo, status: newStatus } : wo))
      );
    });

    try {
      const res = await fetch(`/api/admin/work-orders/${id}/status`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: newStatus }),
      });

      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.error ?? `HTTP ${res.status}`);
      }

      // Notify parent (e.g., to trigger client notification)
      onStatusChange?.(id, newStatus);
    } catch (err) {
      // Rollback on failure
      setLocalOrders(previousOrders);
      setError(
        err instanceof Error ? err.message : 'Failed to update status. Please try again.'
      );
    } finally {
      setPendingId(null);
    }
  };

  return (
    <div>
      {error && (
        <div
          className="alert alert-error"
          style={{ marginBottom: '1rem' }}
          role="alert"
        >
          {error}
          <button
            onClick={() => setError(null)}
            style={{
              marginLeft: 'auto',
              background: 'none',
              border: 'none',
              color: 'inherit',
              cursor: 'pointer',
              fontSize: '1rem',
            }}
            aria-label="Dismiss error"
          >
            ×
          </button>
        </div>
      )}

      {/* Kanban columns */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fill, minmax(220px, 1fr))',
          gap: '1rem',
          alignItems: 'start',
        }}
      >
        {COLUMNS.map((col) => {
          const cards = getColumnCards(col);
          return (
            <div
              key={col.id}
              style={{
                background: 'var(--color-navy, #1B2A4A)',
                border: '1px solid var(--color-navy-bright, #2E4A8A)',
                borderRadius: '4px',
                overflow: 'hidden',
                minHeight: '200px',
              }}
            >
              {/* Column header */}
              <div
                style={{
                  padding: '0.6rem 0.875rem',
                  borderBottom: `2px solid ${col.headerColor}`,
                  background: 'var(--color-navy-mid, #243660)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                }}
              >
                <span
                  style={{
                    fontFamily: 'var(--font-heading, Montserrat), sans-serif',
                    fontSize: '0.72rem',
                    fontWeight: 800,
                    letterSpacing: '0.1em',
                    textTransform: 'uppercase',
                    color: col.headerColor,
                  }}
                >
                  {col.label}
                </span>
                <span
                  style={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    width: '20px',
                    height: '20px',
                    borderRadius: '50%',
                    background: `${col.headerColor}22`,
                    border: `1px solid ${col.headerColor}55`,
                    fontSize: '0.65rem',
                    fontWeight: 700,
                    color: col.headerColor,
                  }}
                >
                  {cards.length}
                </span>
              </div>

              {/* Cards */}
              <div style={{ padding: '0.625rem' }}>
                {cards.length === 0 ? (
                  <div
                    style={{
                      padding: '1rem 0.5rem',
                      textAlign: 'center',
                      fontSize: '0.75rem',
                      color: 'var(--color-text-muted, #6B6560)',
                      fontStyle: 'italic',
                    }}
                  >
                    No work orders
                  </div>
                ) : (
                  cards.map((wo) => (
                    <KanbanCard
                      key={wo.id}
                      workOrder={wo}
                      onMove={handleMove}
                      isPending={pendingId === wo.id}
                    />
                  ))
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
