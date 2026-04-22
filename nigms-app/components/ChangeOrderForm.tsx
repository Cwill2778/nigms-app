"use client";

import { useState } from "react";
import PrintButton from "@/components/PrintButton";
import type { ChangeOrder } from "@/lib/types";

interface ChangeOrderFormProps {
  workOrderId: string;
  changeOrders: ChangeOrder[];
}

const STATUS_STYLES: Record<string, string> = {
  accepted: "bg-green-900/30 text-green-400",
  rejected: "bg-gray-800 text-gray-400",
  pending: "bg-yellow-900/30 text-yellow-400",
};

export default function ChangeOrderForm({ workOrderId, changeOrders: initialOrders }: ChangeOrderFormProps) {
  const [orders, setOrders] = useState<ChangeOrder[]>(initialOrders);
  const [description, setDescription] = useState("");
  const [additionalCost, setAdditionalCost] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSubmitting(true);
    setError(null);
    try {
      const res = await fetch(`/api/admin/work-orders/${workOrderId}/change-orders`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          description,
          additional_cost: parseFloat(additionalCost) || 0,
        }),
      });
      if (!res.ok) {
        const json = await res.json().catch(() => ({}));
        throw new Error(json.error ?? `HTTP ${res.status}`);
      }
      const newOrder: ChangeOrder = await res.json();
      setOrders((prev) => [...prev, newOrder]);
      setDescription("");
      setAdditionalCost("");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to add change order.");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="print-section flex flex-col gap-5">
      <div className="no-print">
        <PrintButton />
      </div>

      <h2 className="text-sm font-semibold uppercase tracking-widest text-gray-400">
        Change Orders
      </h2>

      {orders.length === 0 ? (
        <p className="text-sm text-gray-500">No change orders yet.</p>
      ) : (
        <ul className="flex flex-col gap-3">
          {orders.map((co) => (
            <li
              key={co.id}
              className="rounded-md border border-[#4A4A4A] bg-[#0d2550] px-4 py-3 text-sm"
            >
              <div className="flex items-center justify-between gap-2 mb-1">
                <span className="text-white font-medium">{co.description}</span>
                <span
                  className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                    STATUS_STYLES[co.status] ?? STATUS_STYLES.pending
                  }`}
                >
                  {co.status}
                </span>
              </div>
              <div className="text-gray-400 text-xs text-right">
                +${co.additional_cost.toFixed(2)}
              </div>
            </li>
          ))}
        </ul>
      )}

      <form onSubmit={handleSubmit} className="flex flex-col gap-3 border-t border-[#4A4A4A] pt-4">
        <h3 className="text-xs font-semibold uppercase tracking-widest text-gray-400">
          Add Change Order
        </h3>
        <div>
          <label className="block text-xs text-gray-400 mb-1">Description</label>
          <textarea
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            rows={3}
            required
            className="w-full rounded border border-[#4A4A4A] bg-[#162d5e] px-3 py-2 text-sm text-white focus:outline-none focus:ring-1 focus:ring-orange-400 resize-none"
          />
        </div>
        <div>
          <label className="block text-xs text-gray-400 mb-1">Additional Cost ($)</label>
          <input
            type="number"
            min="0"
            step="0.01"
            value={additionalCost}
            onChange={(e) => setAdditionalCost(e.target.value)}
            required
            className="w-full rounded border border-[#4A4A4A] bg-[#162d5e] px-3 py-2 text-sm text-white focus:outline-none focus:ring-1 focus:ring-orange-400"
          />
        </div>
        {error && <p className="text-xs text-red-400">{error}</p>}
        <button
          type="submit"
          disabled={submitting}
          className="self-end px-4 py-2 text-sm font-medium bg-orange-500 hover:bg-orange-600 disabled:opacity-50 text-white rounded-md transition-colors"
        >
          {submitting ? "Adding…" : "Add Change Order"}
        </button>
      </form>
    </div>
  );
}
