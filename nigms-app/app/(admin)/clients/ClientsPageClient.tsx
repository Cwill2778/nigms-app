"use client";

import { useState } from "react";
import AddClientForm from "./AddClientForm";
import SidePanel from "@/components/SidePanel";
import ClientDetailPanel from "@/components/ClientDetailPanel";
import StatusBadge from "@/components/StatusBadge";
import type { UserProfile } from "@/lib/types";

interface ClientsPageClientProps {
  clients: UserProfile[];
}

function formatDate(d: string) {
  return new Intl.DateTimeFormat("en-US", {
    year: "numeric",
    month: "short",
    day: "numeric",
  }).format(new Date(d));
}

export default function ClientsPageClient({ clients }: ClientsPageClientProps) {
  const [selectedClientId, setSelectedClientId] = useState<string | null>(null);
  const [search, setSearch] = useState("");

  // Filter by username, full_name, email, or company_name
  const filtered = clients.filter((c) => {
    if (!search.trim()) return true;
    const q = search.toLowerCase();
    return (
      c.username.toLowerCase().includes(q) ||
      (c.full_name ?? "").toLowerCase().includes(q) ||
      (c.email ?? "").toLowerCase().includes(q) ||
      (c.company_name ?? "").toLowerCase().includes(q)
    );
  });

  return (
    <div
      className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 flex flex-col gap-8"
      style={{ color: "var(--color-text-primary)" }}
    >
      <h1>CRM — Client Database</h1>

      <AddClientForm />

      {/* Search */}
      <div>
        <input
          type="text"
          placeholder="Search by name, email, username, or company…"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="input"
          style={{ maxWidth: 400 }}
          aria-label="Search clients"
        />
      </div>

      {/* Client Table */}
      <div className="card overflow-hidden">
        <table className="table-industrial">
          <thead>
            <tr>
              {["Name", "Email", "Company", "Role", "Active", "Joined", ""].map((h) => (
                <th key={h}>{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {filtered.length === 0 ? (
              <tr>
                <td
                  colSpan={7}
                  className="py-8 text-center text-sm"
                  style={{ color: "var(--color-text-muted)" }}
                >
                  {search ? "No clients match your search." : "No clients yet."}
                </td>
              </tr>
            ) : (
              filtered.map((client) => (
                <tr
                  key={client.id}
                  onClick={() => setSelectedClientId(client.id)}
                  className="cursor-pointer"
                >
                  <td style={{ color: "var(--color-text-primary)", fontWeight: 500 }}>
                    {client.full_name ?? client.username}
                  </td>
                  <td style={{ color: "var(--color-text-secondary)" }}>
                    {client.email ?? "—"}
                  </td>
                  <td style={{ color: "var(--color-text-secondary)" }}>
                    {client.company_name ?? "—"}
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
                    {formatDate(client.created_at)}
                  </td>
                  <td className="text-right">
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        setSelectedClientId(client.id);
                      }}
                      className="btn-ghost text-sm"
                      style={{
                        color: "var(--color-accent-orange)",
                        padding: "0.25rem 0.5rem",
                      }}
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

      {/* Client Detail Side Panel */}
      <SidePanel
        open={selectedClientId !== null}
        onClose={() => setSelectedClientId(null)}
        title="Client Details"
        width="xl"
      >
        {selectedClientId && (
          <ClientDetailPanel
            clientId={selectedClientId}
            onClose={() => setSelectedClientId(null)}
          />
        )}
      </SidePanel>
    </div>
  );
}
