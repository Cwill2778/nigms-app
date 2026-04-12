import { createClient } from '@supabase/supabase-js';
import WorkOrderTable from './WorkOrderTable';
import type { WorkOrder } from '@/lib/types';

async function getAllWorkOrders(): Promise<WorkOrder[]> {
  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { autoRefreshToken: false, persistSession: false } }
  );

  const { data, error } = await supabase
    .from('work_orders')
    .select('*')
    .order('created_at', { ascending: false });

  if (error) {
    console.error('[admin/work-orders] fetch error', error);
    return [];
  }

  return (data ?? []) as WorkOrder[];
}

export default async function AdminWorkOrdersPage() {
  const workOrders = await getAllWorkOrders();

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 flex flex-col gap-8">
      <h1 className="text-2xl font-semibold text-gray-900 dark:text-white">Work Orders</h1>
      <WorkOrderTable workOrders={workOrders} />
    </div>
  );
}
