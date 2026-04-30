"use client";

import { useState } from "react";
import StatusBadge from "@/components/StatusBadge";
import type { UserProfile } from "@/lib/types";

interface ClientTableProps {
  clients: UserProfile[];
  onViewClient?: (clientId: string) => void;
}

export default function ClientTable({ clients, onViewClient }: ClientTableProps) {
  const [search, setSearch] = useState("");

  const filtered = clients.filter((c) =>
    c.username.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="flex flex-col gap-4">
      <input
        type="text"
        placeholder="Search by username…"
        value={search}
        onChange={(e) => setSearch(e.target.value)}
        className="input"
        style={{ maxWidth: 320 }}
      />

      <div className="card overflow-hidden">
        <table className="table-industrial">
          <thead>
            <tr>
              {["Username", "Role", "Active", "Created", ""].map((h) => (
                <th key={h}>{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {filtered.length === 0 ? (
              <tr>
                <td colSpan={5} className="py-8 text-center text-sm" style={{ color: "var(--color-text-muted)" }}>
                  No clients found.
                </td>
              </tr>
            ) : (
              filtered.map((client) => (
                <tr
                  key={client.id}
                  onClick={() => onViewClient?.(client.id)}
                  className={onViewClient ? "cursor-pointer" : ""}
                >
                  <td style={{ color: "var(--color-text-primary)", fontWeight: 500 }}>
                    {client.username}
                  </td>
                  <td
                    className="capitalize"
                    style={{ color: "var(--color-text-secondary)" }}
                  >
                    {client.role}
                  </td>
                  <td>
                    <StatusBadge status={client.is_active ? "paid" : "cancelled"} />
                  </td>
                  <td style={{ color: "var(--color-text-secondary)" }}>
                    {new Intl.DateTimeFormat("en-US", { year: "numeric", month: "short", day: "numeric" }).format(new Date(client.created_at))}
                  </td>
                  <td className="text-right">
                    <button
                      type="button"
                      onClick={(e) => { e.stopPropagation(); onViewClient?.(client.id); }}
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
