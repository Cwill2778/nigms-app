'use client';

import StatusBadge from '@/components/StatusBadge';
import type { WorkOrder, WorkOrderStatus } from '@/lib/types';

// ─── Progress mapping ─────────────────────────────────────────────────────────
// Maps each work order status to a completion percentage for the progress bar.
// Requirements: 7.1

const STATUS_PROGRESS: Record<WorkOrderStatus, number> = {
  pending: 10,
  accepted: 25,
  in_progress: 60,
  completed: 100,
  cancelled: 0,
};

// ─── Sub-components ───────────────────────────────────────────────────────────

function ProgressBar({ percent }: { percent: number }) {
  return (
    <div
      role="progressbar"
      aria-valuenow={percent}
      aria-valuemin={0}
      aria-valuemax={100}
      aria-label={`${percent}% complete`}
      style={{
        width: '100%',
        height: '6px',
        borderRadius: '3px',
        background: 'var(--color-steel-dim, #2a3a52)',
        overflow: 'hidden',
      }}
    >
      <div
        style={{
          width: `${percent}%`,
          height: '100%',
          borderRadius: '3px',
          background:
            percent === 100
              ? 'var(--color-success, #22C55E)'
              : percent === 0
              ? 'var(--color-steel-gray, #778DA9)'
              : 'var(--color-coral, #FF7F7F)',
          transition: 'width 0.4s ease',
        }}
      />
    </div>
  );
}

function WorkOrderRow({ workOrder }: { workOrder: WorkOrder }) {
  const percent = STATUS_PROGRESS[workOrder.status] ?? 0;

  return (
    <div
      style={{
        padding: '1rem',
        borderRadius: 'var(--radius-md, 8px)',
        background: 'var(--color-bg-elevated, #1e2d42)',
        border: '1px solid var(--color-steel-dim, #2a3a52)',
        display: 'flex',
        flexDirection: 'column',
        gap: '0.625rem',
      }}
    >
      {/* Header row: title + WO number + badge */}
      <div
        style={{
          display: 'flex',
          alignItems: 'flex-start',
          justifyContent: 'space-between',
          gap: '0.75rem',
          flexWrap: 'wrap',
        }}
      >
        <div style={{ flex: 1, minWidth: 0 }}>
          <p
            style={{
              fontFamily: 'var(--font-heading)',
              fontWeight: 600,
              fontSize: '0.9rem',
              color: 'var(--color-text-primary, #f0f4f8)',
              margin: 0,
              overflow: 'hidden',
              textOverflow: 'ellipsis',
              whiteSpace: 'nowrap',
            }}
          >
            {workOrder.title}
          </p>
          {workOrder.wo_number && (
            <p
              style={{
                fontSize: '0.72rem',
                color: 'var(--color-text-muted, #778DA9)',
                margin: '0.15rem 0 0',
                fontFamily: 'var(--font-mono, monospace)',
              }}
            >
              {workOrder.wo_number}
            </p>
          )}
        </div>
        <StatusBadge status={workOrder.status} />
      </div>

      {/* Progress bar + percentage label */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
        <div style={{ flex: 1 }}>
          <ProgressBar percent={percent} />
        </div>
        <span
          style={{
            fontSize: '0.72rem',
            fontWeight: 700,
            color: 'var(--color-text-muted, #778DA9)',
            minWidth: '2.5rem',
            textAlign: 'right',
            fontFamily: 'var(--font-heading)',
          }}
        >
          {percent}%
        </span>
      </div>
    </div>
  );
}

// ─── Main Component ───────────────────────────────────────────────────────────

interface ActiveProjectTrackerProps {
  /** Work orders already filtered to in-progress / accepted statuses */
  workOrders: WorkOrder[];
}

/**
 * ActiveProjectTracker — lists in-progress work orders with a visual progress
 * bar showing completion percentage based on status.
 *
 * Requirements: 7.1
 */
export default function ActiveProjectTracker({ workOrders }: ActiveProjectTrackerProps) {
  if (workOrders.length === 0) {
    return (
      <p
        style={{
          color: 'var(--color-text-muted, #778DA9)',
          fontSize: '0.875rem',
        }}
      >
        No active projects right now.
      </p>
    );
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
      {workOrders.map((wo) => (
        <WorkOrderRow key={wo.id} workOrder={wo} />
      ))}
    </div>
  );
}
