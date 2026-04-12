import { createClient } from '@supabase/supabase-js';
import PaymentTable from './PaymentTable';
import ManualPaymentForm from './ManualPaymentForm';
import type { Payment, UserProfile, WorkOrder } from '@/lib/types';

function getServiceRoleClient() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { autoRefreshToken: false, persistSession: false } }
  );
}

async function getData() {
  const supabase = getServiceRoleClient();

  const [{ data: payments }, { data: clients }, { data: workOrders }] = await Promise.all([
    supabase.from('payments').select('*').order('created_at', { ascending: false }),
    supabase.from('users').select('id, username').eq('role', 'client').order('username'),
    supabase.from('work_orders').select('id, title, client_id').order('created_at', { ascending: false }),
  ]);

  return {
    payments: (payments ?? []) as Payment[],
    clients: (clients ?? []) as Pick<UserProfile, 'id' | 'username'>[],
    workOrders: (workOrders ?? []) as Pick<WorkOrder, 'id' | 'title' | 'client_id'>[],
  };
}

export default async function AdminPaymentsPage() {
  const { payments, clients, workOrders } = await getData();

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 flex flex-col gap-8">
      <h1 className="text-2xl font-semibold text-gray-900 dark:text-white">Payments</h1>
      <ManualPaymentForm clients={clients} workOrders={workOrders} />
      <PaymentTable payments={payments} />
    </div>
  );
}
