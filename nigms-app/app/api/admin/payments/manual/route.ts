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
  return (profile as { role: string } | null)?.role === 'admin';
}

export async function POST(request: NextRequest) {
  const isAdmin = await verifyAdmin();
  if (!isAdmin) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }

  const body = await request.json();
  const { clientId, workOrderId, amount, payment_date, notes } = body as {
    clientId?: string;
    workOrderId?: string;
    amount?: number;
    payment_date?: string;
    notes?: string;
  };

  if (!clientId || !workOrderId || amount === undefined || amount === null) {
    return NextResponse.json(
      { error: 'clientId, workOrderId, and amount are required' },
      { status: 400 }
    );
  }

  if (amount <= 0) {
    return NextResponse.json(
      { error: 'Amount must be greater than zero' },
      { status: 422 }
    );
  }

  const serviceClient = getServiceRoleClient();

  // Generate receipt number via RPC to prevent race conditions
  const year = new Date().getFullYear();
  const { data: receiptNumberData, error: rctNumError } = await serviceClient.rpc('generate_receipt_number', {
    year_param: year,
  });

  if (rctNumError || !receiptNumberData) {
    return NextResponse.json(
      { error: rctNumError?.message ?? 'Failed to generate receipt number' },
      { status: 500 }
    );
  }

  const receipt_number = receiptNumberData as string;

  // Insert payment record
  const { data: payment, error: insertError } = await serviceClient
    .from('payments')
    .insert({
      work_order_id: workOrderId,
      client_id: clientId,
      amount,
      method: 'manual',
      status: 'paid',
      receipt_number,
      payment_date: payment_date ?? null,
      notes: notes ?? null,
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
