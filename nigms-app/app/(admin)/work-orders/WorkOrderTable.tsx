"use client";

import { useState } from "react";
import StatusBadge from "@/components/StatusBadge";
import type { WorkOrder, WorkOrderStatus } from "@/lib/types";

const ALL_STATUSES: WorkOrderStatus[] = ["pending", "in_progress", "accepted", "completed", "cancelled"];

interface WorkOrderTableProps {
  workOrders: WorkOrder[];
  onViewWorkOrder?: (workOrderId: string) => void;
}

export default function WorkOrderTable({ workOrders, onViewWorkOrder }: WorkOrderTableProps) {
  const [statusFilter, setStatusFilter] = useState<WorkOrderStatus | "all">("all");
  const [clientFilter, setClientFilter] = useState("");

  const filtered = workOrders.filter((wo) => {
    const matchesStatus = statusFilter === "all" || wo.status === statusFilter;
    const matchesClient = clientFilter === "" || (wo.client_id ?? "").includes(clientFilter);
    return matchesStatus && matchesClient;
  });

  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-wrap gap-3">
        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value as WorkOrderStatus | "all")}
          className="input select"
          style={{ width: "auto" }}
        >
          <option value="all">All Statuses</option>
          {ALL_STATUSES.map((s) => (
            <option key={s} value={s}>{s.replace("_", " ")}</option>
          ))}
        </select>

        <input
          type="text"
          placeholder="Filter by client ID…"
          value={clientFilter}
          onChange={(e) => setClientFilter(e.target.value)}
          className="input"
          style={{ width: "auto", minWidth: 200 }}
        />
      </div>

      <div className="card overflow-hidden">
        <table className="table-industrial">
          <thead>
            <tr>
              {["Title", "Client ID", "Status", "Quoted", "Created", ""].map((h) => (
                <th key={h}>{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {filtered.length === 0 ? (
              <tr>
                <td colSpan={6} className="py-8 text-center text-sm" style={{ color: "var(--color-text-muted)" }}>
                  No work orders found.
                </td>
              </tr>
            ) : (
              filtered.map((wo) => (
                <tr key={wo.id}>
                  <td style={{ color: "var(--color-text-primary)", fontWeight: 500 }}>{wo.title}</td>
                  <td style={{ color: "var(--color-text-muted)", fontFamily: "var(--font-mono)", fontSize: "0.75rem" }}>
                    {wo.client_id ? `${wo.client_id.slice(0, 8)}…` : "—"}
                  </td>
                  <td><StatusBadge status={wo.status} /></td>
                  <td style={{ color: "var(--color-text-secondary)" }}>
                    {wo.quoted_amount != null
                      ? new Intl.NumberFormat("en-US", { style: "currency", currency: "USD" }).format(wo.quoted_amount)
                      : "—"}
                  </td>
                  <td style={{ color: "var(--color-text-secondary)" }}>
                    {new Intl.DateTimeFormat("en-US", { year: "numeric", month: "short", day: "numeric" }).format(new Date(wo.created_at))}
                  </td>
                  <td className="text-right">
                    <button
                      type="button"
                      onClick={() => onViewWorkOrder?.(wo.id)}
                      className="btn-ghost text-sm"
                      style={{ color: "var(--color-accent-orange)", padding: "0.25rem 0.5rem" }}
                    >
                      View →
                    </button>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
