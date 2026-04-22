import { createClient } from '@supabase/supabase-js';
import WorkOrdersPageClient from './WorkOrdersPageClient';
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
  return <WorkOrdersPageClient workOrders={workOrders} />;
}
