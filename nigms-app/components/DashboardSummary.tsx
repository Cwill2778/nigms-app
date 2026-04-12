import type { WorkOrder, Payment } from '@/lib/types';

interface DashboardSummaryProps {
  workOrders: WorkOrder[];
  payments: Payment[];
}

export default function DashboardSummary({
  workOrders,
  payments,
}: DashboardSummaryProps) {
  const totalWorkOrders = workOrders.length;
  const activeWorkOrders = workOrders.filter(
    (wo) => wo.status === 'in_progress'
  ).length;

  const totalPaid = payments
    .filter((p) => p.status === 'paid')
    .reduce((sum, p) => sum + p.amount, 0);

  const totalQuoted = workOrders.reduce(
    (sum, wo) => sum + (wo.quoted_amount ?? 0),
    0
  );
  const outstandingBalance = Math.max(0, totalQuoted - totalPaid);

  const fmt = (n: number) =>
    new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(n);

  const stats = [
    { label: 'Total Work Orders', value: String(totalWorkOrders) },
    { label: 'Active (In Progress)', value: String(activeWorkOrders) },
    { label: 'Total Paid', value: fmt(totalPaid) },
    { label: 'Outstanding Balance', value: fmt(outstandingBalance) },
  ];

  return (
    <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
      {stats.map((stat) => (
        <div
          key={stat.label}
          className="rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 p-4 shadow-sm"
        >
          <p className="text-xs text-gray-500 dark:text-gray-400 mb-1">
            {stat.label}
          </p>
          <p className="text-xl font-semibold text-gray-900 dark:text-white">
            {stat.value}
          </p>
        </div>
      ))}
    </div>
  );
}
