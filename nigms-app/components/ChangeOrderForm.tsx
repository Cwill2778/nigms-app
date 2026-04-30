"use client";

import { useState } from "react";
import PrintButton from "@/components/PrintButton";
import type { ChangeOrder } from "@/lib/types";

interface ChangeOrderFormProps {
  workOrderId: string;
  changeOrders: ChangeOrder[];
}

const statusStyle: Record<string, { color: string; bg: string; border: string }> = {
  accepted: { color: "var(--color-success)", bg: "rgba(34,197,94,0.10)", border: "rgba(34,197,94,0.3)" },
  rejected: { color: "var(--color-text-muted)", bg: "var(--color-bg-overlay)", border: "var(--color-steel-dim)" },
  pending:  { color: "var(--color-accent-yellow)", bg: "rgba(255,214,0,0.10)", border: "var(--color-accent-yellow-dim)" },
};

export default function ChangeOrderForm({ workOrderId, changeOrders: initialOrders }: ChangeOrderFormProps) {
  const [orders, setOrders] = useState<ChangeOrder[]>(initialOrders);
  const [description, setDescription] = useState("");
  const [additionalCost, setAdditionalCost] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSubmitting(true); setError(null);
    try {
      const res = await fetch(`/api/admin/work-orders/${workOrderId}/change-orders`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ description, additional_cost: parseFloat(additionalCost) || 0 }),
      });
      if (!res.ok) { const j = await res.json().catch(() => ({})); throw new Error(j.error ?? `HTTP ${res.status}`); }
      const newOrder = await res.json();
      setOrders((prev) => [...prev, newOrder]);
      setDescription(""); setAdditionalCost("");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to add change order.");
    } finally { setSubmitting(false); }
  }

  return (
    <div className="print-section flex flex-col gap-5">
      <div className="no-print"><PrintButton /></div>

      <h2
        style={{
          fontFamily: "var(--font-heading)",
          fontSize: "0.75rem",
          fontWeight: 700,
          letterSpacing: "0.1em",
          textTransform: "uppercase",
          color: "var(--color-steel-shine)",
        }}
      >
        Change Orders
      </h2>

      {orders.length === 0 ? (
        <p className="text-sm" style={{ color: "var(--color-text-muted)" }}>No change orders yet.</p>
      ) : (
        <ul className="flex flex-col gap-3">
          {orders.map((co) => {
            const s = statusStyle[co.status] ?? statusStyle.pending;
            return (
              <li
                key={co.id}
                className="px-4 py-3 text-sm"
                style={{
                  borderRadius: "var(--radius-md)",
                  border: "1px solid var(--color-steel-dim)",
                  background: "var(--color-bg-elevated)",
                }}
              >
                <div className="flex items-center justify-between gap-2 mb-1">
                  <span style={{ color: "var(--color-text-primary)", fontWeight: 500 }}>{co.description}</span>
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
                    {co.status}
                  </span>
                </div>
                <div className="text-xs text-right" style={{ color: "var(--color-text-secondary)" }}>
                  +${co.additional_cost.toFixed(2)}
                </div>
              </li>
            );
          })}
        </ul>
      )}

      <form
        onSubmit={handleSubmit}
        className="flex flex-col gap-3 pt-4"
        style={{ borderTop: "1px solid var(--color-steel-dim)" }}
      >
        <h3
          style={{
            fontFamily: "var(--font-heading)",
            fontSize: "0.7rem",
            fontWeight: 700,
            letterSpacing: "0.1em",
            textTransform: "uppercase",
            color: "var(--color-steel-shine)",
          }}
        >
          Add Change Order
        </h3>
        <div>
          <label className="label">Description</label>
          <textarea
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            rows={3}
            required
            className="input resize-none"
          />
        </div>
        <div>
          <label className="label">Additional Cost ($)</label>
          <input
            type="number"
            min="0"
            step="0.01"
            value={additionalCost}
            onChange={(e) => setAdditionalCost(e.target.value)}
            required
            className="input"
          />
        </div>
        {error && <p className="text-xs" style={{ color: "var(--color-error)" }}>{error}</p>}
        <div className="flex justify-end">
          <button type="submit" disabled={submitting} className="btn-primary">
            {submitting ? "Adding…" : "Add Change Order"}
          </button>
        </div>
      </form>
    </div>
  );
}
