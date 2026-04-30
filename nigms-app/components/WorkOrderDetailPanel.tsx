"use client";

import { useEffect, useState, useCallback } from "react";
import LoadingSpinner from "@/components/LoadingSpinner";
import StatusBadge from "@/components/StatusBadge";
import TimeTracker from "@/components/TimeTracker";
import EstimateDocument from "@/components/EstimateDocument";
import BillDocument from "@/components/BillDocument";
import ICAgreement from "@/components/ICAgreement";
import ChangeOrderForm from "@/components/ChangeOrderForm";
import type {
  WorkOrder, Estimate, EstimateLineItem, Bill, ChangeOrder,
  TimeEntry, UserProfile, WorkOrderPicture, UrgencyLevel, MaterialsPaidBy,
} from "@/lib/types";

interface WorkOrderDetail {
  workOrder: WorkOrder;
  estimate: Estimate | null;
  bill: Bill | null;
  changeOrders: ChangeOrder[];
  timeEntries: TimeEntry[];
  client: UserProfile | null;
  pictures: WorkOrderPicture[];
}

type Tab = "overview" | "estimate" | "hours" | "bill" | "icAgreement" | "changeOrders";

interface WorkOrderDetailPanelProps {
  workOrderId: string;
  onClose: () => void;
}

const URGENCY_COLORS: Record<UrgencyLevel, { color: string; bg: string; border: string }> = {
  low:       { color: "var(--color-success)",        bg: "rgba(34,197,94,0.10)",   border: "rgba(34,197,94,0.3)" },
  medium:    { color: "var(--color-accent-yellow)",  bg: "rgba(255,214,0,0.10)",   border: "var(--color-accent-yellow-dim)" },
  high:      { color: "var(--color-accent-orange)",  bg: "var(--color-accent-orange-glow)", border: "var(--color-accent-orange)" },
  emergency: { color: "var(--color-error)",          bg: "rgba(239,68,68,0.10)",   border: "rgba(239,68,68,0.3)" },
};

const CATEGORY_OPTIONS = [
  "plumbing","framing","preventive maintenance","general maintenance",
  "appliance repair","appliance replacement","roof repair","flooring","exterior","interior",
];
const URGENCY_OPTIONS: UrgencyLevel[] = ["low", "medium", "high", "emergency"];

function formatDate(d: string) {
  return new Intl.DateTimeFormat("en-US", { year: "numeric", month: "short", day: "numeric" }).format(new Date(d));
}

const sectionHeading: React.CSSProperties = {
  fontFamily: "var(--font-heading)",
  fontSize: "0.7rem",
  fontWeight: 700,
  letterSpacing: "0.1em",
  textTransform: "uppercase",
  color: "var(--color-steel-shine)",
  marginBottom: "0.5rem",
};

