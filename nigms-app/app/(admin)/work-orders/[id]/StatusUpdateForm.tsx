'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import FormError from '@/components/FormError';
import LoadingSpinner from '@/components/LoadingSpinner';
import type { WorkOrderStatus } from '@/lib/types';

const STATUSES: WorkOrderStatus[] = ['pending', 'in_progress', 'completed', 'cancelled'];

interface StatusUpdateFormProps {
  workOrderId: string;
  currentStatus: WorkOrderStatus;
}

export default function StatusUpdateForm({ workOrderId, currentStatus }: StatusUpdateFormProps) {
  const router = useRouter();
  const [status, setStatus] = useState<WorkOrderStatus>(currentStatus);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setSuccess(null);
    setLoading(true);

    try {
      const res = await fetch(`/api/admin/work-orders/${workOrderId}/status`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status }),
      });

      const data = await res.json();

      if (!res.ok) {
        setError(data.error ?? 'Failed to update status');
      } else {
        setSuccess('Status updated successfully.');
        router.refresh();
      }
    } catch {
      setError('Unexpected error.');
    } finally {
      setLoading(false);
    }
  }

  return (
    <form
      onSubmit={handleSubmit}
      className="rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 p-6 flex flex-col gap-4"
    >
      <h2 className="text-base font-semibold text-gray-900 dark:text-white">Update Status</h2>

      <div className="flex flex-col gap-1">
        <label className="text-sm font-medium text-gray-700 dark:text-gray-300">New Status</label>
        <select
          value={status}
          onChange={(e) => setStatus(e.target.value as WorkOrderStatus)}
          className="rounded-md border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 px-3 py-2 text-sm text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
        >
          {STATUSES.map((s) => (
            <option key={s} value={s}>
              {s.replace('_', ' ')}
            </option>
          ))}
        </select>
      </div>

      <FormError message={error} />
      {success && <p className="text-sm text-green-600 dark:text-green-400">{success}</p>}

      <button
        type="submit"
        disabled={loading || status === currentStatus}
        className="flex items-center gap-2 w-fit px-4 py-2 text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 disabled:opacity-50 rounded-md transition-colors"
      >
        {loading && <LoadingSpinner size="sm" />}
        Save Status
      </button>
    </form>
  );
}
