import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { createServerClient } from '@/lib/supabase';
import { sendPaymentConfirmationEmail } from '@/lib/email';

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

export async function POST(request: NextRequest) {
  const isAdmin = await verifyAdmin();
  if (!isAdmin) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }

  const body = await request.json();
  const { clientId, workOrderId, amount } = body as {
    clientId?: string;
    workOrderId?: string;
    amount?: number;
  };

  if (!clientId || !workOrderId || !amount || amount <= 0) {
    return NextResponse.json(
      { error: 'clientId, workOrderId, and a positive amount are required' },
      { status: 400 }
    );
  }

  const serviceClient = getServiceRoleClient();

  // Insert payment record
  const { data: payment, error: insertError } = await serviceClient
    .from('payments')
    .insert({
      work_order_id: workOrderId,
      client_id: clientId,
      amount,
      method: 'manual',
      status: 'paid',
    })
    .select()
    .single();

  if (insertError || !payment) {
    return NextResponse.json(
      { error: insertError?.message ?? 'Failed to create payment' },
      { status: 500 }
    );
  }

  // Fetch client email for notification
  const { data: authData } = await serviceClient.auth.admin.getUserById(clientId);
  const clientEmail = authData?.user?.email;

  if (clientEmail) {
    await sendPaymentConfirmationEmail(
      { email: clientEmail },
      { amount, method: 'manual' }
    );
  }

  return NextResponse.json(payment, { status: 201 });
}
