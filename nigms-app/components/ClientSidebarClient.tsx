"use client";

/**
 * ClientSidebarClient — client wrapper for the client portal sidebar.
 *
 * Fetches notification badge counts for:
 *   - Unread messages (new_message notifications)
 *   - Pending quote approvals (quote_generated notifications)
 *   - Unpaid invoices (invoice_generated notifications)
 *
 * Requirements: 7.10, 7.11, 11.4
 */

import { useEffect, useState, useCallback } from 'react';
import IndustrialSidebar, { SidebarNavItem } from './IndustrialSidebar';
import { createBrowserClient } from '@/lib/supabase-browser';

interface ClientSidebarClientProps {
  staticItems: SidebarNavItem[];
}

interface Notification {
  id: string;
  type: string;
  read_at: string | null;
}

export default function ClientSidebarClient({ staticItems }: ClientSidebarClientProps) {
  const [unreadMessages, setUnreadMessages] = useState(0);
  const [pendingQuotes, setPendingQuotes] = useState(0);
  const [unpaidInvoices, setUnpaidInvoices] = useState(0);

  const fetchBadgeCounts = useCallback(async () => {
    try {
      const res = await fetch('/api/notifications');
      if (!res.ok) return;
      const json = await res.json() as { notifications?: Notification[] };
      const notifications: Notification[] = json.notifications ?? [];

      setUnreadMessages(notifications.filter((n) => n.type === 'new_message').length);
      setPendingQuotes(notifications.filter((n) => n.type === 'quote_generated' || n.type === 'quote_ready').length);
      setUnpaidInvoices(notifications.filter((n) => n.type === 'invoice_generated' || n.type === 'invoice_ready').length);
    } catch {
      // Silently ignore — badge counts are non-critical
    }
  }, []);

  useEffect(() => {
    void fetchBadgeCounts();

    // Subscribe to real-time notification inserts
    const supabase = createBrowserClient();
    const channel = supabase
      .channel('client-notifications')
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'notifications',
        },
        () => {
          void fetchBadgeCounts();
        }
      )
      .subscribe();

    return () => {
      void supabase.removeChannel(channel);
    };
  }, [fetchBadgeCounts]);

  // Inject badge counts into the appropriate nav items
  const itemsWithBadges: SidebarNavItem[] = staticItems.map((item) => {
    const href = item.href.toLowerCase();
    const label = item.label.toLowerCase();

    if (label.includes('message') || href.includes('message')) {
      return { ...item, badgeCount: (item.badgeCount ?? 0) + unreadMessages };
    }
    if (label.includes('billing') || href.includes('billing') || label.includes('invoice')) {
      return { ...item, badgeCount: (item.badgeCount ?? 0) + unpaidInvoices + pendingQuotes };
    }
    if (label.includes('work order') || href.includes('work-order')) {
      return { ...item, badgeCount: (item.badgeCount ?? 0) + pendingQuotes };
    }
    return item;
  });

  return <IndustrialSidebar items={itemsWithBadges} showLogout />;
}
