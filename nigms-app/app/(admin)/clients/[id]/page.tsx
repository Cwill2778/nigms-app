import { notFound } from 'next/navigation';
import { createClient } from '@supabase/supabase-js';
import type { UserProfile } from '@/lib/types';
import ClientActions from './ClientActions';

function getServiceRoleClient() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { autoRefreshToken: false, persistSession: false } }
  );
}

async function getClient(id: string): Promise<UserProfile | null> {
  const supabase = getServiceRoleClient();
  const { data, error } = await supabase
    .from('users')
    .select('*')
    .eq('id', id)
    .single();

  if (error || !data) return null;
  return data as UserProfile;
}

async function getAuthEmail(id: string): Promise<string | null> {
  const supabase = getServiceRoleClient();
  const { data, error } = await supabase.auth.admin.getUserById(id);
  if (error || !data?.user) return null;
  return data.user.email ?? null;
}

export default async function ClientDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const [client, email] = await Promise.all([getClient(id), getAuthEmail(id)]);

  if (!client) notFound();

  return (
    <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-10 flex flex-col gap-8">
      <h1 className="text-2xl font-semibold text-gray-900 dark:text-white">Client Detail</h1>

      <div className="rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 p-6 flex flex-col gap-4">
        <Row label="Username" value={client.username} />
        <Row label="Email" value={email ?? '—'} />
        <Row label="Role" value={client.role} />
        <Row label="Active" value={client.is_active ? 'Yes' : 'No'} />
        <Row label="Requires Password Reset" value={client.requires_password_reset ? 'Yes' : 'No'} />
        <Row
          label="Created"
          value={new Intl.DateTimeFormat('en-US', {
            year: 'numeric',
            month: 'long',
            day: 'numeric',
          }).format(new Date(client.created_at))}
        />
      </div>

      <ClientActions clientId={id} isActive={client.is_active} />
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
