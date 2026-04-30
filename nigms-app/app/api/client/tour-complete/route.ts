import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { createServerClient } from '@/lib/supabase';
import type { Database } from '@/lib/database.types';

// Use the Database generic to give TypeScript strict typings and eliminate errors
function getServiceRoleClient() {
  return createClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { autoRefreshToken: false, persistSession: false } }
  );
}

export async function POST(_request: NextRequest) {
  try {
    const supabase = await createServerClient();
    const { data: { session } } = await supabase.auth.getSession();

    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const db = getServiceRoleClient();

    // 1. Update the database record
    // Using onboarding_complete to match the signup schema and prevent TS errors
    const { error } = await db
      .from('onboarding_states')
      .update({ 
        onboarding_complete: true, 
        updated_at: new Date().toISOString() 
      })
      .eq('user_id', session.user.id);

    if (error) {
      console.error("Database update error:", error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    // 2. Update the user's JWT token so the Middleware knows they are done
    const { error: authError } = await supabase.auth.updateUser({
      data: { onboarding_complete: true }
    });

    if (authError) {
      console.error("Failed to update user metadata:", authError);
      return NextResponse.json({ error: authError.message }, { status: 500 });
    }

    return NextResponse.json({ success: true });
    
  } catch (err: any) {
    console.error("Unexpected error in tour-complete:", err);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}