import { redirect } from 'next/navigation';
import { createServerClient } from '@/lib/supabase';
import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';
import SteelFrameContainer from '@/components/SteelFrameContainer';
import IndustrialSidebar, { SidebarNavItem } from '@/components/IndustrialSidebar';
import { LayoutDashboard, PlusSquare } from 'lucide-react';

export default async function ClientLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const supabase = await createServerClient();

  const {
    data: { session },
  } = await supabase.auth.getSession();

  if (!session) {
    redirect('/login');
  }

  const { data: profile } = await supabase
    .from('users')
    .select('requires_password_reset')
    .eq('id', session.user.id)
    .single();

  if (profile?.requires_password_reset) {
    redirect('/update-password');
  }

  const clientNavItems: SidebarNavItem[] = [
    { href: '/dashboard', label: 'Dashboard', icon: <LayoutDashboard size={18} /> },
    { href: '/work-orders/new', label: 'New Order', icon: <PlusSquare size={18} /> },
  ];

  return (
    <>
      <div className="md:hidden"><Navbar /></div>
      <SteelFrameContainer>
        <div className="flex flex-1">
          <IndustrialSidebar items={clientNavItems} />
          <main className="flex-1">{children}</main>
        </div>
      </SteelFrameContainer>
      <div className="md:hidden"><Footer /></div>
    </>
  );
}
