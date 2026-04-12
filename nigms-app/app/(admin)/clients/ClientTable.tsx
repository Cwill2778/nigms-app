'use client';

import { useState } from 'react';
import Link from 'next/link';
import StatusBadge from '@/components/StatusBadge';
import type { UserProfile } from '@/lib/types';

interface ClientTableProps {
  clients: UserProfile[];
}

export default function ClientTable({ clients }: ClientTableProps) {
  const [search, setSearch] = useState('');

  const filtered = clients.filter((c) =>
    c.username.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="flex flex-col gap-4">
      <input
        type="text"
        placeholder="Search by username…"
        value={search}
        onChange={(e) => setSearch(e.target.value)}
        className="w-full max-w-sm rounded-md border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 px-3 py-2 text-sm text-gray-900 dark:text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
      />

      <div className="rounded-lg border border-gray-200 dark:border-gray-700 overflow-hidden">
        <table className="w-full">
          <thead className="bg-gray-50 dark:bg-gray-800">
            <tr>
              {['Username', 'Role', 'Active', 'Created', ''].map((h) => (
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
                <td colSpan={5} className="py-8 text-center text-sm text-gray-500 dark:text-gray-400">
                  No clients found.
                </td>
              </tr>
            ) : (
              filtered.map((client) => (
                <tr key={client.id}>
                  <td className="py-3 px-4 text-sm font-medium text-gray-900 dark:text-white">
                    {client.username}
                  </td>
                  <td className="py-3 px-4 text-sm text-gray-500 dark:text-gray-400 capitalize">
                    {client.role}
                  </td>
                  <td className="py-3 px-4">
                    <StatusBadge status={client.is_active ? 'paid' : 'cancelled'} />
                  </td>
                  <td className="py-3 px-4 text-sm text-gray-500 dark:text-gray-400">
                    {new Intl.DateTimeFormat('en-US', {
                      year: 'numeric',
                      month: 'short',
                      day: 'numeric',
                    }).format(new Date(client.created_at))}
                  </td>
                  <td className="py-3 px-4 text-right">
                    <Link
                      href={`/admin/clients/${client.id}`}
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
