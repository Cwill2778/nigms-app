import { redirect } from 'next/navigation';
import Link from 'next/link';
import { createServerClient } from '@/lib/supabase';
import DashboardSummary from '@/components/DashboardSummary';
import WorkOrderCard from '@/components/WorkOrderCard';
import PayBalanceButton from '@/components/PayBalanceButton';
import PaymentRow from '@/components/PaymentRow';
import type { WorkOrder, Payment } from '@/lib/types';

export default async function DashboardPage() {
  const supabase = await createServerClient();

  const {
    data: { session },
  } = await supabase.auth.getSession();

  if (!session) {
    redirect('/login');
  }

  const [{ data: workOrders }, { data: payments }] = await Promise.all([
    supabase
      .from('work_orders')
      .select('*')
      .order('created_at', { ascending: false }),
    supabase
      .from('payments')
      .select('*')
      .order('created_at', { ascending: false }),
  ]);

  const safeWorkOrders: WorkOrder[] = workOrders ?? [];
  const safePayments: Payment[] = payments ?? [];

  // Work orders with an outstanding balance (quoted > paid for that order)
  const paidByWorkOrder = safePayments
    .filter((p) => p.status === 'paid')
    .reduce<Record<string, number>>((acc, p) => {
      acc[p.work_order_id] = (acc[p.work_order_id] ?? 0) + p.amount;
      return acc;
    }, {});

  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-10 flex flex-col gap-8">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-semibold text-gray-900 dark:text-white">
          Dashboard
        </h1>
        <Link
          href="/work-orders/new"
          className="text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 px-4 py-2 rounded-md transition-colors"
        >
          + New Work Order
        </Link>
      </div>

      <DashboardSummary workOrders={safeWorkOrders} payments={safePayments} />

      {/* Work Orders */}
      <section>
        <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
          Work Orders
        </h2>
        {safeWorkOrders.length === 0 ? (
          <p className="text-sm text-gray-500 dark:text-gray-400">
            No work orders yet.
          </p>
        ) : (
          <div className="flex flex-col gap-3">
            {safeWorkOrders.map((wo) => {
              const paid = paidByWorkOrder[wo.id] ?? 0;
              const outstanding = Math.max(0, (wo.quoted_amount ?? 0) - paid);
              return (
                <div key={wo.id} className="flex flex-col gap-2">
                  <WorkOrderCard workOrder={wo} />
                  {outstanding > 0 && (
                    <div className="pl-1">
                      <PayBalanceButton
                        workOrderId={wo.id}
                        amount={outstanding}
                      />
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </section>

      {/* Payments */}
      <section>
        <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
          Payment History
        </h2>
        {safePayments.length === 0 ? (
          <p className="text-sm text-gray-500 dark:text-gray-400">
            No payments yet.
          </p>
        ) : (
          <div className="rounded-lg border border-gray-200 dark:border-gray-700 overflow-hidden">
            <table className="w-full">
              <thead className="bg-gray-50 dark:bg-gray-800">
                <tr>
                  <th className="py-3 px-4 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wide">
                    Amount
                  </th>
                  <th className="py-3 px-4 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wide">
                    Date
                  </th>
                  <th className="py-3 px-4 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wide">
                    Status
                  </th>
                  <th className="py-3 px-4 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wide">
                    Method
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white dark:bg-gray-900">
                {safePayments.map((payment) => (
                  <PaymentRow key={payment.id} payment={payment} />
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>
    </div>
  );
}
