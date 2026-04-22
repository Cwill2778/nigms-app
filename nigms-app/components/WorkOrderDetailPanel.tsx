"use client";

import { useEffect, useState } from "react";
import LoadingSpinner from "@/components/LoadingSpinner";
import StatusBadge from "@/components/StatusBadge";
import TimeTracker from "@/components/TimeTracker";
import EstimateDocument from "@/components/EstimateDocument";
import BillDocument from "@/components/BillDocument";
import ICAgreement from "@/components/ICAgreement";
import ChangeOrderForm from "@/components/ChangeOrderForm";
import type {
  WorkOrder,
  Estimate,
  EstimateLineItem,
  Bill,
  ChangeOrder,
  TimeEntry,
  UserProfile,
  WorkOrderPicture,
  UrgencyLevel,
  MaterialsPaidBy,
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

const URGENCY_COLORS: Record<UrgencyLevel, string> = {
  low: "bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400",
  medium: "bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400",
  high: "bg-orange-100 text-orange-800 dark:bg-orange-900/30 dark:text-orange-400",
  emergency: "bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400",
};

const CATEGORY_OPTIONS = [
  "plumbing",
  "framing",
  "preventive maintenance",
  "general maintenance",
  "appliance repair",
  "appliance replacement",
  "roof repair",
  "flooring",
  "exterior",
  "interior",
];

const URGENCY_OPTIONS: UrgencyLevel[] = ["low", "medium", "high", "emergency"];

function formatDate(dateStr: string) {
  return new Intl.DateTimeFormat("en-US", {
    year: "numeric",
    month: "short",
    day: "numeric",
  }).format(new Date(dateStr));
}

export default function WorkOrderDetailPanel({
  workOrderId,
  onClose: _onClose,
}: WorkOrderDetailPanelProps) {
  const [detail, setDetail] = useState<WorkOrderDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<Tab>("overview");
  const [showModifyForm, setShowModifyForm] = useState(false);
  const [actionError, setActionError] = useState<string | null>(null);
  const [actionLoading, setActionLoading] = useState(false);

  async function fetchDetail() {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(`/api/admin/work-orders/${workOrderId}/detail`);
      if (!res.ok) {
        const body = await res.json().catch(() => ({}));
        throw new Error(body.error ?? `HTTP ${res.status}`);
      }
      const json = await res.json();
      setDetail(json);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load work order details.");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    fetchDetail();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [workOrderId]);

  async function handleAccept() {
    if (!detail) return;
    setActionLoading(true);
    setActionError(null);
    try {
      const res = await fetch(`/api/admin/work-orders/${workOrderId}/accept`, { method: "POST" });
      if (!res.ok) {
        const body = await res.json().catch(() => ({}));
        throw new Error(body.error ?? `HTTP ${res.status}`);
      }
      const updated: WorkOrder = await res.json();
      setDetail((prev) => prev ? { ...prev, workOrder: updated } : prev);
    } catch (err) {
      setActionError(err instanceof Error ? err.message : "Failed to accept work order.");
    } finally {
      setActionLoading(false);
    }
  }

  async function handleReject() {
    if (!detail) return;
    setActionLoading(true);
    setActionError(null);
    try {
      const res = await fetch(`/api/admin/work-orders/${workOrderId}/reject`, { method: "POST" });
      if (!res.ok) {
        const body = await res.json().catch(() => ({}));
        throw new Error(body.error ?? `HTTP ${res.status}`);
      }
      const updated: WorkOrder = await res.json();
      setDetail((prev) => prev ? { ...prev, workOrder: updated } : prev);
    } catch (err) {
      setActionError(err instanceof Error ? err.message : "Failed to reject work order.");
    } finally {
      setActionLoading(false);
    }
  }

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

  if (!detail) return null;

  const { workOrder, estimate, bill, changeOrders, timeEntries, client } = detail;
  const isActionable = workOrder.status === "pending" || workOrder.status === "in_progress";
  const isAcceptedOrCompleted = workOrder.status === "accepted" || workOrder.status === "completed";

  const clientName =
    client?.first_name && client?.last_name
      ? `${client.first_name} ${client.last_name}`
      : client?.username ?? workOrder.client_id;

  const tabs: { key: Tab; label: string; show: boolean }[] = [
    { key: "overview", label: "Overview", show: true },
    { key: "estimate", label: "Estimate", show: true },
    { key: "hours", label: "Billable Hours", show: isAcceptedOrCompleted },
    { key: "bill", label: "Bill", show: true },
    { key: "icAgreement", label: "IC Agreement", show: isAcceptedOrCompleted },
    { key: "changeOrders", label: "Change Orders", show: isAcceptedOrCompleted },
  ];

  const visibleTabs = tabs.filter((t) => t.show);

  return (
    <div className="flex flex-col h-full text-white">
      {/* WO number header */}
      <div className="px-6 py-4 border-b border-[#4A4A4A]">
        <div className="flex items-center justify-between gap-2">
          <p className="text-lg font-semibold">
            {workOrder.wo_number ?? "Pending Assignment"}
          </p>
          <StatusBadge status={workOrder.status} />
        </div>
        <p className="text-sm text-gray-400 mt-0.5">{workOrder.title}</p>
      </div>

      {/* Action buttons */}
      {isActionable && (
        <div className="px-6 py-3 border-b border-[#4A4A4A] flex flex-wrap gap-2">
          <button
            onClick={handleAccept}
            disabled={actionLoading}
            className="px-3 py-1.5 text-sm font-medium bg-green-600 hover:bg-green-700 disabled:opacity-50 text-white rounded-md transition-colors"
          >
            Accept
          </button>
          <button
            onClick={handleReject}
            disabled={actionLoading}
            className="px-3 py-1.5 text-sm font-medium bg-red-600 hover:bg-red-700 disabled:opacity-50 text-white rounded-md transition-colors"
          >
            Reject
          </button>
          <button
            onClick={() => setShowModifyForm((v) => !v)}
            disabled={actionLoading}
            className="px-3 py-1.5 text-sm font-medium bg-gray-600 hover:bg-gray-700 disabled:opacity-50 text-white rounded-md transition-colors"
          >
            {showModifyForm ? "Cancel" : "Modify"}
          </button>
          {actionError && (
            <p className="w-full text-xs text-red-400 mt-1">{actionError}</p>
          )}
        </div>
      )}

      {/* Modify form */}
      {showModifyForm && (
        <ModifyForm
          workOrder={workOrder}
          onSaved={(updated) => {
            setDetail((prev) => prev ? { ...prev, workOrder: updated } : prev);
            setShowModifyForm(false);
          }}
        />
      )}

      {/* Tabs */}
      <div className="flex border-b border-[#4A4A4A] overflow-x-auto shrink-0">
        {visibleTabs.map((tab) => (
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
        {activeTab === "overview" && (
          <OverviewTab
            workOrder={workOrder}
            clientName={clientName}
            formatDate={formatDate}
          />
        )}
        {activeTab === "estimate" && (
          <EstimateTab
            workOrderId={workOrder.id}
            estimate={estimate}
            workOrder={workOrder}
            client={client}
            onEstimateSaved={(est) =>
              setDetail((prev) => prev ? { ...prev, estimate: est } : prev)
            }
          />
        )}
        {activeTab === "hours" && isAcceptedOrCompleted && (
          <HoursTab
            workOrderId={workOrder.id}
            timeEntries={timeEntries}
            totalMinutes={workOrder.total_billable_minutes}
            onEntryStarted={(entry) => {
              setDetail((prev) =>
                prev ? { ...prev, timeEntries: [...prev.timeEntries, entry] } : prev
              );
            }}
            onEntryStopped={(entry, newTotal) => {
              setDetail((prev) => {
                if (!prev) return prev;
                return {
                  ...prev,
                  workOrder: { ...prev.workOrder, total_billable_minutes: newTotal },
                  timeEntries: prev.timeEntries.map((e) =>
                    e.id === entry.id ? entry : e
                  ),
                };
              });
            }}
          />
        )}
        {activeTab === "bill" && (
          <BillTab
            workOrderId={workOrder.id}
            bill={bill}
            workOrder={workOrder}
            client={client}
            onBillCreated={(newBill) =>
              setDetail((prev) => prev ? { ...prev, bill: newBill } : prev)
            }
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

/* ── Sub-sections ─────────────────────────────────────────────────────────── */

function OverviewTab({
  workOrder,
  clientName,
  formatDate,
}: {
  workOrder: WorkOrder;
  clientName: string;
  formatDate: (d: string) => string;
}) {
  return (
    <div className="flex flex-col gap-5">
      <dl className="grid grid-cols-2 gap-x-4 gap-y-3 text-sm">
        <dt className="text-gray-400">WO Number</dt>
        <dd className="text-white">{workOrder.wo_number ?? "Pending Assignment"}</dd>

        <dt className="text-gray-400">Property</dt>
        <dd className="text-white">{workOrder.property_address ?? "—"}</dd>

        <dt className="text-gray-400">Urgency</dt>
        <dd>
          {workOrder.urgency ? (
            <span
              className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${URGENCY_COLORS[workOrder.urgency]}`}
            >
              {workOrder.urgency}
            </span>
          ) : (
            <span className="text-white">—</span>
          )}
        </dd>

        <dt className="text-gray-400">Category</dt>
        <dd className="text-white capitalize">{workOrder.category ?? "—"}</dd>

        <dt className="text-gray-400">Client</dt>
        <dd className="text-white">{clientName}</dd>

        <dt className="text-gray-400">Created</dt>
        <dd className="text-white">{formatDate(workOrder.created_at)}</dd>

        {workOrder.quoted_amount != null && (
          <>
            <dt className="text-gray-400">Quoted</dt>
            <dd className="text-white">
              {new Intl.NumberFormat("en-US", { style: "currency", currency: "USD" }).format(
                workOrder.quoted_amount
              )}
            </dd>
          </>
        )}
      </dl>

      {workOrder.description && (
        <section>
          <h3 className="text-xs font-semibold uppercase tracking-widest text-gray-400 mb-2">
            Scope of Work
          </h3>
          <p className="text-sm text-gray-200 whitespace-pre-wrap">{workOrder.description}</p>
        </section>
      )}

      {workOrder.inspection_notes && (
        <section>
          <h3 className="text-xs font-semibold uppercase tracking-widest text-gray-400 mb-2">
            Inspection Notes
          </h3>
          <p className="text-sm text-gray-200 whitespace-pre-wrap">{workOrder.inspection_notes}</p>
        </section>
      )}
    </div>
  );
}

function EstimateTab({
  workOrderId,
  estimate: initialEstimate,
  workOrder,
  client,
  onEstimateSaved,
}: {
  workOrderId: string;
  estimate: Estimate | null;
  workOrder: WorkOrder;
  client: UserProfile | null;
  onEstimateSaved: (estimate: Estimate) => void;
}) {
  const [lineItems, setLineItems] = useState<EstimateLineItem[]>(
    initialEstimate?.line_items ?? []
  );
  const [notes, setNotes] = useState(initialEstimate?.notes ?? "");
  const [saving, setSaving] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);
  const [savedEstimate, setSavedEstimate] = useState<Estimate | null>(initialEstimate);

  const totalAmount = lineItems.reduce((sum, item) => sum + item.total, 0);

  function addLineItem() {
    setLineItems((prev) => [
      ...prev,
      { description: "", quantity: 1, unit_price: 0, total: 0 },
    ]);
  }

  function removeLineItem(index: number) {
    setLineItems((prev) => prev.filter((_, i) => i !== index));
  }

  function updateLineItem(index: number, field: keyof EstimateLineItem, value: string) {
    setLineItems((prev) =>
      prev.map((item, i) => {
        if (i !== index) return item;
        const updated = {
          ...item,
          [field]: field === "description" ? value : parseFloat(value) || 0,
        };
        if (field === "quantity" || field === "unit_price") {
          updated.total = updated.quantity * updated.unit_price;
        }
        return updated;
      })
    );
  }

  async function handleSave() {
    setSaving(true);
    setSaveError(null);
    try {
      const res = await fetch(`/api/admin/work-orders/${workOrderId}/estimates`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          line_items: lineItems,
          notes: notes || undefined,
          total_amount: totalAmount,
        }),
      });
      if (!res.ok) {
        const json = await res.json().catch(() => ({}));
        throw new Error(json.error ?? `HTTP ${res.status}`);
      }
      const est: Estimate = await res.json();
      setSavedEstimate(est);
      onEstimateSaved(est);
    } catch (err) {
      setSaveError(err instanceof Error ? err.message : "Failed to save estimate.");
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="flex flex-col gap-5">
      <div>
        <h3 className="text-xs font-semibold uppercase tracking-widest text-gray-400 mb-3">
          Line Items
        </h3>
        <div className="flex flex-col gap-2">
          {lineItems.map((item, i) => (
            <div key={i} className="grid grid-cols-12 gap-2 items-center">
              <input
                className="col-span-5 rounded border border-[#4A4A4A] bg-[#162d5e] px-2 py-1.5 text-xs text-white focus:outline-none focus:ring-1 focus:ring-orange-400"
                placeholder="Description"
                value={item.description}
                onChange={(e) => updateLineItem(i, "description", e.target.value)}
              />
              <input
                className="col-span-2 rounded border border-[#4A4A4A] bg-[#162d5e] px-2 py-1.5 text-xs text-white text-right focus:outline-none focus:ring-1 focus:ring-orange-400"
                type="number"
                min="0"
                step="1"
                placeholder="Qty"
                value={item.quantity}
                onChange={(e) => updateLineItem(i, "quantity", e.target.value)}
              />
              <input
                className="col-span-2 rounded border border-[#4A4A4A] bg-[#162d5e] px-2 py-1.5 text-xs text-white text-right focus:outline-none focus:ring-1 focus:ring-orange-400"
                type="number"
                min="0"
                step="0.01"
                placeholder="Unit $"
                value={item.unit_price}
                onChange={(e) => updateLineItem(i, "unit_price", e.target.value)}
              />
              <div className="col-span-2 text-xs text-right text-gray-300 pr-1">
                ${item.total.toFixed(2)}
              </div>
              <button
                type="button"
                onClick={() => removeLineItem(i)}
                className="col-span-1 text-red-400 hover:text-red-300 text-xs font-bold"
              >
                ✕
              </button>
            </div>
          ))}
        </div>
        <button
          type="button"
          onClick={addLineItem}
          className="mt-2 text-xs text-orange-400 hover:text-orange-300 underline"
        >
          + Add line item
        </button>
      </div>

      <div>
        <label className="block text-xs text-gray-400 mb-1">Notes (optional)</label>
        <textarea
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
          rows={2}
          className="w-full rounded border border-[#4A4A4A] bg-[#162d5e] px-3 py-2 text-sm text-white focus:outline-none focus:ring-1 focus:ring-orange-400 resize-none"
        />
      </div>

      <div className="flex items-center justify-between">
        <span className="text-sm font-semibold text-white">
          Total: ${totalAmount.toFixed(2)}
        </span>
        <button
          type="button"
          onClick={handleSave}
          disabled={saving || lineItems.length === 0}
          className="px-4 py-2 text-sm font-medium bg-orange-500 hover:bg-orange-600 disabled:opacity-50 text-white rounded-md transition-colors"
        >
          {saving ? "Saving…" : "Save Estimate"}
        </button>
      </div>
      {saveError && <p className="text-xs text-red-400">{saveError}</p>}

      {savedEstimate && client && (
        <div className="mt-4 border border-[#4A4A4A] rounded-md overflow-hidden">
          <EstimateDocument
            estimate={savedEstimate}
            workOrder={workOrder}
            client={client}
          />
        </div>
      )}
    </div>
  );
}

function HoursTab({
  workOrderId,
  timeEntries,
  totalMinutes,
  onEntryStarted,
  onEntryStopped,
}: {
  workOrderId: string;
  timeEntries: TimeEntry[];
  totalMinutes: number;
  onEntryStarted: (entry: TimeEntry) => void;
  onEntryStopped: (entry: TimeEntry, newTotalMinutes: number) => void;
}) {
  const activeEntry = timeEntries.find((e) => e.stopped_at === null) ?? null;

  return (
    <div className="flex flex-col gap-4">
      <TimeTracker
        workOrderId={workOrderId}
        totalBillableMinutes={totalMinutes}
        activeEntry={activeEntry}
        onEntryStarted={onEntryStarted}
        onEntryStopped={onEntryStopped}
      />
      {timeEntries.length > 0 && (
        <ul className="flex flex-col gap-2">
          {timeEntries.map((entry) => (
            <li
              key={entry.id}
              className="rounded-md border border-[#4A4A4A] bg-[#0d2550] px-4 py-2 text-sm flex items-center justify-between"
            >
              <span className="text-gray-300">
                {new Date(entry.started_at).toLocaleString()}
              </span>
              <span className="text-gray-400">
                {entry.stopped_at
                  ? `${entry.duration_minutes ?? 0} min`
                  : "Running…"}
              </span>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

function BillTab({
  workOrderId,
  bill: initialBill,
  workOrder,
  client,
  onBillCreated,
}: {
  workOrderId: string;
  bill: Bill | null;
  workOrder: WorkOrder;
  client: UserProfile | null;
  onBillCreated: (bill: Bill) => void;
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
  const totalBilled =
    materialsPaidBy === "both"
      ? clientMaterialsNum + laborNum
      : materialsPaidBy === "client"
      ? materialsNum + laborNum
      : laborNum;

  async function handleGenerate() {
    setGenerating(true);
    setGenError(null);
    try {
      const res = await fetch(`/api/admin/work-orders/${workOrderId}/bills`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          materials_cost: materialsNum,
          materials_paid_by: materialsPaidBy,
          client_materials_cost: clientMaterialsNum,
          labor_cost: laborNum,
          total_billed: totalBilled,
        }),
      });
      if (!res.ok) {
        const json = await res.json().catch(() => ({}));
        throw new Error(json.error ?? `HTTP ${res.status}`);
      }
      const newBill: Bill = await res.json();
      setBill(newBill);
      onBillCreated(newBill);
    } catch (err) {
      setGenError(err instanceof Error ? err.message : "Failed to generate bill.");
    } finally {
      setGenerating(false);
    }
  }

  if (bill && client) {
    return (
      <div className="border border-[#4A4A4A] rounded-md overflow-hidden">
        <BillDocument bill={bill} workOrder={workOrder} client={client} />
      </div>
    );
  }

  if (bill) {
    return (
      <div className="flex flex-col gap-3 text-sm">
        <dl className="grid grid-cols-2 gap-x-4 gap-y-2">
          <dt className="text-gray-400">Receipt #</dt>
          <dd className="text-white">{bill.receipt_number}</dd>
          <dt className="text-gray-400">Total Billed</dt>
          <dd className="text-white font-semibold">${bill.total_billed.toFixed(2)}</dd>
          <dt className="text-gray-400">Balance</dt>
          <dd className={bill.balance_remaining === 0 ? "text-green-400" : "text-orange-400"}>
            {bill.balance_remaining === 0 ? "Paid in Full" : `$${bill.balance_remaining.toFixed(2)}`}
          </dd>
        </dl>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-4">
      <h3 className="text-xs font-semibold uppercase tracking-widest text-gray-400">
        Generate Bill
      </h3>
      <div>
        <label className="block text-xs text-gray-400 mb-1">Who purchased materials?</label>
        <select
          value={materialsPaidBy}
          onChange={(e) => setMaterialsPaidBy(e.target.value as MaterialsPaidBy)}
          className="w-full rounded border border-[#4A4A4A] bg-[#162d5e] px-3 py-2 text-sm text-white focus:outline-none focus:ring-1 focus:ring-orange-400"
        >
          <option value="company">Company (contractor)</option>
          <option value="client">Client</option>
          <option value="both">Both</option>
        </select>
      </div>
      <div>
        <label className="block text-xs text-gray-400 mb-1">Total materials cost ($)</label>
        <input
          type="number"
          min="0"
          step="0.01"
          value={materialsCost}
          onChange={(e) => setMaterialsCost(e.target.value)}
          className="w-full rounded border border-[#4A4A4A] bg-[#162d5e] px-3 py-2 text-sm text-white focus:outline-none focus:ring-1 focus:ring-orange-400"
        />
      </div>
      {materialsPaidBy === "both" && (
        <div>
          <label className="block text-xs text-gray-400 mb-1">
            Client&apos;s portion of materials ($)
          </label>
          <input
            type="number"
            min="0"
            step="0.01"
            value={clientMaterialsCost}
            onChange={(e) => setClientMaterialsCost(e.target.value)}
            className="w-full rounded border border-[#4A4A4A] bg-[#162d5e] px-3 py-2 text-sm text-white focus:outline-none focus:ring-1 focus:ring-orange-400"
          />
        </div>
      )}
      <div>
        <label className="block text-xs text-gray-400 mb-1">Labor cost ($)</label>
        <input
          type="number"
          min="0"
          step="0.01"
          value={laborCost}
          onChange={(e) => setLaborCost(e.target.value)}
          className="w-full rounded border border-[#4A4A4A] bg-[#162d5e] px-3 py-2 text-sm text-white focus:outline-none focus:ring-1 focus:ring-orange-400"
        />
      </div>
      <div className="flex items-center justify-between">
        <span className="text-sm text-gray-300">
          Total billed: <strong className="text-white">${totalBilled.toFixed(2)}</strong>
        </span>
        <button
          type="button"
          onClick={handleGenerate}
          disabled={generating}
          className="px-4 py-2 text-sm font-medium bg-orange-500 hover:bg-orange-600 disabled:opacity-50 text-white rounded-md transition-colors"
        >
          {generating ? "Generating…" : "Generate Bill"}
        </button>
      </div>
      {genError && <p className="text-xs text-red-400">{genError}</p>}
    </div>
  );
}

/* ── Modify Form ──────────────────────────────────────────────────────────── */

interface ModifyFormProps {
  workOrder: WorkOrder;
  onSaved: (updated: WorkOrder) => void;
}

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

  function handleChange(
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>
  ) {
    setFields((prev) => ({ ...prev, [e.target.name]: e.target.value }));
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    setSaveError(null);
    try {
      const body: Record<string, unknown> = { ...fields };
      if (fields.quoted_amount !== "") {
        body.quoted_amount = parseFloat(fields.quoted_amount);
      } else {
        body.quoted_amount = null;
      }
      const res = await fetch(`/api/admin/work-orders/${workOrder.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      if (!res.ok) {
        const json = await res.json().catch(() => ({}));
        throw new Error(json.error ?? `HTTP ${res.status}`);
      }
      const updated: WorkOrder = await res.json();
      onSaved(updated);
    } catch (err) {
      setSaveError(err instanceof Error ? err.message : "Failed to save changes.");
    } finally {
      setSaving(false);
    }
  }

  return (
    <form
      onSubmit={handleSubmit}
      className="px-6 py-4 border-b border-[#4A4A4A] flex flex-col gap-3 bg-[#0d2550]"
    >
      <h3 className="text-xs font-semibold uppercase tracking-widest text-gray-400">
        Modify Work Order
      </h3>

      <div className="grid grid-cols-2 gap-3">
        <div className="col-span-2">
          <label className="block text-xs text-gray-400 mb-1">Title</label>
          <input
            name="title"
            value={fields.title}
            onChange={handleChange}
            className="w-full rounded-md border border-[#4A4A4A] bg-[#162d5e] px-3 py-2 text-sm text-white focus:outline-none focus:ring-1 focus:ring-orange-400"
          />
        </div>

        <div>
          <label className="block text-xs text-gray-400 mb-1">Urgency</label>
          <select
            name="urgency"
            value={fields.urgency}
            onChange={handleChange}
            className="w-full rounded-md border border-[#4A4A4A] bg-[#162d5e] px-3 py-2 text-sm text-white focus:outline-none focus:ring-1 focus:ring-orange-400"
          >
            <option value="">— select —</option>
            {URGENCY_OPTIONS.map((u) => (
              <option key={u} value={u}>{u}</option>
            ))}
          </select>
        </div>

        <div>
          <label className="block text-xs text-gray-400 mb-1">Category</label>
          <select
            name="category"
            value={fields.category}
            onChange={handleChange}
            className="w-full rounded-md border border-[#4A4A4A] bg-[#162d5e] px-3 py-2 text-sm text-white focus:outline-none focus:ring-1 focus:ring-orange-400"
          >
            <option value="">— select —</option>
            {CATEGORY_OPTIONS.map((c) => (
              <option key={c} value={c}>{c}</option>
            ))}
          </select>
        </div>

        <div className="col-span-2">
          <label className="block text-xs text-gray-400 mb-1">Property Address</label>
          <input
            name="property_address"
            value={fields.property_address}
            onChange={handleChange}
            className="w-full rounded-md border border-[#4A4A4A] bg-[#162d5e] px-3 py-2 text-sm text-white focus:outline-none focus:ring-1 focus:ring-orange-400"
          />
        </div>

        <div>
          <label className="block text-xs text-gray-400 mb-1">Quoted Amount</label>
          <input
            name="quoted_amount"
            type="number"
            step="0.01"
            value={fields.quoted_amount}
            onChange={handleChange}
            className="w-full rounded-md border border-[#4A4A4A] bg-[#162d5e] px-3 py-2 text-sm text-white focus:outline-none focus:ring-1 focus:ring-orange-400"
          />
        </div>

        <div className="col-span-2">
          <label className="block text-xs text-gray-400 mb-1">Description</label>
          <textarea
            name="description"
            value={fields.description}
            onChange={handleChange}
            rows={3}
            className="w-full rounded-md border border-[#4A4A4A] bg-[#162d5e] px-3 py-2 text-sm text-white focus:outline-none focus:ring-1 focus:ring-orange-400 resize-none"
          />
        </div>

        <div className="col-span-2">
          <label className="block text-xs text-gray-400 mb-1">Inspection Notes</label>
          <textarea
            name="inspection_notes"
            value={fields.inspection_notes}
            onChange={handleChange}
            rows={2}
            className="w-full rounded-md border border-[#4A4A4A] bg-[#162d5e] px-3 py-2 text-sm text-white focus:outline-none focus:ring-1 focus:ring-orange-400 resize-none"
          />
        </div>
      </div>

      {saveError && <p className="text-xs text-red-400">{saveError}</p>}

      <div className="flex gap-2">
        <button
          type="submit"
          disabled={saving}
          className="px-4 py-2 text-sm font-medium bg-orange-500 hover:bg-orange-600 disabled:opacity-50 text-white rounded-md transition-colors"
        >
          {saving ? "Saving…" : "Save Changes"}
        </button>
      </div>
    </form>
  );
}
