import type { WorkOrderStatus, PaymentStatus } from "@/lib/types";

type Status = WorkOrderStatus | PaymentStatus;

/**
 * StatusBadge — color-coded status indicator using Nailed It brand tokens.
 *
 * Color mapping (Requirement 1.5):
 *   New / Pending  → Precision Coral (#FF7F7F)
 *   In Progress    → Status Gold (#F59E0B)
 *   Accepted       → Status Gold (#F59E0B)
 *   Completed      → Status Green (#22C55E)
 *   Cancelled      → Steel Gray (#778DA9)
 *   Invoiced       → Trust Navy (#1B263B)
 *   Paid           → Status Green (#22C55E)
 *   Failed         → Error red
 */
const styleMap: Record<Status, { bg: string; color: string; border: string }> = {
  pending: {
    // New / Pending = Precision Coral
    bg: "rgba(255, 127, 127, 0.15)",
    color: "#FF7F7F",
    border: "rgba(255, 127, 127, 0.5)",
  },
  in_progress: {
    // In Progress = Status Gold
    bg: "rgba(245, 158, 11, 0.12)",
    color: "#F59E0B",
    border: "rgba(245, 158, 11, 0.4)",
  },
  accepted: {
    // Accepted = Status Gold
    bg: "rgba(245, 158, 11, 0.12)",
    color: "#F59E0B",
    border: "rgba(245, 158, 11, 0.4)",
  },
  completed: {
    // Completed = Status Green
    bg: "rgba(34, 197, 94, 0.12)",
    color: "#22C55E",
    border: "rgba(34, 197, 94, 0.3)",
  },
  cancelled: {
    // Cancelled = Steel Gray
    bg: "rgba(119, 141, 169, 0.12)",
    color: "#778DA9",
    border: "rgba(119, 141, 169, 0.35)",
  },
  paid: {
    // Paid = Status Green
    bg: "rgba(34, 197, 94, 0.12)",
    color: "#22C55E",
    border: "rgba(34, 197, 94, 0.3)",
  },
  failed: {
    bg: "rgba(239, 68, 68, 0.12)",
    color: "#EF4444",
    border: "rgba(239, 68, 68, 0.3)",
  },
};

const labelMap: Record<Status, string> = {
  pending: "New",
  in_progress: "In Progress",
  accepted: "Accepted",
  completed: "Completed",
  cancelled: "Cancelled",
  paid: "Paid",
  failed: "Failed",
};

interface StatusBadgeProps {
  status: Status;
}

export default function StatusBadge({ status }: StatusBadgeProps) {
  const s = styleMap[status] ?? styleMap.cancelled;
  return (
    <span
      style={{
        display: "inline-flex",
        alignItems: "center",
        padding: "0.2rem 0.6rem",
        fontFamily: "var(--font-heading)",
        fontSize: "0.68rem",
        fontWeight: 700,
        letterSpacing: "0.08em",
        textTransform: "uppercase",
        borderRadius: "var(--radius-sm)",
        background: s.bg,
        color: s.color,
        border: `1px solid ${s.border}`,
      }}
    >
      {labelMap[status]}
    </span>
  );
}
