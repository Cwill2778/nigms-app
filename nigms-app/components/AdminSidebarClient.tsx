"use client";

/**
 * AdminSidebarClient — client wrapper for the admin portal sidebar.
 *
 * Fetches notification badge counts for:
 *   - Unread messages (new_message notifications)
 *   - Pending work order actions (work_order_submitted notifications)
 *   - Emergency dispatch alerts (emergency_dispatch notifications) — shown on Dashboard badge
 *
 * Uses Supabase Realtime to update badge counts in real time.
 *
 * Requirements: 11.3
 */

import { useEffect, useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import { Settings, LogOut } from "lucide-react";
import IndustrialSidebar, { SidebarNavItem } from "./IndustrialSidebar";
import { createBrowserClient } from "@/lib/supabase-browser";

interface AdminSidebarClientProps {
  staticItems: SidebarNavItem[];
}

interface Notification {
  id: string;
  type: string;
  read_at: string | null;
}

export default function AdminSidebarClient({ staticItems }: AdminSidebarClientProps) {
  const router = useRouter();
  const [unreadMessages, setUnreadMessages] = useState(0);
  const [pendingWorkOrders, setPendingWorkOrders] = useState(0);
  const [emergencyAlerts, setEmergencyAlerts] = useState(0);

  const fetchBadgeCounts = useCallback(async () => {
    try {
      const res = await fetch('/api/notifications');
      if (!res.ok) return;
      const json = await res.json() as { notifications?: Notification[] };
      const notifications: Notification[] = json.notifications ?? [];

      const msgCount = notifications.filter((n) => n.type === 'new_message').length;
      const woCount = notifications.filter((n) => n.type === 'work_order_submitted').length;
      const emergencyCount = notifications.filter((n) => n.type === 'emergency_dispatch').length;

      setUnreadMessages(msgCount);
      setPendingWorkOrders(woCount);
      setEmergencyAlerts(emergencyCount);
    } catch {
      // Silently ignore — badge counts are non-critical
    }
  }, []);

  useEffect(() => {
    void fetchBadgeCounts();

    // Subscribe to real-time notification inserts for the current admin user
    const supabase = createBrowserClient();
    const channel = supabase
      .channel('admin-notifications')
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
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'notifications',
        },
        () => {
          // Re-fetch when a notification is marked as read
          void fetchBadgeCounts();
        }
      )
      .subscribe();

    return () => {
      void supabase.removeChannel(channel);
    };
  }, [fetchBadgeCounts]);

  // Build nav items with badge counts injected:
  //   - Dashboard: emergency_dispatch alerts + pending work orders
  //   - Work Orders: pending work order submissions
  //   - Messages (if present): unread messages
  const itemsWithBadges: SidebarNavItem[] = staticItems.map((item) => {
    if (item.href === '/admin-dashboard') {
      // Dashboard badge: emergency alerts + pending work orders
      const dashboardBadge = emergencyAlerts + pendingWorkOrders;
      return { ...item, badgeCount: (item.badgeCount ?? 0) + dashboardBadge };
    }
    if (item.href.includes('work-orders')) {
      return { ...item, badgeCount: (item.badgeCount ?? 0) + pendingWorkOrders };
    }
    if (item.label.toLowerCase().includes('message') || item.href.includes('message')) {
      return { ...item, badgeCount: (item.badgeCount ?? 0) + unreadMessages };
    }
    return item;
  });

  const allItems: SidebarNavItem[] = [
    ...itemsWithBadges,
    {
      href: "/settings",
      label: "Settings",
      icon: <Settings size={18} />,
    },
    {
      href: "/login",
      label: "Logout",
      icon: <LogOut size={18} />,
      onClick: async () => {
        await createBrowserClient().auth.signOut();
        router.push("/login");
      },
    },
  ];

  return <IndustrialSidebar items={allItems} />;
}
