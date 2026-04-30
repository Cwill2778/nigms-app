import { notFound } from 'next/navigation';
import { createClient } from '@supabase/supabase-js';
import type { WorkOrder } from '@/lib/types';
import WorkOrderDetailPanel from '@/components/WorkOrderDetailPanel';

function getServiceRoleClient() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { autoRefreshToken: false, persistSession: false } }
  );
}

async function getWorkOrder(id: string): Promise<WorkOrder | null> {
  const supabase = getServiceRoleClient();
  const { data, error } = await supabase
    .from('work_orders')
    .select('*')
    .eq('id', id)
    .single();

  if (error || !data) return null;
  return data as WorkOrder;
}

export default async function AdminWorkOrderDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const workOrder = await getWorkOrder(id);

  if (!workOrder) notFound();

  return (
    <div className="h-full flex flex-col" style={{ minHeight: 'calc(100vh - 4rem)' }}>
      <WorkOrderDetailPanel workOrderId={id} onClose={() => {}} />
    </div>
  );
}
