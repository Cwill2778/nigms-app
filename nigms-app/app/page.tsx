import { redirect } from 'next/navigation';
import { createServerClient } from '@/lib/supabase';
import LandingPage from './(public)/page';

export default async function RootPage() {
  const supabase = await createServerClient();

  const {
    data: { session },
  } = await supabase.auth.getSession();

  if (!session) {
    return <LandingPage />;
  }

  const { data: profile } = await supabase
    .from('users')
    .select('role, requires_password_reset')
    .eq('id', session.user.id)
    .single();

  if (profile?.role === 'admin') {
    redirect('/admin/admin-dashboard');
  }

  if (profile?.requires_password_reset) {
    redirect('/update-password');
  }

  redirect('/dashboard');
}
