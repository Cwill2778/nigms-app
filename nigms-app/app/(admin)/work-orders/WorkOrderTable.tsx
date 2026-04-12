'use client';

import { useState } from 'react';
import Link from 'next/link';
import StatusBadge from '@/components/StatusBadge';
import type { WorkOrder, WorkOrderStatus } from '@/lib/types';

const ALL_STATUSES: WorkOrderStatus[] = ['pending', 'in_progress', 'completed', 'cancelled'];

interface WorkOrderTableProps {
  workOrders: WorkOrder[];
}

export default function WorkOrderTable({ workOrders }: WorkOrderTableProps) {
  const [statusFilter, setStatusFilter] = useState<WorkOrderStatus | 'all'>('all');
  const [clientFilter, setClientFilter] = useState('');

  const filtered = workOrders.filter((wo) => {
    const matchesStatus = statusFilter === 'all' || wo.status === statusFilter;
    const matchesClient = clientFilter === '' || wo.client_id.includes(clientFilter);
    return matchesStatus && matchesClient;
  });

  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-wrap gap-3">
        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value as WorkOrderStatus | 'all')}
          className="rounded-md border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 px-3 py-2 text-sm text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
        >
          <option value="all">All Statuses</option>
          {ALL_STATUSES.map((s) => (
            <option key={s} value={s}>
              {s.replace('_', ' ')}
            </option>
          ))}
        </select>

        <input
          type="text"
          placeholder="Filter by client ID…"
          value={clientFilter}
          onChange={(e) => setClientFilter(e.target.value)}
          className="rounded-md border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 px-3 py-2 text-sm text-gray-900 dark:text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
        />
      </div>

      <div className="rounded-lg border border-gray-200 dark:border-gray-700 overflow-hidden">
        <table className="w-full">
          <thead className="bg-gray-50 dark:bg-gray-800">
            <tr>
              {['Title', 'Client ID', 'Status', 'Quoted', 'Created', ''].map((h) => (
                <th
                  key={h}
                  className="py-3 px-4 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wide"
                >
                  {h}
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="bg-white dark:bg-gray-900 divide-y divide-gray-200 dark:divide-gray-700">
            {filtered.length === 0 ? (
              <tr>
                <td colSpan={6} className="py-8 text-center text-sm text-gray-500 dark:text-gray-400">
                  No work orders found.
                </td>
              </tr>
            ) : (
              filtered.map((wo) => (
                <tr key={wo.id}>
                  <td className="py-3 px-4 text-sm font-medium text-gray-900 dark:text-white">
                    {wo.title}
                  </td>
                  <td className="py-3 px-4 text-sm text-gray-500 dark:text-gray-400 font-mono text-xs">
                    {wo.client_id.slice(0, 8)}…
                  </td>
                  <td className="py-3 px-4">
                    <StatusBadge status={wo.status} />
                  </td>
                  <td className="py-3 px-4 text-sm text-gray-500 dark:text-gray-400">
                    {wo.quoted_amount != null
                      ? new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(wo.quoted_amount)
                      : '—'}
                  </td>
                  <td className="py-3 px-4 text-sm text-gray-500 dark:text-gray-400">
                    {new Intl.DateTimeFormat('en-US', {
                      year: 'numeric',
                      month: 'short',
                      day: 'numeric',
                    }).format(new Date(wo.created_at))}
                  </td>
                  <td className="py-3 px-4 text-right">
                    <Link
                      href={`/admin/work-orders/${wo.id}`}
                      className="text-sm font-medium text-blue-600 dark:text-blue-400 hover:underline"
                    >
                      View
                    </Link>
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
