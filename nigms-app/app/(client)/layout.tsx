import { redirect } from 'next/navigation';
import { createServerClient } from '@/lib/supabase';
import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';
import SteelFrameContainer from '@/components/SteelFrameContainer';
import ClientSidebarClient from '@/components/ClientSidebarClient';
import { SidebarNavItem } from '@/components/IndustrialSidebar';
import {
  LayoutDashboard,
  ClipboardList,
  MessageSquare,
  Building2,
  CreditCard,
} from 'lucide-react';

/**
 * Client layout — server component.
 *
 * Renders a sidebar on the left with navigation links to all dashboard
 * sections and a clearly labeled logout button always visible at the bottom.
 *
 * Requirements: 7.10, 7.11
 */
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

  if ((profile as { requires_password_reset: boolean } | null)?.requires_password_reset) {
    redirect('/update-password');
  }

  const clientNavItems: SidebarNavItem[] = [
    {
      href: '/dashboard',
      label: 'Dashboard',
      icon: <LayoutDashboard size={18} />,
    },
    {
      href: '/dashboard#work-orders',
      label: 'Work Orders',
      icon: <ClipboardList size={18} />,
    },
    {
      href: '/messages',
      label: 'Messages',
      icon: <MessageSquare size={18} />,
    },
    {
      href: '/dashboard#properties',
      label: 'Properties',
      icon: <Building2 size={18} />,
    },
    {
      href: '/dashboard#billing',
      label: 'Billing',
      icon: <CreditCard size={18} />,
    },
  ];

  return (
    <>
      <div className="md:hidden">
        <Navbar />
      </div>
      <SteelFrameContainer>
        <div className="flex flex-1">
          <ClientSidebarClient staticItems={clientNavItems} />
          <main className="flex-1">{children}</main>
        </div>
      </SteelFrameContainer>
      <div className="md:hidden">
        <Footer />
      </div>
    </>
  );
}
