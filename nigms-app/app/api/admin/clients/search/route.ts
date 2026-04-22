import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { createServerClient } from '@/lib/supabase';

function getServiceRoleClient() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { autoRefreshToken: false, persistSession: false } }
  );
}

async function verifyAdmin(): Promise<boolean> {
  const supabase = await createServerClient();
  const { data: { session } } = await supabase.auth.getSession();
  if (!session) return false;
  const { data: profile } = await supabase
    .from('users')
    .select('role')
    .eq('id', session.user.id)
    .single();
  return profile?.role === 'admin';
}

export async function GET(request: NextRequest) {
  const isAdmin = await verifyAdmin();
  if (!isAdmin) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }

  const { searchParams } = new URL(request.url);
  const q = searchParams.get('q') ?? '';

  if (q.length < 2) {
    return NextResponse.json([]);
  }

  const serviceClient = getServiceRoleClient();
  const pattern = `%${q}%`;

  // Search users table by name, phone, or id
  const { data: userMatches, error: userError } = await serviceClient
    .from('users')
    .select('id, first_name, last_name, username, phone, email')
    .eq('role', 'client')
    .or(
      `first_name.ilike.${pattern},last_name.ilike.${pattern},phone.ilike.${pattern},id::text.ilike.${pattern}`
    )
    .limit(10);

  if (userError) {
    return NextResponse.json({ error: userError.message }, { status: 500 });
  }

  // Search client_addresses for street matches, get client_ids
  const { data: addressMatches, error: addrError } = await serviceClient
    .from('client_addresses')
    .select('client_id')
    .ilike('street', pattern);

  if (addrError) {
    return NextResponse.json({ error: addrError.message }, { status: 500 });
  }

  const addressClientIds = (addressMatches ?? []).map((a: { client_id: string }) => a.client_id);

  // Fetch users from address matches not already in userMatches
  const existingIds = new Set((userMatches ?? []).map((u: { id: string }) => u.id));
  const newIds = addressClientIds.filter((id: string) => !existingIds.has(id));

  let addressUsers: typeof userMatches = [];
  if (newIds.length > 0) {
    const { data: addrUsers } = await serviceClient
      .from('users')
      .select('id, first_name, last_name, username, phone, email')
      .eq('role', 'client')
      .in('id', newIds);
    addressUsers = addrUsers ?? [];
  }

  // Merge and deduplicate, limit to 10
  const combined = [...(userMatches ?? []), ...addressUsers].slice(0, 10);

  return NextResponse.json(combined);
}