export default function WorkOrderDetailPanel({ workOrderId, onClose: _onClose }: WorkOrderDetailPanelProps) {
  const [detail, setDetail] = useState<WorkOrderDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<Tab>("overview");
  const [showModifyForm, setShowModifyForm] = useState(false);
  const [actionError, setActionError] = useState<string | null>(null);
  const [actionLoading, setActionLoading] = useState(false);

  const fetchDetail = useCallback(async () => {
    setLoading(true); setError(null);
    try {
      const res = await fetch(`/api/admin/work-orders/${workOrderId}/detail`);
      if (!res.ok) { const b = await res.json().catch(() => ({})); throw new Error(b.error ?? `HTTP ${res.status}`); }
      setDetail(await res.json());
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load work order details.");
    } finally { setLoading(false); }
  }, [workOrderId]);

  useEffect(() => { fetchDetail(); }, [fetchDetail]);

  async function handleAccept() {
    if (!detail) return;
    setActionLoading(true); setActionError(null);
    try {
      const res = await fetch(`/api/admin/work-orders/${workOrderId}/accept`, { method: "POST" });
      if (!res.ok) { const b = await res.json().catch(() => ({})); throw new Error(b.error ?? `HTTP ${res.status}`); }
      const updated: WorkOrder = await res.json();
      setDetail((prev) => prev ? { ...prev, workOrder: updated } : prev);
    } catch (err) { setActionError(err instanceof Error ? err.message : "Failed to accept work order."); }
    finally { setActionLoading(false); }
  }

  async function handleReject() {
    if (!detail) return;
    setActionLoading(true); setActionError(null);
    try {
      const res = await fetch(`/api/admin/work-orders/${workOrderId}/reject`, { method: "POST" });
      if (!res.ok) { const b = await res.json().catch(() => ({})); throw new Error(b.error ?? `HTTP ${res.status}`); }
      const updated: WorkOrder = await res.json();
      setDetail((prev) => prev ? { ...prev, workOrder: updated } : prev);
    } catch (err) { setActionError(err instanceof Error ? err.message : "Failed to reject work order."); }
    finally { setActionLoading(false); }
  }

  if (loading) return <div className="flex items-center justify-center h-64"><LoadingSpinner size="lg" /></div>;

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center h-64 gap-4 px-6">
        <p className="text-sm text-center" style={{ color: "var(--color-error)" }}>{error}</p>
        <button onClick={fetchDetail} className="btn-primary">Retry</button>
      </div>
    );
  }

  if (!detail) return null;

  const { workOrder, estimate, bill, changeOrders, timeEntries, client } = detail;
  const isActionable = workOrder.status === "pending" || workOrder.status === "in_progress";
  const isAcceptedOrCompleted = workOrder.status === "accepted" || workOrder.status === "completed";
  const clientName = client?.first_name && client?.last_name
    ? `${client.first_name} ${client.last_name}` : client?.username ?? workOrder.client_id;

  const tabs: { key: Tab; label: string; show: boolean }[] = [
    { key: "overview",     label: "Overview",       show: true },
    { key: "estimate",     label: "Estimate",        show: true },
    { key: "hours",        label: "Billable Hours",  show: isAcceptedOrCompleted },
    { key: "bill",         label: "Bill",            show: true },
    { key: "icAgreement",  label: "IC Agreement",    show: isAcceptedOrCompleted },
    { key: "changeOrders", label: "Change Orders",   show: isAcceptedOrCompleted },
  ];

  return (
    <div className="flex flex-col h-full" style={{ color: "var(--color-text-primary)" }}>
      {/* WO header */}
      <div className="px-6 py-4" style={{ borderBottom: "1px solid var(--color-navy-bright)", background: "var(--color-navy)" }}>
        <div className="flex items-center justify-between gap-2">
          <p className="text-lg font-semibold" style={{ color: "var(--color-text-on-navy)" }}>{workOrder.wo_number ?? "Pending Assignment"}</p>
          <StatusBadge status={workOrder.status} />
        </div>
        <p className="text-sm mt-0.5" style={{ color: "var(--color-text-on-navy)", opacity: 0.7 }}>{workOrder.title}</p>
      </div>

      {/* Action buttons */}
      {isActionable && (
        <div className="px-6 py-3 flex flex-wrap gap-2" style={{ borderBottom: "1px solid var(--color-steel-dim)" }}>
          <button
            onClick={handleAccept} disabled={actionLoading}
            className="flex items-center gap-1.5 px-3 py-1.5 text-sm font-medium transition-colors disabled:opacity-50"
            style={{ background: "var(--color-success)", color: "#fff", borderRadius: "var(--radius-sm)" }}
          >
            Accept
          </button>
          <button
            onClick={handleReject} disabled={actionLoading}
            className="flex items-center gap-1.5 px-3 py-1.5 text-sm font-medium transition-colors disabled:opacity-50"
            style={{ background: "var(--color-error)", color: "#fff", borderRadius: "var(--radius-sm)" }}
          >
            Reject
          </button>
          <button
            onClick={() => setShowModifyForm((v) => !v)} disabled={actionLoading}
            className="btn-secondary text-sm px-3 py-1.5"
          >
            {showModifyForm ? "Cancel" : "Modify"}
          </button>
          {actionError && <p className="w-full text-xs" style={{ color: "var(--color-error)" }}>{actionError}</p>}
        </div>
      )}

      {showModifyForm && (
        <ModifyForm
          workOrder={workOrder}
          onSaved={(updated) => { setDetail((prev) => prev ? { ...prev, workOrder: updated } : prev); setShowModifyForm(false); }}
        />
      )}

      {/* Tabs */}
      <div className="flex overflow-x-auto shrink-0" style={{ borderBottom: "1px solid var(--color-steel-dim)" }}>
        {tabs.filter((t) => t.show).map((tab) => (
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

      {/* Tab content */}
      <div className="flex-1 overflow-y-auto px-6 py-5">
        {activeTab === "overview" && <OverviewTab workOrder={workOrder} clientName={clientName} formatDate={formatDate} sectionHeading={sectionHeading} />}
        {activeTab === "estimate" && (
          <EstimateTab
            workOrderId={workOrder.id} estimate={estimate} workOrder={workOrder} client={client}
            onEstimateSaved={(est) => setDetail((prev) => prev ? { ...prev, estimate: est } : prev)}
          />
        )}
        {activeTab === "hours" && isAcceptedOrCompleted && (
          <HoursTab
            workOrderId={workOrder.id} timeEntries={timeEntries} totalMinutes={workOrder.total_billable_minutes}
            onEntryStarted={(entry) => setDetail((prev) => prev ? { ...prev, timeEntries: [...prev.timeEntries, entry] } : prev)}
            onEntryStopped={(entry, newTotal) => setDetail((prev) => {
              if (!prev) return prev;
              return { ...prev, workOrder: { ...prev.workOrder, total_billable_minutes: newTotal }, timeEntries: prev.timeEntries.map((e) => e.id === entry.id ? entry : e) };
            })}
          />
        )}
        {activeTab === "bill" && (
          <BillTab
            workOrderId={workOrder.id} bill={bill} workOrder={workOrder} client={client}
            onBillCreated={(newBill) => setDetail((prev) => prev ? { ...prev, bill: newBill } : prev)}
          />
        )}
        {activeTab === "icAgreement" && isAcceptedOrCompleted && (
          <ICAgreement workOrder={workOrder} client={client!} estimate={estimate} />
        )}
        {activeTab === "changeOrders" && isAcceptedOrCompleted && (
          <ChangeOrderForm workOrderId={workOrder.id} changeOrders={changeOrders} />
        )}
      </div>
    </div>
  );
}

/* ── Sub-sections ── */

function OverviewTab({ workOrder, clientName, formatDate, sectionHeading }: {
  workOrder: WorkOrder; clientName: string;
  formatDate: (d: string) => string; sectionHeading: React.CSSProperties;
}) {
  const urgencyStyle = workOrder.urgency ? URGENCY_COLORS[workOrder.urgency] : null;
  return (
    <div className="flex flex-col gap-5">
      <dl className="grid grid-cols-2 gap-x-4 gap-y-3 text-sm">
        {[
          ["WO Number", workOrder.wo_number ?? "Pending Assignment"],
          ["Property", workOrder.property_address ?? "—"],
          ["Category", workOrder.category ?? "—"],
          ["Client", clientName],
          ["Created", formatDate(workOrder.created_at)],
          workOrder.quoted_amount != null ? ["Quoted", new Intl.NumberFormat("en-US", { style: "currency", currency: "USD" }).format(workOrder.quoted_amount)] : null,
        ].filter((item): item is [string, string] => item !== null).map(([label, value]) => (
          <>
            <dt key={`dt-${label}`} style={{ color: "var(--color-text-muted)" }}>{label}</dt>
            <dd key={`dd-${label}`} style={{ color: "var(--color-text-primary)" }}>{value}</dd>
          </>
        ))}
        <dt style={{ color: "var(--color-text-muted)" }}>Urgency</dt>
        <dd>
          {urgencyStyle ? (
            <span style={{ display: "inline-flex", alignItems: "center", padding: "0.2rem 0.6rem", fontFamily: "var(--font-heading)", fontSize: "0.68rem", fontWeight: 700, letterSpacing: "0.08em", textTransform: "uppercase", borderRadius: "var(--radius-sm)", background: urgencyStyle.bg, color: urgencyStyle.color, border: `1px solid ${urgencyStyle.border}` }}>
              {workOrder.urgency}
            </span>
          ) : <span style={{ color: "var(--color-text-primary)" }}>—</span>}
        </dd>
      </dl>

      {workOrder.description && (
        <section>
          <h3 style={sectionHeading}>Scope of Work</h3>
          <p className="text-sm whitespace-pre-wrap" style={{ color: "var(--color-text-secondary)" }}>{workOrder.description}</p>
        </section>
      )}
      {workOrder.inspection_notes && (
        <section>
          <h3 style={sectionHeading}>Inspection Notes</h3>
          <p className="text-sm whitespace-pre-wrap" style={{ color: "var(--color-text-secondary)" }}>{workOrder.inspection_notes}</p>
        </section>
      )}
    </div>
  );
}

function EstimateTab({ workOrderId, estimate: initialEstimate, workOrder, client, onEstimateSaved }: {
  workOrderId: string; estimate: Estimate | null; workOrder: WorkOrder;
  client: UserProfile | null; onEstimateSaved: (e: Estimate) => void;
}) {
  const [lineItems, setLineItems] = useState<EstimateLineItem[]>(initialEstimate?.line_items ?? []);
  const [notes, setNotes] = useState(initialEstimate?.notes ?? "");
  const [saving, setSaving] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);
  const [savedEstimate, setSavedEstimate] = useState<Estimate | null>(initialEstimate);
  const totalAmount = lineItems.reduce((sum, item) => sum + item.total, 0);

  function addLineItem() { setLineItems((prev) => [...prev, { description: "", quantity: 1, unit_price: 0, total: 0 }]); }
  function removeLineItem(i: number) { setLineItems((prev) => prev.filter((_, idx) => idx !== i)); }
  function updateLineItem(i: number, field: keyof EstimateLineItem, value: string) {
    setLineItems((prev) => prev.map((item, idx) => {
      if (idx !== i) return item;
      const updated = { ...item, [field]: field === "description" ? value : parseFloat(value) || 0 };
      if (field === "quantity" || field === "unit_price") updated.total = updated.quantity * updated.unit_price;
      return updated;
    }));
  }

  async function handleSave() {
    setSaving(true); setSaveError(null);
    try {
      const res = await fetch(`/api/admin/work-orders/${workOrderId}/estimates`, {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ line_items: lineItems, notes: notes || undefined, total_amount: totalAmount }),
      });
      if (!res.ok) { const j = await res.json().catch(() => ({})); throw new Error(j.error ?? `HTTP ${res.status}`); }
      const est: Estimate = await res.json();
      setSavedEstimate(est); onEstimateSaved(est);
    } catch (err) { setSaveError(err instanceof Error ? err.message : "Failed to save estimate."); }
    finally { setSaving(false); }
  }

  const inputStyle = "input text-xs";

  return (
    <div className="flex flex-col gap-5">
      <div>
        <h3 style={{ fontFamily: "var(--font-heading)", fontSize: "0.7rem", fontWeight: 700, letterSpacing: "0.1em", textTransform: "uppercase", color: "var(--color-steel-shine)", marginBottom: "0.75rem" }}>Line Items</h3>
        <div className="flex flex-col gap-2">
          {lineItems.map((item, i) => (
            <div key={i} className="grid grid-cols-12 gap-2 items-center">
              <input className={`col-span-5 ${inputStyle}`} placeholder="Description" value={item.description} onChange={(e) => updateLineItem(i, "description", e.target.value)} />
              <input className={`col-span-2 ${inputStyle} text-right`} type="number" min="0" step="1" placeholder="Qty" value={item.quantity} onChange={(e) => updateLineItem(i, "quantity", e.target.value)} />
              <input className={`col-span-2 ${inputStyle} text-right`} type="number" min="0" step="0.01" placeholder="Unit $" value={item.unit_price} onChange={(e) => updateLineItem(i, "unit_price", e.target.value)} />
              <div className="col-span-2 text-xs text-right" style={{ color: "var(--color-text-secondary)" }}>${item.total.toFixed(2)}</div>
              <button type="button" onClick={() => removeLineItem(i)} className="col-span-1 text-xs font-bold" style={{ color: "var(--color-error)" }}>✕</button>
            </div>
          ))}
        </div>
        <button type="button" onClick={addLineItem} className="mt-2 text-xs underline" style={{ color: "var(--color-accent-orange)" }}>+ Add line item</button>
      </div>

      <div>
        <label className="label">Notes (optional)</label>
        <textarea value={notes} onChange={(e) => setNotes(e.target.value)} rows={2} className="input resize-none" />
      </div>

      <div className="flex items-center justify-between">
        <span className="text-sm font-semibold" style={{ color: "var(--color-text-primary)" }}>Total: ${totalAmount.toFixed(2)}</span>
        <button type="button" onClick={handleSave} disabled={saving || lineItems.length === 0} className="btn-primary">
          {saving ? "Saving…" : "Save Estimate"}
        </button>
      </div>
      {saveError && <p className="text-xs" style={{ color: "var(--color-error)" }}>{saveError}</p>}

      {savedEstimate && client && (
        <div className="mt-4 overflow-hidden" style={{ borderRadius: "var(--radius-md)", border: "1px solid var(--color-steel-dim)" }}>
          <EstimateDocument estimate={savedEstimate} workOrder={workOrder} client={client} />
        </div>
      )}
    </div>
  );
}

