import { redirect } from 'next/navigation';
import { createServerClient } from '@/lib/supabase';
import Navbar from '@/components/Navbar';
import SteelFrameContainer from '@/components/SteelFrameContainer';
import AdminSidebarClient from '@/components/AdminSidebarClient';
import { SidebarNavItem } from '@/components/IndustrialSidebar';
import { LayoutDashboard, Users, ClipboardList, CreditCard } from 'lucide-react';

export default async function AdminLayout({
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
    .select('role')
    .eq('id', session.user.id)
    .single();

  if ((profile as { role: string } | null)?.role !== 'admin') {
    return (
      <div className="flex flex-col min-h-screen items-center justify-center bg-gray-50 dark:bg-gray-950">
        <h1 className="text-4xl font-bold text-gray-900 dark:text-white">403</h1>
        <p className="mt-2 text-gray-600 dark:text-gray-400">Access Denied</p>
      </div>
    );
  }

  const adminNavItems: SidebarNavItem[] = [
    { href: '/admin-dashboard', label: 'Dashboard', icon: <LayoutDashboard size={18} /> },
    { href: '/clients', label: 'Clients', icon: <Users size={18} /> },
    { href: '/work-orders', label: 'Work Orders', icon: <ClipboardList size={18} /> },
    { href: '/payments', label: 'Payments', icon: <CreditCard size={18} /> },
  ];

  return (
    <>
      <div className="md:hidden"><Navbar /></div>
      <SteelFrameContainer>
        <div className="flex flex-1">
          <AdminSidebarClient staticItems={adminNavItems} />
          <main className="flex-1 pb-[60px] md:pb-0">{children}</main>
        </div>
      </SteelFrameContainer>
    </>
  );
}
