"use client";

import { useState } from "react";
import PaymentRow from "@/components/PaymentRow";
import type { Payment, PaymentStatus } from "@/lib/types";

const ALL_STATUSES: PaymentStatus[] = ["pending", "paid", "failed"];

interface PaymentTableProps {
  payments: Payment[];
}

export default function PaymentTable({ payments }: PaymentTableProps) {
  const [statusFilter, setStatusFilter] = useState<PaymentStatus | "all">("all");
  const [clientFilter, setClientFilter] = useState("");

  const filtered = payments.filter((p) => {
    const matchesStatus = statusFilter === "all" || p.status === statusFilter;
    const matchesClient = clientFilter === "" || p.client_id.includes(clientFilter);
    return matchesStatus && matchesClient;
  });

  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-wrap gap-3">
        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value as PaymentStatus | "all")}
          className="input select"
          style={{ width: "auto" }}
        >
          <option value="all">All Statuses</option>
          {ALL_STATUSES.map((s) => (
            <option key={s} value={s}>{s}</option>
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
              {["Amount", "Date", "Status", "Method"].map((h) => (
                <th key={h}>{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {filtered.length === 0 ? (
              <tr>
                <td colSpan={4} className="py-8 text-center text-sm" style={{ color: "var(--color-text-muted)" }}>
                  No payments found.
                </td>
              </tr>
            ) : (
              filtered.map((payment) => (
                <PaymentRow key={payment.id} payment={payment} />
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
