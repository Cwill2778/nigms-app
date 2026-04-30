"use client";

import { useEffect, useState, useCallback } from "react";
import LoadingSpinner from "@/components/LoadingSpinner";
import StatusBadge from "@/components/StatusBadge";
import type { UserProfile, ClientAddress, WorkOrder, Payment, Message, WorkOrderPicture, Property, Subscription } from "@/lib/types";

interface ClientDetail {
  profile: UserProfile;
  addresses: ClientAddress[];
  workOrders: WorkOrder[];
  payments: Payment[];
  messages: Message[];
  pictures: WorkOrderPicture[];
  properties: Property[];
  subscriptions: Subscription[];
}

type Tab = "contact" | "properties" | "workOrders" | "payments" | "messages" | "pictures";

interface ClientDetailPanelProps {
  clientId: string;
  onClose: () => void;
}

function formatDate(d: string) {
  return new Intl.DateTimeFormat("en-US", { year: "numeric", month: "short", day: "numeric" }).format(new Date(d));
}
function formatDateTime(d: string) {
  return new Intl.DateTimeFormat("en-US", { month: "short", day: "numeric", year: "numeric", hour: "numeric", minute: "2-digit" }).format(new Date(d));
}

// Shared section heading style
const sectionHeading: React.CSSProperties = {
  fontFamily: "var(--font-heading)",
  fontSize: "0.7rem",
  fontWeight: 700,
  letterSpacing: "0.1em",
  textTransform: "uppercase",
  color: "var(--color-steel-shine)",
  marginBottom: "0.75rem",
};

