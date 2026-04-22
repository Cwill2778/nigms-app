import { createClient } from '@supabase/supabase-js';
import type { UserProfile } from '@/lib/types';
import ClientsPageClient from './ClientsPageClient';

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
  return <ClientsPageClient clients={clients} />;
}