function HoursTab({ workOrderId, timeEntries, totalMinutes, onEntryStarted, onEntryStopped }: {
  workOrderId: string; timeEntries: TimeEntry[]; totalMinutes: number;
  onEntryStarted: (e: TimeEntry) => void; onEntryStopped: (e: TimeEntry, newTotal: number) => void;
}) {
  const activeEntry = timeEntries.find((e) => e.stopped_at === null) ?? null;
  return (
    <div className="flex flex-col gap-4">
      <TimeTracker workOrderId={workOrderId} totalBillableMinutes={totalMinutes} activeEntry={activeEntry} onEntryStarted={onEntryStarted} onEntryStopped={onEntryStopped} />
      {timeEntries.length > 0 && (
        <ul className="flex flex-col gap-2">
          {timeEntries.map((entry) => (
            <li key={entry.id} className="px-4 py-2 text-sm flex items-center justify-between" style={{ borderRadius: "var(--radius-md)", border: "1px solid var(--color-steel-dim)", background: "var(--color-bg-elevated)" }}>
              <span style={{ color: "var(--color-text-secondary)" }}>{new Date(entry.started_at).toLocaleString()}</span>
              <span style={{ color: "var(--color-text-muted)" }}>{entry.stopped_at ? `${entry.duration_minutes ?? 0} min` : "Running…"}</span>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

function BillTab({ workOrderId, bill: initialBill, workOrder, client, onBillCreated }: {
  workOrderId: string; bill: Bill | null; workOrder: WorkOrder;
  client: UserProfile | null; onBillCreated: (b: Bill) => void;
}) {
  const [bill, setBill] = useState<Bill | null>(initialBill);
  const [materialsPaidBy, setMaterialsPaidBy] = useState<MaterialsPaidBy>("company");
  const [materialsCost, setMaterialsCost] = useState("");
  const [clientMaterialsCost, setClientMaterialsCost] = useState("");
  const [laborCost, setLaborCost] = useState("");
  const [generating, setGenerating] = useState(false);
  const [genError, setGenError] = useState<string | null>(null);

  const clientMaterialsNum = parseFloat(clientMaterialsCost) || 0;
  const laborNum = parseFloat(laborCost) || 0;
  const materialsNum = parseFloat(materialsCost) || 0;
  const totalBilled = materialsPaidBy === "both" ? clientMaterialsNum + laborNum : materialsPaidBy === "client" ? materialsNum + laborNum : laborNum;

  async function handleGenerate() {
    setGenerating(true); setGenError(null);
    try {
      const res = await fetch(`/api/admin/work-orders/${workOrderId}/bills`, {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ materials_cost: materialsNum, materials_paid_by: materialsPaidBy, client_materials_cost: clientMaterialsNum, labor_cost: laborNum, total_billed: totalBilled }),
      });
      if (!res.ok) { const j = await res.json().catch(() => ({})); throw new Error(j.error ?? `HTTP ${res.status}`); }
      const newBill: Bill = await res.json();
      setBill(newBill); onBillCreated(newBill);
    } catch (err) { setGenError(err instanceof Error ? err.message : "Failed to generate bill."); }
    finally { setGenerating(false); }
  }

  if (bill && client) {
    return <div className="overflow-hidden" style={{ borderRadius: "var(--radius-md)", border: "1px solid var(--color-steel-dim)" }}><BillDocument bill={bill} workOrder={workOrder} client={client} /></div>;
  }

  if (bill) {
    return (
      <dl className="grid grid-cols-2 gap-x-4 gap-y-2 text-sm">
        {[["Receipt #", bill.receipt_number], ["Total Billed", `$${bill.total_billed.toFixed(2)}`]].map(([l, v]) => (
          <><dt key={`dt-${l}`} style={{ color: "var(--color-text-muted)" }}>{l}</dt><dd key={`dd-${l}`} style={{ color: "var(--color-text-primary)", fontWeight: 500 }}>{v}</dd></>
        ))}
        <dt style={{ color: "var(--color-text-muted)" }}>Balance</dt>
        <dd style={{ color: bill.balance_remaining === 0 ? "var(--color-success)" : "var(--color-accent-orange)", fontWeight: 500 }}>
          {bill.balance_remaining === 0 ? "Paid in Full" : `$${bill.balance_remaining.toFixed(2)}`}
        </dd>
      </dl>
    );
  }

  return (
    <div className="flex flex-col gap-4">
      <h3 style={{ fontFamily: "var(--font-heading)", fontSize: "0.7rem", fontWeight: 700, letterSpacing: "0.1em", textTransform: "uppercase", color: "var(--color-steel-shine)" }}>Generate Bill</h3>
      <div>
        <label className="label">Who purchased materials?</label>
        <select value={materialsPaidBy} onChange={(e) => setMaterialsPaidBy(e.target.value as MaterialsPaidBy)} className="input select">
          <option value="company">Company (contractor)</option>
          <option value="client">Client</option>
          <option value="both">Both</option>
        </select>
      </div>
      <div>
        <label className="label">Total materials cost ($)</label>
        <input type="number" min="0" step="0.01" value={materialsCost} onChange={(e) => setMaterialsCost(e.target.value)} className="input" />
      </div>
      {materialsPaidBy === "both" && (
        <div>
          <label className="label">Client&apos;s portion of materials ($)</label>
          <input type="number" min="0" step="0.01" value={clientMaterialsCost} onChange={(e) => setClientMaterialsCost(e.target.value)} className="input" />
        </div>
      )}
      <div>
        <label className="label">Labor cost ($)</label>
        <input type="number" min="0" step="0.01" value={laborCost} onChange={(e) => setLaborCost(e.target.value)} className="input" />
      </div>
      <div className="flex items-center justify-between">
        <span className="text-sm" style={{ color: "var(--color-text-secondary)" }}>
          Total billed: <strong style={{ color: "var(--color-text-primary)" }}>${totalBilled.toFixed(2)}</strong>
        </span>
        <button type="button" onClick={handleGenerate} disabled={generating} className="btn-primary">
          {generating ? "Generating…" : "Generate Bill"}
        </button>
      </div>
      {genError && <p className="text-xs" style={{ color: "var(--color-error)" }}>{genError}</p>}
    </div>
  );
}

/* ── Modify Form ── */

interface ModifyFormProps { workOrder: WorkOrder; onSaved: (updated: WorkOrder) => void; }

function ModifyForm({ workOrder, onSaved }: ModifyFormProps) {
  const [fields, setFields] = useState({
    title: workOrder.title ?? "",
    description: workOrder.description ?? "",
    urgency: workOrder.urgency ?? "",
    category: workOrder.category ?? "",
    property_address: workOrder.property_address ?? "",
    inspection_notes: workOrder.inspection_notes ?? "",
    quoted_amount: workOrder.quoted_amount != null ? String(workOrder.quoted_amount) : "",
  });
  const [saving, setSaving] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);

  function handleChange(e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) {
    setFields((prev) => ({ ...prev, [e.target.name]: e.target.value }));
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault(); setSaving(true); setSaveError(null);
    try {
      const body: Record<string, unknown> = { ...fields };
      body.quoted_amount = fields.quoted_amount !== "" ? parseFloat(fields.quoted_amount) : null;
      const res = await fetch(`/api/admin/work-orders/${workOrder.id}`, {
        method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify(body),
      });
      if (!res.ok) { const j = await res.json().catch(() => ({})); throw new Error(j.error ?? `HTTP ${res.status}`); }
      onSaved(await res.json());
    } catch (err) { setSaveError(err instanceof Error ? err.message : "Failed to save changes."); }
    finally { setSaving(false); }
  }

  return (
    <form onSubmit={handleSubmit} className="px-6 py-4 flex flex-col gap-3" style={{ borderBottom: "1px solid var(--color-steel-dim)", background: "var(--color-bg-elevated)" }}>
      <h3 style={{ fontFamily: "var(--font-heading)", fontSize: "0.7rem", fontWeight: 700, letterSpacing: "0.1em", textTransform: "uppercase", color: "var(--color-steel-shine)" }}>Modify Work Order</h3>
      <div className="grid grid-cols-2 gap-3">
        <div className="col-span-2">
          <label className="label">Title</label>
          <input name="title" value={fields.title} onChange={handleChange} className="input" />
        </div>
        <div>
          <label className="label">Urgency</label>
          <select name="urgency" value={fields.urgency} onChange={handleChange} className="input select">
            <option value="">— select —</option>
            {URGENCY_OPTIONS.map((u) => <option key={u} value={u}>{u}</option>)}
          </select>
        </div>
        <div>
          <label className="label">Category</label>
          <select name="category" value={fields.category} onChange={handleChange} className="input select">
            <option value="">— select —</option>
            {CATEGORY_OPTIONS.map((c) => <option key={c} value={c}>{c}</option>)}
          </select>
        </div>
        <div className="col-span-2">
          <label className="label">Property Address</label>
          <input name="property_address" value={fields.property_address} onChange={handleChange} className="input" />
        </div>
        <div>
          <label className="label">Quoted Amount</label>
          <input name="quoted_amount" type="number" step="0.01" value={fields.quoted_amount} onChange={handleChange} className="input" />
        </div>
        <div className="col-span-2">
          <label className="label">Description</label>
          <textarea name="description" value={fields.description} onChange={handleChange} rows={3} className="input resize-none" />
        </div>
        <div className="col-span-2">
          <label className="label">Inspection Notes</label>
          <textarea name="inspection_notes" value={fields.inspection_notes} onChange={handleChange} rows={2} className="input resize-none" />
        </div>
      </div>
      {saveError && <p className="text-xs" style={{ color: "var(--color-error)" }}>{saveError}</p>}
      <div className="flex gap-2">
        <button type="submit" disabled={saving} className="btn-primary">{saving ? "Saving…" : "Save Changes"}</button>
      </div>
    </form>
  );
}
