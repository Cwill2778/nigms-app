import { createClient } from '@supabase/supabase-js';
import PaymentTable from './PaymentTable';
import ManualPaymentForm from './ManualPaymentForm';
import type { Payment } from '@/lib/types';

function getServiceRoleClient() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { autoRefreshToken: false, persistSession: false } }
  );
}

async function getData() {
  const supabase = getServiceRoleClient();
  const { data: payments } = await supabase
    .from('payments').select('*').order('created_at', { ascending: false });
  return { payments: (payments ?? []) as Payment[] };
}

export default async function AdminPaymentsPage() {
  const { payments } = await getData();

  return (
    <div
      className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 flex flex-col gap-8"
      style={{ color: "var(--color-text-primary)" }}
    >
      <h1>Payments</h1>
      <ManualPaymentForm />
      <PaymentTable payments={payments} />
    </div>
  );
}
