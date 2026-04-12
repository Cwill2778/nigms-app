import { notFound } from 'next/navigation';
import { createClient } from '@supabase/supabase-js';
import type { WorkOrder } from '@/lib/types';
import StatusBadge from '@/components/StatusBadge';
import StatusUpdateForm from './StatusUpdateForm';

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
    <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-10 flex flex-col gap-8">
      <h1 className="text-2xl font-semibold text-gray-900 dark:text-white">Work Order Detail</h1>

      <div className="rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 p-6 flex flex-col gap-4">
        <Row label="Title" value={workOrder.title} />
        <Row label="Client ID" value={workOrder.client_id} />
        {workOrder.description && <Row label="Description" value={workOrder.description} />}
        <div className="flex flex-col sm:flex-row sm:items-center gap-1 sm:gap-4">
          <span className="text-sm font-medium text-gray-500 dark:text-gray-400 sm:w-48 shrink-0">Status</span>
          <StatusBadge status={workOrder.status} />
        </div>
        <Row
          label="Quoted Amount"
          value={
            workOrder.quoted_amount != null
              ? new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(workOrder.quoted_amount)
              : '—'
          }
        />
        <Row
          label="Created"
          value={new Intl.DateTimeFormat('en-US', {
            year: 'numeric',
            month: 'long',
            day: 'numeric',
          }).format(new Date(workOrder.created_at))}
        />
      </div>

      <StatusUpdateForm workOrderId={id} currentStatus={workOrder.status} />
    </div>
  );
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex flex-col sm:flex-row sm:items-center gap-1 sm:gap-4">
      <span className="text-sm font-medium text-gray-500 dark:text-gray-400 sm:w-48 shrink-0">
        {label}
      </span>
      <span className="text-sm text-gray-900 dark:text-white">{value}</span>
    </div>
  );
}