export default function ClientDetailPanel({ clientId, onClose: _onClose }: ClientDetailPanelProps) {
  const [data, setData] = useState<ClientDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<Tab>("contact");

  const fetchDetail = useCallback(async () => {
    setLoading(true); setError(null);
    try {
      const res = await fetch(`/api/admin/clients/${clientId}/detail`);
      if (!res.ok) { const b = await res.json().catch(() => ({})); throw new Error(b.error ?? `HTTP ${res.status}`); }
      setData(await res.json());
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load client details.");
    } finally { setLoading(false); }
  }, [clientId]);

  useEffect(() => { fetchDetail(); }, [fetchDetail]);

  const tabs: { key: Tab; label: string }[] = [
    { key: "contact", label: "Contact" },
    { key: "properties", label: "Properties" },
    { key: "workOrders", label: "Work Orders" },
    { key: "payments", label: "Payments" },
    { key: "messages", label: "Messages" },
    { key: "pictures", label: "Pictures" },
  ];

  if (loading) return <div className="flex items-center justify-center h-64"><LoadingSpinner size="lg" /></div>;

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center h-64 gap-4 px-6">
        <p className="text-sm text-center" style={{ color: "var(--color-error)" }}>{error}</p>
        <button onClick={fetchDetail} className="btn-primary">Retry</button>
      </div>
    );
  }

  if (!data) return null;

  const { profile, addresses, workOrders, payments, messages, pictures, properties, subscriptions } = data;
  const displayName = profile.first_name && profile.last_name
    ? `${profile.first_name} ${profile.last_name}` : profile.username;

  return (
    <div className="flex flex-col h-full" style={{ color: "var(--color-text-primary)" }}>
      {/* Header */}
      <div className="px-6 py-4" style={{ borderBottom: "1px solid var(--color-navy-bright)", background: "var(--color-navy)" }}>
        <p className="text-lg font-semibold" style={{ color: "var(--color-text-on-navy)" }}>{displayName}</p>
        {profile.email && <p className="text-sm" style={{ color: "var(--color-text-on-navy)", opacity: 0.7 }}>{profile.email}</p>}
      </div>

      {/* Tabs */}
      <div className="flex overflow-x-auto shrink-0" style={{ borderBottom: "1px solid var(--color-steel-dim)" }}>
        {tabs.map((tab) => (
          <button
            key={tab.key}
            onClick={() => setActiveTab(tab.key)}
            className="px-4 py-3 text-sm font-medium whitespace-nowrap transition-colors"
            style={
              activeTab === tab.key
                ? { color: "var(--color-accent-orange)", borderBottom: "2px solid var(--color-accent-orange)", fontFamily: "var(--font-heading)", letterSpacing: "0.06em" }
                : { color: "var(--color-text-muted)", borderBottom: "2px solid transparent", fontFamily: "var(--font-heading)", letterSpacing: "0.06em" }
            }
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto px-6 py-5">
        {activeTab === "contact" && <ContactTab profile={profile} addresses={addresses} sectionHeading={sectionHeading} />}
        {activeTab === "properties" && <PropertiesTab properties={properties} subscriptions={subscriptions} sectionHeading={sectionHeading} />}
        {activeTab === "workOrders" && <WorkOrdersTab workOrders={workOrders} formatDate={formatDate} />}
        {activeTab === "payments" && <PaymentsTab payments={payments} formatDate={formatDate} />}
        {activeTab === "messages" && <MessagesTab messages={messages} clientId={clientId} formatDateTime={formatDateTime} />}
        {activeTab === "pictures" && <PicturesTab pictures={pictures} />}
      </div>
    </div>
  );
}

/* ── Sub-sections ── */

function ContactTab({ profile, addresses, sectionHeading }: { profile: UserProfile; addresses: ClientAddress[]; sectionHeading: React.CSSProperties }) {
  return (
    <div className="flex flex-col gap-6">
      <section>
        <h3 style={sectionHeading}>Profile</h3>
        <dl className="grid grid-cols-2 gap-x-4 gap-y-3 text-sm">
          {[
            ["Name", profile.first_name || profile.last_name ? `${profile.first_name ?? ""} ${profile.last_name ?? ""}`.trim() : profile.username],
            ["Username", profile.username],
            ["Email", profile.email ?? "—"],
            ["Phone", profile.phone ?? "—"],
          ].map(([label, value]) => (
            <>
              <dt key={`dt-${label}`} style={{ color: "var(--color-text-muted)" }}>{label}</dt>
              <dd key={`dd-${label}`} style={{ color: "var(--color-text-primary)" }}>{value}</dd>
            </>
          ))}
        </dl>
      </section>

      <section>
        <h3 style={sectionHeading}>Addresses</h3>
        {addresses.length === 0 ? (
          <p className="text-sm" style={{ color: "var(--color-text-muted)" }}>No addresses on file.</p>
        ) : (
          <ul className="flex flex-col gap-3">
            {addresses.map((addr) => (
              <li key={addr.id} className="px-4 py-3 text-sm" style={{ borderRadius: "var(--radius-md)", border: "1px solid var(--color-steel-dim)", background: "var(--color-bg-elevated)" }}>
                <div className="flex items-center gap-2 mb-1">
                  {addr.label && <span style={{ color: "var(--color-text-primary)", fontWeight: 500 }}>{addr.label}</span>}
                  {addr.is_primary && <span className="badge badge-orange">Primary</span>}
                </div>
                <p style={{ color: "var(--color-text-secondary)" }}>{addr.street}</p>
                <p style={{ color: "var(--color-text-secondary)" }}>{addr.city}, {addr.state} {addr.zip}</p>
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  );
}

function PropertiesTab({
  properties,
  subscriptions,
  sectionHeading,
}: {
  properties: Property[];
  subscriptions: Subscription[];
  sectionHeading: React.CSSProperties;
}) {
  // Build a map from property_id → subscription
  const subMap = new Map(subscriptions.map((s) => [s.property_id, s]));

  const tierLabel: Record<string, string> = {
    essential: "Essential Standard",
    elevated: "Elevated Standard",
    elite: "Elite Standard",
    vip: "VIP",
  };

  const tierColor: Record<string, string> = {
    essential: "var(--color-steel-bright, #8C8880)",
    elevated: "var(--color-status-gold, #F59E0B)",
    elite: "var(--color-status-green, #22C55E)",
    vip: "var(--color-precision-coral, #FF7F7F)",
  };

  return (
    <div className="flex flex-col gap-6">
      <section>
        <h3 style={sectionHeading}>Properties &amp; Subscriptions</h3>
        {properties.length === 0 ? (
          <p className="text-sm" style={{ color: "var(--color-text-muted)" }}>No properties on file.</p>
        ) : (
          <ul className="flex flex-col gap-3">
            {properties.map((prop) => {
              const sub = subMap.get(prop.id);
              return (
                <li
                  key={prop.id}
                  className="px-4 py-3 text-sm"
                  style={{
                    borderRadius: "var(--radius-md)",
                    border: "1px solid var(--color-steel-dim)",
                    background: "var(--color-bg-elevated)",
                  }}
                >
                  <div className="flex items-start justify-between gap-2 mb-2">
                    <span style={{ color: "var(--color-text-primary)", fontWeight: 500 }}>
                      {prop.address}
                    </span>
                    {sub ? (
                      <span
                        style={{
                          display: "inline-flex",
                          alignItems: "center",
                          padding: "0.15rem 0.5rem",
                          fontSize: "0.65rem",
                          fontWeight: 700,
                          letterSpacing: "0.08em",
                          textTransform: "uppercase",
                          borderRadius: "2px",
                          background: `${tierColor[sub.tier] ?? "var(--color-steel-bright)"}22`,
                          color: tierColor[sub.tier] ?? "var(--color-steel-bright)",
                          border: `1px solid ${tierColor[sub.tier] ?? "var(--color-steel-bright)"}55`,
                          whiteSpace: "nowrap",
                        }}
                      >
                        {tierLabel[sub.tier] ?? sub.tier}
                      </span>
                    ) : (
                      <span
                        style={{
                          display: "inline-flex",
                          alignItems: "center",
                          padding: "0.15rem 0.5rem",
                          fontSize: "0.65rem",
                          fontWeight: 700,
                          letterSpacing: "0.08em",
                          textTransform: "uppercase",
                          borderRadius: "2px",
                          background: "rgba(119,141,169,0.1)",
                          color: "var(--color-text-muted)",
                          border: "1px solid rgba(119,141,169,0.25)",
                          whiteSpace: "nowrap",
                        }}
                      >
                        No Subscription
                      </span>
                    )}
                  </div>
                  {sub && (
                    <dl className="grid grid-cols-2 gap-x-4 gap-y-1 text-xs mt-1">
                      <dt style={{ color: "var(--color-text-muted)" }}>Status</dt>
                      <dd style={{ color: "var(--color-text-secondary)", textTransform: "capitalize" }}>
                        {sub.status}
                      </dd>
                      <dt style={{ color: "var(--color-text-muted)" }}>Minutes Used</dt>
                      <dd style={{ color: "var(--color-text-secondary)" }}>
                        {sub.minutes_used} / {sub.monthly_allocation_minutes}
                      </dd>
                    </dl>
                  )}
                </li>
              );
            })}
          </ul>
        )}
      </section>
    </div>
  );
}

function WorkOrdersTab({ workOrders, formatDate }: { workOrders: WorkOrder[]; formatDate: (d: string) => string }) {
  if (workOrders.length === 0) return <p className="text-sm" style={{ color: "var(--color-text-muted)" }}>No work orders yet.</p>;
  return (
    <ul className="flex flex-col gap-3">
      {workOrders.map((wo) => (
        <li key={wo.id} className="px-4 py-3 text-sm" style={{ borderRadius: "var(--radius-md)", border: "1px solid var(--color-steel-dim)", background: "var(--color-bg-elevated)" }}>
          <div className="flex items-center justify-between gap-2 mb-1">
            <span style={{ color: "var(--color-text-primary)", fontWeight: 500 }}>{wo.wo_number ?? wo.title}</span>
            <StatusBadge status={wo.status} />
          </div>
          <div className="flex items-center justify-between text-xs" style={{ color: "var(--color-text-muted)" }}>
            <span>{formatDate(wo.created_at)}</span>
            {wo.quoted_amount != null && <span>${wo.quoted_amount.toLocaleString("en-US", { minimumFractionDigits: 2 })}</span>}
          </div>
        </li>
      ))}
    </ul>
  );
}

function PaymentsTab({ payments, formatDate }: { payments: Payment[]; formatDate: (d: string) => string }) {
  if (payments.length === 0) return <p className="text-sm" style={{ color: "var(--color-text-muted)" }}>No payments yet.</p>;
  return (
    <ul className="flex flex-col gap-3">
      {payments.map((p) => (
        <li key={p.id} className="px-4 py-3 text-sm" style={{ borderRadius: "var(--radius-md)", border: "1px solid var(--color-steel-dim)", background: "var(--color-bg-elevated)" }}>
          <div className="flex items-center justify-between gap-2 mb-1">
            <span style={{ color: "var(--color-text-primary)", fontWeight: 500 }}>${p.amount.toLocaleString("en-US", { minimumFractionDigits: 2 })}</span>
            <StatusBadge status={p.status} />
          </div>
          <div className="flex items-center justify-between text-xs" style={{ color: "var(--color-text-muted)" }}>
            <span>{formatDate(p.payment_date ?? p.created_at)}</span>
            {p.receipt_number && <span>#{p.receipt_number}</span>}
          </div>
        </li>
      ))}
    </ul>
  );
}

function MessagesTab({ messages, clientId, formatDateTime }: { messages: Message[]; clientId: string; formatDateTime: (d: string) => string }) {
  if (messages.length === 0) return <p className="text-sm" style={{ color: "var(--color-text-muted)" }}>No messages yet.</p>;
  return (
    <ul className="flex flex-col gap-3">
      {messages.map((msg) => {
        const isClient = msg.sender_id === clientId;
        return (
          <li key={msg.id} className={`flex flex-col max-w-[80%] ${isClient ? "self-start items-start" : "self-end items-end ml-auto"}`}>
            <div
              className="px-3 py-2 text-sm"
              style={{
                borderRadius: "var(--radius-md)",
                background: isClient ? "var(--color-bg-elevated)" : "var(--color-accent-orange-glow)",
                color: isClient ? "var(--color-text-primary)" : "var(--color-accent-orange-hover)",
                border: `1px solid ${isClient ? "var(--color-steel-dim)" : "var(--color-accent-orange)"}`,
              }}
            >
              {msg.body}
            </div>
            <span className="text-xs mt-1" style={{ color: "var(--color-text-muted)" }}>{formatDateTime(msg.created_at)}</span>
          </li>
        );
      })}
    </ul>
  );
}

function PicturesTab({ pictures }: { pictures: WorkOrderPicture[] }) {
  if (pictures.length === 0) return <p className="text-sm" style={{ color: "var(--color-text-muted)" }}>No pictures yet.</p>;
  return (
    <div className="grid grid-cols-2 gap-3">
      {pictures.map((pic) => (
        <div key={pic.id} className="flex flex-col gap-1">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={pic.storage_path}
            alt={pic.caption ?? "Work order picture"}
            className="w-full aspect-square object-cover"
            style={{ borderRadius: "var(--radius-md)", border: "1px solid var(--color-steel-dim)", background: "var(--color-bg-elevated)" }}
            onError={(e) => {
              (e.currentTarget as HTMLImageElement).src =
                "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='100' height='100'%3E%3Crect width='100' height='100' fill='%231C1C22'/%3E%3Ctext x='50' y='55' text-anchor='middle' fill='%234A4A5E' font-size='12'%3ENo image%3C/text%3E%3C/svg%3E";
            }}
          />
          {pic.caption && <p className="text-xs truncate" style={{ color: "var(--color-text-muted)" }}>{pic.caption}</p>}
        </div>
      ))}
    </div>
  );
}
