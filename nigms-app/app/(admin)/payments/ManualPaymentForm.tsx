'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import FormError from '@/components/FormError';
import LoadingSpinner from '@/components/LoadingSpinner';
import ConfirmDialog from '@/components/ConfirmDialog';
import ClientSearchInput, { type ClientSearchResult } from '@/components/ClientSearchInput';
import PrintButton from '@/components/PrintButton';
import type { WorkOrder, Payment } from '@/lib/types';

interface WorkOrderOption {
  id: string;
  title: string;
  client_id: string;
}

interface BillInfo {
  balance_remaining: number;
}

export default function ManualPaymentForm() {
  const router = useRouter();
  const [open, setOpen] = useState(false);

  // Selected client
  const [selectedClient, setSelectedClient] = useState<ClientSearchResult | null>(null);

  // Work orders for selected client
  const [workOrders, setWorkOrders] = useState<WorkOrderOption[]>([]);
  const [workOrderId, setWorkOrderId] = useState('');
  const [loadingWorkOrders, setLoadingWorkOrders] = useState(false);

  // Bill info for outstanding balance
  const [billInfo, setBillInfo] = useState<BillInfo | null>(null);

  // Form fields
  const [amount, setAmount] = useState('');
  const [paymentDate, setPaymentDate] = useState(() => new Date().toISOString().split('T')[0]);
  const [notes, setNotes] = useState('');

  // UI state
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showConfirm, setShowConfirm] = useState(false);

  // Receipt state (task 15.5)
  const [receipt, setReceipt] = useState<Payment | null>(null);
  const [receiptWorkOrder, setReceiptWorkOrder] = useState<WorkOrderOption | null>(null);
  const [receiptBillInfo, setReceiptBillInfo] = useState<BillInfo | null>(null);
  const [receiptClient, setReceiptClient] = useState<ClientSearchResult | null>(null);

  // Fetch work orders when client is selected
  useEffect(() => {
    if (!selectedClient) {
      setWorkOrders([]);
      setWorkOrderId('');
      setBillInfo(null);
      return;
    }
    setLoadingWorkOrders(true);
    fetch(`/api/admin/work-orders?client_id=${selectedClient.id}`)
      .then((r) => r.json())
      .then((data: WorkOrder[]) => {
        const opts = (Array.isArray(data) ? data : []).map((wo) => ({
          id: wo.id,
          title: wo.title,
          client_id: wo.client_id,
        }));
        setWorkOrders(opts);
      })
      .catch(() => setWorkOrders([]))
      .finally(() => setLoadingWorkOrders(false));
  }, [selectedClient]);

  // Fetch bill info when work order changes
  useEffect(() => {
    if (!workOrderId) {
      setBillInfo(null);
      return;
    }
    fetch(`/api/admin/work-orders/${workOrderId}/bills`)
      .then((r) => r.json())
      .then((data) => {
        // bills endpoint may return array or single object
        const bill = Array.isArray(data) ? data[0] : data;
        if (bill && typeof bill.balance_remaining === 'number') {
          setBillInfo({ balance_remaining: bill.balance_remaining });
        } else {
          setBillInfo(null);
        }
      })
      .catch(() => setBillInfo(null));
  }, [workOrderId]);

  function handleClientSelect(client: ClientSearchResult) {
    setSelectedClient(client);
    setWorkOrderId('');
    setBillInfo(null);
    setError(null);
  }

  function validateAndSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);

    const parsedAmount = parseFloat(amount);
    if (isNaN(parsedAmount) || parsedAmount <= 0) {
      setError('Amount must be greater than zero');
      return;
    }

    // If we know the outstanding balance and amount exceeds it, confirm first
    if (billInfo !== null && parsedAmount > billInfo.balance_remaining) {
      setShowConfirm(true);
      return;
    }

    submitPayment();
  }

  async function submitPayment() {
    setShowConfirm(false);
    setLoading(true);
    setError(null);

    try {
      const res = await fetch('/api/admin/payments/manual', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          clientId: selectedClient?.id,
          workOrderId,
          amount: parseFloat(amount),
          payment_date: paymentDate || undefined,
          notes: notes || undefined,
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        setError(data.error ?? 'Failed to record payment');
      } else {
        const wo = workOrders.find((w) => w.id === workOrderId) ?? null;
        setReceipt(data as Payment);
        setReceiptWorkOrder(wo);
        setReceiptBillInfo(billInfo);
        setReceiptClient(selectedClient);
        // Reset form
        setSelectedClient(null);
        setWorkOrderId('');
        setWorkOrders([]);
        setAmount('');
        setPaymentDate(new Date().toISOString().split('T')[0]);
        setNotes('');
        setBillInfo(null);
        router.refresh();
      }
    } catch {
      setError('Unexpected error.');
    } finally {
      setLoading(false);
    }
  }

  function getClientDisplayName(client: ClientSearchResult) {
    const full = [client.first_name, client.last_name].filter(Boolean).join(' ');
    return full || client.username;
  }

  return (
    <div>
      {/* Receipt section (task 15.5) */}
      {receipt && (
        <div className="print-section bg-white text-black p-6 max-w-lg rounded-lg border border-gray-200 mb-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-bold">Payment Receipt</h2>
            <PrintButton />
          </div>
          <div className="space-y-2 text-sm">
            <div className="flex justify-between">
              <span className="font-medium">Receipt #</span>
              <span>{receipt.receipt_number ?? '—'}</span>
            </div>
            <div className="flex justify-between">
              <span className="font-medium">Amount</span>
              <span>${Number(receipt.amount).toFixed(2)}</span>
            </div>
            <div className="flex justify-between">
              <span className="font-medium">Payment Date</span>
              <span>{receipt.payment_date ?? receipt.created_at?.split('T')[0] ?? '—'}</span>
            </div>
            {receiptClient && (
              <div className="flex justify-between">
                <span className="font-medium">Client</span>
                <span>{getClientDisplayName(receiptClient)}</span>
              </div>
            )}
            {receiptWorkOrder && (
              <div className="flex justify-between">
                <span className="font-medium">Work Order</span>
                <span>{receiptWorkOrder.title}</span>
              </div>
            )}
            <div className="border-t border-gray-200 pt-2 mt-2">
              {receiptBillInfo !== null ? (
                receiptBillInfo.balance_remaining <= 0 ? (
                  <p className="text-center font-bold text-green-700 text-base">PAID IN FULL</p>
                ) : (
                  <p className="text-center text-gray-700">
                    Remaining balance: <strong>${receiptBillInfo.balance_remaining.toFixed(2)}</strong>
                  </p>
                )
              ) : (
                <p className="text-center text-gray-500 italic">Receipt</p>
              )}
            </div>
          </div>
          <div className="mt-4 no-print">
            <button
              type="button"
              onClick={() => setReceipt(null)}
              className="text-sm text-blue-600 hover:underline"
            >
              Record another payment
            </button>
          </div>
        </div>
      )}

      {!receipt && (
        <>
          {!open ? (
            <button
              onClick={() => setOpen(true)}
              className="px-4 py-2 text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 dark:bg-blue-500 dark:hover:bg-blue-600 rounded-md transition-colors"
            >
              + Record Manual Payment
            </button>
          ) : (
            <form
              onSubmit={validateAndSubmit}
              className="rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 p-6 flex flex-col gap-4 max-w-md"
            >
              <h2 className="text-base font-semibold text-gray-900 dark:text-white">Record Manual Payment</h2>

              {/* Client search */}
              <div className="flex flex-col gap-1">
                <label className="text-sm font-medium text-gray-700 dark:text-gray-300">
                  Client <span className="text-red-500">*</span>
                </label>
                {selectedClient ? (
                  <div className="flex items-center justify-between rounded-md border border-gray-300 dark:border-gray-600 bg-gray-50 dark:bg-gray-800 px-3 py-2 text-sm">
                    <span className="text-gray-900 dark:text-white">{getClientDisplayName(selectedClient)}</span>
                    <button
                      type="button"
                      onClick={() => { setSelectedClient(null); setWorkOrderId(''); setWorkOrders([]); }}
                      className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 text-xs ml-2"
                    >
                      ✕
                    </button>
                  </div>
                ) : (
                  <ClientSearchInput onSelect={handleClientSelect} placeholder="Search by name, phone, or ID…" />
                )}
              </div>

              {/* Work order dropdown */}
              <div className="flex flex-col gap-1">
                <label className="text-sm font-medium text-gray-700 dark:text-gray-300">
                  Work Order <span className="text-red-500">*</span>
                </label>
                <select
                  required
                  value={workOrderId}
                  onChange={(e) => setWorkOrderId(e.target.value)}
                  disabled={!selectedClient || loadingWorkOrders}
                  className="rounded-md border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 px-3 py-2 text-sm text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-50"
                >
                  <option value="">
                    {loadingWorkOrders ? 'Loading…' : 'Select a work order…'}
                  </option>
                  {workOrders.map((wo) => (
                    <option key={wo.id} value={wo.id}>{wo.title}</option>
                  ))}
                </select>
                {billInfo !== null && (
                  <p className="text-xs text-gray-500 dark:text-gray-400">
                    Outstanding balance: <strong>${billInfo.balance_remaining.toFixed(2)}</strong>
                  </p>
                )}
              </div>

              {/* Amount */}
              <div className="flex flex-col gap-1">
                <label className="text-sm font-medium text-gray-700 dark:text-gray-300">
                  Amount (USD) <span className="text-red-500">*</span>
                </label>
                <input
                  type="number"
                  required
                  min="0.01"
                  step="0.01"
                  value={amount}
                  onChange={(e) => setAmount(e.target.value)}
                  className="rounded-md border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 px-3 py-2 text-sm text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              {/* Payment date */}
              <div className="flex flex-col gap-1">
                <label className="text-sm font-medium text-gray-700 dark:text-gray-300">
                  Payment Date
                </label>
                <input
                  type="date"
                  value={paymentDate}
                  onChange={(e) => setPaymentDate(e.target.value)}
                  className="rounded-md border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 px-3 py-2 text-sm text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              {/* Notes */}
              <div className="flex flex-col gap-1">
                <label className="text-sm font-medium text-gray-700 dark:text-gray-300">
                  Notes <span className="text-gray-400 font-normal">(optional)</span>
                </label>
                <textarea
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  rows={3}
                  className="rounded-md border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 px-3 py-2 text-sm text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
                />
              </div>

              <FormError message={error} />

              <div className="flex gap-3">
                <button
                  type="submit"
                  disabled={loading}
                  className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 disabled:opacity-50 rounded-md transition-colors"
                >
                  {loading && <LoadingSpinner size="sm" />}
                  Record Payment
                </button>
                <button
                  type="button"
                  onClick={() => { setOpen(false); setError(null); }}
                  className="px-4 py-2 text-sm font-medium text-gray-700 dark:text-gray-300 bg-gray-100 dark:bg-gray-800 hover:bg-gray-200 dark:hover:bg-gray-700 rounded-md transition-colors"
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
        message={`The entered amount ($${parseFloat(amount || '0').toFixed(2)}) exceeds the outstanding balance${billInfo ? ` ($${billInfo.balance_remaining.toFixed(2)})` : ''}. Do you want to proceed?`}
        onConfirm={submitPayment}
        onCancel={() => setShowConfirm(false)}
      />
    </div>
  );
}
