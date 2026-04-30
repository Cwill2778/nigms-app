"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import FormError from "@/components/FormError";
import LoadingSpinner from "@/components/LoadingSpinner";
import ConfirmDialog from "@/components/ConfirmDialog";
import ClientSearchInput, { type ClientSearchResult } from "@/components/ClientSearchInput";
import PrintButton from "@/components/PrintButton";
import type { WorkOrder, Payment } from "@/lib/types";

interface WorkOrderOption { id: string; title: string; client_id: string; }
interface BillInfo { balance_remaining: number; }

export default function ManualPaymentForm() {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [selectedClient, setSelectedClient] = useState<ClientSearchResult | null>(null);
  const [workOrders, setWorkOrders] = useState<WorkOrderOption[]>([]);
  const [workOrderId, setWorkOrderId] = useState("");
  const [loadingWorkOrders, setLoadingWorkOrders] = useState(false);
  const [billInfo, setBillInfo] = useState<BillInfo | null>(null);
  const [amount, setAmount] = useState("");
  const [paymentDate, setPaymentDate] = useState(() => new Date().toISOString().split("T")[0]);
  const [notes, setNotes] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showConfirm, setShowConfirm] = useState(false);
  const [receipt, setReceipt] = useState<Payment | null>(null);
  const [receiptWorkOrder, setReceiptWorkOrder] = useState<WorkOrderOption | null>(null);
  const [receiptBillInfo, setReceiptBillInfo] = useState<BillInfo | null>(null);
  const [receiptClient, setReceiptClient] = useState<ClientSearchResult | null>(null);

  useEffect(() => {
    if (!selectedClient) { setWorkOrders([]); setWorkOrderId(""); setBillInfo(null); return; }
    setLoadingWorkOrders(true);
    fetch(`/api/admin/work-orders?client_id=${selectedClient.id}`)
      .then((r) => r.json())
      .then((data: WorkOrder[]) => setWorkOrders((Array.isArray(data) ? data : []).map((wo) => ({ id: wo.id, title: wo.title, client_id: wo.client_id }))))
      .catch(() => setWorkOrders([]))
      .finally(() => setLoadingWorkOrders(false));
  }, [selectedClient]);

  useEffect(() => {
    if (!workOrderId) { setBillInfo(null); return; }
    fetch(`/api/admin/work-orders/${workOrderId}/bills`)
      .then((r) => r.json())
      .then((data) => {
        const bill = Array.isArray(data) ? data[0] : data;
        setBillInfo(bill && typeof bill.balance_remaining === "number" ? { balance_remaining: bill.balance_remaining } : null);
      })
      .catch(() => setBillInfo(null));
  }, [workOrderId]);

  function handleClientSelect(client: ClientSearchResult) {
    setSelectedClient(client); setWorkOrderId(""); setBillInfo(null); setError(null);
  }

  function validateAndSubmit(e: React.FormEvent) {
    e.preventDefault(); setError(null);
    const parsedAmount = parseFloat(amount);
    if (isNaN(parsedAmount) || parsedAmount <= 0) { setError("Amount must be greater than zero"); return; }
    if (billInfo !== null && parsedAmount > billInfo.balance_remaining) { setShowConfirm(true); return; }
    submitPayment();
  }

  async function submitPayment() {
    setShowConfirm(false); setLoading(true); setError(null);
    try {
      const res = await fetch("/api/admin/payments/manual", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ clientId: selectedClient?.id, workOrderId, amount: parseFloat(amount), payment_date: paymentDate || undefined, notes: notes || undefined }),
      });
      const data = await res.json();
      if (!res.ok) { setError(data.error ?? "Failed to record payment"); return; }
      const wo = workOrders.find((w) => w.id === workOrderId) ?? null;
      setReceipt(data as Payment); setReceiptWorkOrder(wo); setReceiptBillInfo(billInfo); setReceiptClient(selectedClient);
      setSelectedClient(null); setWorkOrderId(""); setWorkOrders([]); setAmount("");
      setPaymentDate(new Date().toISOString().split("T")[0]); setNotes(""); setBillInfo(null);
      router.refresh();
    } catch { setError("Unexpected error."); } finally { setLoading(false); }
  }

  function getClientDisplayName(client: ClientSearchResult) {
    return [client.first_name, client.last_name].filter(Boolean).join(" ") || client.username;
  }

  return (
    <div>
      {/* Receipt */}
      {receipt && (
        <div
          className="print-section p-6 max-w-lg mb-6"
          style={{
            background: "#fff",
            color: "#000",
            borderRadius: "var(--radius-md)",
            border: "1px solid #e5e7eb",
          }}
        >
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-bold" style={{ color: "#000" }}>Payment Receipt</h2>
            <PrintButton />
          </div>
          <div className="space-y-2 text-sm">
            {[
              ["Receipt #", receipt.receipt_number ?? "—"],
              ["Amount", `$${Number(receipt.amount).toFixed(2)}`],
              ["Payment Date", receipt.payment_date ?? receipt.created_at?.split("T")[0] ?? "—"],
              receiptClient ? ["Client", getClientDisplayName(receiptClient)] : null,
              receiptWorkOrder ? ["Work Order", receiptWorkOrder.title] : null,
            ].filter((item): item is [string, string] => item !== null).map(([label, value]) => (
              <div key={label} className="flex justify-between">
                <span className="font-medium">{label}</span>
                <span>{value}</span>
              </div>
            ))}
            <div className="border-t border-gray-200 pt-2 mt-2 text-center">
              {receiptBillInfo !== null ? (
                receiptBillInfo.balance_remaining <= 0
                  ? <p className="font-bold text-green-700">PAID IN FULL</p>
                  : <p>Remaining balance: <strong>${receiptBillInfo.balance_remaining.toFixed(2)}</strong></p>
              ) : (
                <p className="text-gray-500 italic">Receipt</p>
              )}
            </div>
          </div>
          <div className="mt-4 no-print">
            <button
              type="button"
              onClick={() => setReceipt(null)}
              className="btn-ghost text-sm"
              style={{ color: "var(--color-accent-orange)" }}
            >
              Record another payment
            </button>
          </div>
        </div>
      )}

      {!receipt && (
        <>
          {!open ? (
            <button onClick={() => setOpen(true)} className="btn-primary">
              + Record Manual Payment
            </button>
          ) : (
            <form
              onSubmit={validateAndSubmit}
              className="card p-6 flex flex-col gap-4"
              style={{ maxWidth: 440 }}
            >
              <div className="card-header" style={{ margin: "-1.5rem -1.5rem 0", padding: "1rem 1.25rem" }}>
                <span className="card-header-title">Record Manual Payment</span>
              </div>

              {/* Client */}
              <div className="flex flex-col gap-1 pt-2">
                <label className="label">Client <span style={{ color: "var(--color-error)" }}>*</span></label>
                {selectedClient ? (
                  <div
                    className="flex items-center justify-between px-3 py-2 text-sm"
                    style={{
                      borderRadius: "var(--radius-sm)",
                      border: "1px solid var(--color-steel-mid)",
                      background: "var(--color-bg-overlay)",
                      color: "var(--color-text-primary)",
                    }}
                  >
                    <span>{getClientDisplayName(selectedClient)}</span>
                    <button
                      type="button"
                      onClick={() => { setSelectedClient(null); setWorkOrderId(""); setWorkOrders([]); }}
                      className="btn-ghost text-xs ml-2"
                      style={{ padding: "0 0.25rem" }}
                    >
                      ✕
                    </button>
                  </div>
                ) : (
                  <ClientSearchInput onSelect={handleClientSelect} placeholder="Search by name, phone, or ID…" />
                )}
              </div>

              {/* Work order */}
              <div className="flex flex-col gap-1">
                <label className="label">Work Order <span style={{ color: "var(--color-error)" }}>*</span></label>
                <select
                  required
                  value={workOrderId}
                  onChange={(e) => setWorkOrderId(e.target.value)}
                  disabled={!selectedClient || loadingWorkOrders}
                  className="input select"
                >
                  <option value="">{loadingWorkOrders ? "Loading…" : "Select a work order…"}</option>
                  {workOrders.map((wo) => (
                    <option key={wo.id} value={wo.id}>{wo.title}</option>
                  ))}
                </select>
                {billInfo !== null && (
                  <p className="text-xs mt-1" style={{ color: "var(--color-text-muted)" }}>
                    Outstanding balance:{" "}
                    <strong style={{ color: "var(--color-accent-orange)" }}>
                      ${billInfo.balance_remaining.toFixed(2)}
                    </strong>
                  </p>
                )}
              </div>

              {/* Amount */}
              <div className="flex flex-col gap-1">
                <label className="label">Amount (USD) <span style={{ color: "var(--color-error)" }}>*</span></label>
                <input type="number" required min="0.01" step="0.01" value={amount} onChange={(e) => setAmount(e.target.value)} className="input" />
              </div>

              {/* Date */}
              <div className="flex flex-col gap-1">
                <label className="label">Payment Date</label>
                <input type="date" value={paymentDate} onChange={(e) => setPaymentDate(e.target.value)} className="input" />
              </div>

              {/* Notes */}
              <div className="flex flex-col gap-1">
                <label className="label">
                  Notes{" "}
                  <span style={{ color: "var(--color-text-muted)", fontWeight: 400, textTransform: "none", letterSpacing: 0 }}>
                    (optional)
                  </span>
                </label>
                <textarea value={notes} onChange={(e) => setNotes(e.target.value)} rows={3} className="input resize-none" />
              </div>

              <FormError message={error} />

              <div className="flex gap-3">
                <button type="submit" disabled={loading} className="btn-primary flex items-center gap-2">
                  {loading && <LoadingSpinner size="sm" />}
                  Record Payment
                </button>
                <button
                  type="button"
                  onClick={() => { setOpen(false); setError(null); }}
                  className="btn-secondary"
                >
                  Cancel
                </button>
              </div>
            </form>
          )}
        </>
      )}

      <ConfirmDialog
        isOpen={showConfirm}
        title="Amount exceeds outstanding balance"
        message={`The entered amount ($${parseFloat(amount || "0").toFixed(2)}) exceeds the outstanding balance${billInfo ? ` ($${billInfo.balance_remaining.toFixed(2)})` : ""}. Do you want to proceed?`}
        onConfirm={submitPayment}
        onCancel={() => setShowConfirm(false)}
      />
    </div>
  );
}
