import { createClient } from '@supabase/supabase-js';
import ClientTable from './ClientTable';
import AddClientForm from './AddClientForm';
import type { UserProfile } from '@/lib/types';

async function getAllClients(): Promise<UserProfile[]> {
  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { autoRefreshToken: false, persistSession: false } }
  );

  const { data, error } = await supabase
    .from('users')
    .select('*')
    .order('created_at', { ascending: false });

  if (error) {
    console.error('[admin/clients] fetch error', error);
    return [];
  }

  return (data ?? []) as UserProfile[];
}

export default async function AdminClientsPage() {
  const clients = await getAllClients();

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 flex flex-col gap-8">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-semibold text-gray-900 dark:text-white">Clients</h1>
      </div>

      <AddClientForm />
      <ClientTable clients={clients} />
    </div>
  );
}
