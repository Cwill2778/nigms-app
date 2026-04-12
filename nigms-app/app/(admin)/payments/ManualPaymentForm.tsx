'use client';

import { useState, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import FormError from '@/components/FormError';
import LoadingSpinner from '@/components/LoadingSpinner';
import type { UserProfile, WorkOrder } from '@/lib/types';

interface ManualPaymentFormProps {
  clients: Pick<UserProfile, 'id' | 'username'>[];
  workOrders: Pick<WorkOrder, 'id' | 'title' | 'client_id'>[];
}

export default function ManualPaymentForm({ clients, workOrders }: ManualPaymentFormProps) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [clientId, setClientId] = useState('');
  const [workOrderId, setWorkOrderId] = useState('');
  const [amount, setAmount] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  const filteredWorkOrders = useMemo(
    () => workOrders.filter((wo) => !clientId || wo.client_id === clientId),
    [workOrders, clientId]
  );

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setSuccess(null);
    setLoading(true);

    try {
      const res = await fetch('/api/admin/payments/manual', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ clientId, workOrderId, amount: parseFloat(amount) }),
      });

      const data = await res.json();

      if (!res.ok) {
        setError(data.error ?? 'Failed to record payment');
      } else {
        setSuccess('Payment recorded successfully.');
        setClientId('');
        setWorkOrderId('');
        setAmount('');
        setOpen(false);
        router.refresh();
      }
    } catch {
      setError('Unexpected error.');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div>
      {!open ? (
        <button
          onClick={() => setOpen(true)}
          className="px-4 py-2 text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 dark:bg-blue-500 dark:hover:bg-blue-600 rounded-md transition-colors"
        >
          + Record Manual Payment
        </button>
      ) : (
        <form
          onSubmit={handleSubmit}
          className="rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 p-6 flex flex-col gap-4 max-w-md"
        >
          <h2 className="text-base font-semibold text-gray-900 dark:text-white">Record Manual Payment</h2>

          <div className="flex flex-col gap-1">
            <label className="text-sm font-medium text-gray-700 dark:text-gray-300">
              Client <span className="text-red-500">*</span>
            </label>
            <select
              required
              value={clientId}
              onChange={(e) => { setClientId(e.target.value); setWorkOrderId(''); }}
              className="rounded-md border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 px-3 py-2 text-sm text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="">Select a client…</option>
              {clients.map((c) => (
                <option key={c.id} value={c.id}>{c.username}</option>
              ))}
            </select>
          </div>

          <div className="flex flex-col gap-1">
            <label className="text-sm font-medium text-gray-700 dark:text-gray-300">
              Work Order <span className="text-red-500">*</span>
            </label>
            <select
              required
              value={workOrderId}
              onChange={(e) => setWorkOrderId(e.target.value)}
              disabled={!clientId}
              className="rounded-md border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 px-3 py-2 text-sm text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-50"
            >
              <option value="">Select a work order…</option>
              {filteredWorkOrders.map((wo) => (
                <option key={wo.id} value={wo.id}>{wo.title}</option>
              ))}
            </select>
          </div>

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

          <FormError message={error} />
          {success && <p className="text-sm text-green-600 dark:text-green-400">{success}</p>}

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
    </div>
  );
}
