import { createClient } from '@supabase/supabase-js';
import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';
import type { UserProfile, WorkOrder, Payment } from '@/lib/types';
import PaymentRow from '@/components/PaymentRow';
import DashboardSummaryCards from '@/components/DashboardSummaryCards';

function getServiceRoleClient() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { autoRefreshToken: false, persistSession: false } }
  );
}

async function getDashboardData() {
  const supabase = getServiceRoleClient();

  const [
    { data: clients },
    { data: workOrders },
    { data: payments },
  ] = await Promise.all([
    supabase.from('users').select('id').eq('role', 'client'),
    supabase.from('work_orders').select('id, status'),
    supabase
      .from('payments')
      .select('*')
      .order('created_at', { ascending: false }),
  ]);

  // Fetch unread message count — gracefully handle missing table
  let unreadMessages = 0;
  try {
    const { count, error } = await supabase
      .from('messages')
      .select('id', { count: 'exact', head: true })
      .eq('sender_role', 'client')
      .is('read_at', null);
    if (!error && count !== null) {
      unreadMessages = count;
    }
  } catch {
    // messages table may not exist yet
    unreadMessages = 0;
  }

  const safeClients = (clients ?? []) as Pick<UserProfile, 'id'>[];
  const safeWorkOrders = (workOrders ?? []) as Pick<WorkOrder, 'id' | 'status'>[];
  const safePayments = (payments ?? []) as Payment[];

  const totalClients = safeClients.length;
  const openWorkOrders = safeWorkOrders.filter(
    (wo) => wo.status === 'pending' || wo.status === 'in_progress'
  ).length;
  const totalRevenue = safePayments
    .filter((p) => p.status === 'paid')
    .reduce((sum, p) => sum + p.amount, 0);
  const recentPayments = safePayments.slice(0, 5);

  return { totalClients, openWorkOrders, totalRevenue, recentPayments, unreadMessages };
}

async function getAdminUserId(): Promise<string> {
  try {
    const cookieStore = await cookies();
    const supabase = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      {
        cookies: {
          getAll() {
            return cookieStore.getAll();
          },
        },
      }
    );
    const { data: { session } } = await supabase.auth.getSession();
    return session?.user?.id ?? '';
  } catch {
    return '';
  }
}

export default async function AdminDashboardPage() {
  const [
    { totalClients, openWorkOrders, totalRevenue, recentPayments, unreadMessages },
    adminUserId,
  ] = await Promise.all([getDashboardData(), getAdminUserId()]);

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 flex flex-col gap-8">
      <h1 className="text-2xl font-semibold text-gray-900 dark:text-white">Dashboard</h1>

      {/* Summary Cards */}
      <DashboardSummaryCards
        totalClients={totalClients}
        openWorkOrders={openWorkOrders}
        totalRevenue={totalRevenue}
        unreadMessages={unreadMessages}
        adminUserId={adminUserId}
      />

      {/* Recent Payments */}
      <section>
        <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
          Recent Payments
        </h2>
        {recentPayments.length === 0 ? (
          <p className="text-sm text-gray-500 dark:text-gray-400">No payments yet.</p>
        ) : (
          <div className="rounded-lg border border-gray-200 dark:border-gray-700 overflow-hidden">
            <table className="w-full">
              <thead className="bg-gray-50 dark:bg-gray-800">
                <tr>
                  {['Amount', 'Date', 'Status', 'Method'].map((h) => (
                    <th
                      key={h}
                      className="py-3 px-4 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wide"
                    >
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="bg-white dark:bg-gray-900">
                {recentPayments.map((payment) => (
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
