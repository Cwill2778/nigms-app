"use client";

import { useEffect, useState } from "react";
import LoadingSpinner from "@/components/LoadingSpinner";
import StatusBadge from "@/components/StatusBadge";
import type {
  UserProfile,
  ClientAddress,
  WorkOrder,
  Payment,
  Message,
  WorkOrderPicture,
} from "@/lib/types";

interface ClientDetail {
  profile: UserProfile;
  addresses: ClientAddress[];
  workOrders: WorkOrder[];
  payments: Payment[];
  messages: Message[];
  pictures: WorkOrderPicture[];
}

type Tab = "contact" | "workOrders" | "payments" | "messages" | "pictures";

interface ClientDetailPanelProps {
  clientId: string;
  onClose: () => void;
}

function formatDate(dateStr: string) {
  return new Intl.DateTimeFormat("en-US", {
    year: "numeric",
    month: "short",
    day: "numeric",
  }).format(new Date(dateStr));
}

function formatDateTime(dateStr: string) {
  return new Intl.DateTimeFormat("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
    hour: "numeric",
    minute: "2-digit",
  }).format(new Date(dateStr));
}

export default function ClientDetailPanel({
  clientId,
  onClose: _onClose,
}: ClientDetailPanelProps) {
  const [data, setData] = useState<ClientDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<Tab>("contact");

  async function fetchDetail() {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(`/api/admin/clients/${clientId}/detail`);
      if (!res.ok) {
        const body = await res.json().catch(() => ({}));
        throw new Error(body.error ?? `HTTP ${res.status}`);
      }
      const json = await res.json();
      setData(json);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load client details.");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    fetchDetail();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [clientId]);

  const tabs: { key: Tab; label: string }[] = [
    { key: "contact", label: "Contact" },
    { key: "workOrders", label: "Work Orders" },
    { key: "payments", label: "Payments" },
    { key: "messages", label: "Messages" },
    { key: "pictures", label: "Pictures" },
  ];

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <LoadingSpinner size="lg" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center h-64 gap-4 px-6">
        <p className="text-red-400 text-sm text-center">{error}</p>
        <button
          onClick={fetchDetail}
          className="px-4 py-2 text-sm font-medium bg-orange-500 hover:bg-orange-600 text-white rounded-md transition-colors"
        >
          Retry
        </button>
      </div>
    );
  }

  if (!data) return null;

  const { profile, addresses, workOrders, payments, messages, pictures } = data;
  const displayName =
    profile.first_name && profile.last_name
      ? `${profile.first_name} ${profile.last_name}`
      : profile.username;

  return (
    <div className="flex flex-col h-full text-white">
      {/* Client name header */}
      <div className="px-6 py-4 border-b border-[#4A4A4A]">
        <p className="text-lg font-semibold">{displayName}</p>
        {profile.email && (
          <p className="text-sm text-gray-400">{profile.email}</p>
        )}
      </div>

      {/* Tabs */}
      <div className="flex border-b border-[#4A4A4A] overflow-x-auto shrink-0">
        {tabs.map((tab) => (
          <button
            key={tab.key}
            onClick={() => setActiveTab(tab.key)}
            className={`px-4 py-3 text-sm font-medium whitespace-nowrap transition-colors ${
              activeTab === tab.key
                ? "text-orange-400 border-b-2 border-orange-400"
                : "text-gray-400 hover:text-gray-200"
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Tab content */}
      <div className="flex-1 overflow-y-auto px-6 py-5">
        {activeTab === "contact" && (
          <ContactTab profile={profile} addresses={addresses} />
        )}
        {activeTab === "workOrders" && (
          <WorkOrdersTab workOrders={workOrders} formatDate={formatDate} />
        )}
        {activeTab === "payments" && (
          <PaymentsTab payments={payments} formatDate={formatDate} />
        )}
        {activeTab === "messages" && (
          <MessagesTab
            messages={messages}
            clientId={clientId}
            formatDateTime={formatDateTime}
          />
        )}
        {activeTab === "pictures" && (
          <PicturesTab pictures={pictures} />
        )}
      </div>
    </div>
  );
}

/* ── Sub-sections ─────────────────────────────────────────────────────────── */

function ContactTab({
  profile,
  addresses,
}: {
  profile: UserProfile;
  addresses: ClientAddress[];
}) {
  return (
    <div className="flex flex-col gap-6">
      <section>
        <h3 className="text-xs font-semibold uppercase tracking-widest text-gray-400 mb-3">
          Profile
        </h3>
        <dl className="grid grid-cols-2 gap-x-4 gap-y-3 text-sm">
          <dt className="text-gray-400">Name</dt>
          <dd className="text-white">
            {profile.first_name || profile.last_name
              ? `${profile.first_name ?? ""} ${profile.last_name ?? ""}`.trim()
              : profile.username}
          </dd>
          <dt className="text-gray-400">Username</dt>
          <dd className="text-white">{profile.username}</dd>
          <dt className="text-gray-400">Email</dt>
          <dd className="text-white">{profile.email ?? "—"}</dd>
          <dt className="text-gray-400">Phone</dt>
          <dd className="text-white">{profile.phone ?? "—"}</dd>
        </dl>
      </section>

      <section>
        <h3 className="text-xs font-semibold uppercase tracking-widest text-gray-400 mb-3">
          Addresses
        </h3>
        {addresses.length === 0 ? (
          <p className="text-sm text-gray-500">No addresses on file.</p>
        ) : (
          <ul className="flex flex-col gap-3">
            {addresses.map((addr) => (
              <li
                key={addr.id}
                className="rounded-md border border-[#4A4A4A] bg-[#0d2550] px-4 py-3 text-sm"
              >
                <div className="flex items-center gap-2 mb-1">
                  {addr.label && (
                    <span className="font-medium text-white">{addr.label}</span>
                  )}
                  {addr.is_primary && (
                    <span className="text-xs bg-orange-500/20 text-orange-400 px-2 py-0.5 rounded-full">
                      Primary
                    </span>
                  )}
                </div>
                <p className="text-gray-300">{addr.street}</p>
                <p className="text-gray-300">
                  {addr.city}, {addr.state} {addr.zip}
                </p>
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  );
}

function WorkOrdersTab({
  workOrders,
  formatDate,
}: {
  workOrders: WorkOrder[];
  formatDate: (d: string) => string;
}) {
  if (workOrders.length === 0) {
    return <p className="text-sm text-gray-500">No work orders yet.</p>;
  }
  return (
    <ul className="flex flex-col gap-3">
      {workOrders.map((wo) => (
        <li
          key={wo.id}
          className="rounded-md border border-[#4A4A4A] bg-[#0d2550] px-4 py-3 text-sm"
        >
          <div className="flex items-center justify-between gap-2 mb-1">
            <span className="font-medium text-white">
              {wo.wo_number ?? wo.title}
            </span>
            <StatusBadge status={wo.status} />
          </div>
          <div className="flex items-center justify-between text-gray-400 text-xs">
            <span>{formatDate(wo.created_at)}</span>
            {wo.quoted_amount != null && (
              <span>
                ${wo.quoted_amount.toLocaleString("en-US", { minimumFractionDigits: 2 })}
              </span>
            )}
          </div>
        </li>
      ))}
    </ul>
  );
}

function PaymentsTab({
  payments,
  formatDate,
}: {
  payments: Payment[];
  formatDate: (d: string) => string;
}) {
  if (payments.length === 0) {
    return <p className="text-sm text-gray-500">No payments yet.</p>;
  }
  return (
    <ul className="flex flex-col gap-3">
      {payments.map((p) => (
        <li
          key={p.id}
          className="rounded-md border border-[#4A4A4A] bg-[#0d2550] px-4 py-3 text-sm"
        >
          <div className="flex items-center justify-between gap-2 mb-1">
            <span className="font-medium text-white">
              ${p.amount.toLocaleString("en-US", { minimumFractionDigits: 2 })}
            </span>
            <StatusBadge status={p.status} />
          </div>
          <div className="flex items-center justify-between text-gray-400 text-xs">
            <span>{formatDate(p.payment_date ?? p.created_at)}</span>
            {p.receipt_number && <span>#{p.receipt_number}</span>}
          </div>
        </li>
      ))}
    </ul>
  );
}

function MessagesTab({
  messages,
  clientId,
  formatDateTime,
}: {
  messages: Message[];
  clientId: string;
  formatDateTime: (d: string) => string;
}) {
  if (messages.length === 0) {
    return <p className="text-sm text-gray-500">No messages yet.</p>;
  }
  return (
    <ul className="flex flex-col gap-3">
      {messages.map((msg) => {
        const isClient = msg.sender_id === clientId;
        return (
          <li
            key={msg.id}
            className={`flex flex-col max-w-[80%] ${isClient ? "self-start items-start" : "self-end items-end ml-auto"}`}
          >
            <div
              className={`rounded-lg px-3 py-2 text-sm ${
                isClient
                  ? "bg-[#162d5e] text-white"
                  : "bg-orange-500/20 text-orange-100"
              }`}
            >
              {msg.body}
            </div>
            <span className="text-xs text-gray-500 mt-1">
              {formatDateTime(msg.created_at)}
            </span>
          </li>
        );
      })}
    </ul>
  );
}

function PicturesTab({ pictures }: { pictures: WorkOrderPicture[] }) {
  if (pictures.length === 0) {
    return <p className="text-sm text-gray-500">No pictures yet.</p>;
  }
  return (
    <div className="grid grid-cols-2 gap-3">
      {pictures.map((pic) => (
        <div key={pic.id} className="flex flex-col gap-1">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={pic.storage_path}
            alt={pic.caption ?? "Work order picture"}
            className="w-full aspect-square object-cover rounded-md border border-[#4A4A4A] bg-[#0d2550]"
            onError={(e) => {
              (e.currentTarget as HTMLImageElement).src =
                "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='100' height='100'%3E%3Crect width='100' height='100' fill='%230d2550'/%3E%3Ctext x='50' y='55' text-anchor='middle' fill='%234A4A4A' font-size='12'%3ENo image%3C/text%3E%3C/svg%3E";
            }}
          />
          {pic.caption && (
            <p className="text-xs text-gray-400 truncate">{pic.caption}</p>
          )}
        </div>
      ))}
    </div>
  );
}
