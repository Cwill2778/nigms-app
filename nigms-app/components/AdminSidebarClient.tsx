"use client";

import { useRouter } from "next/navigation";
import { Settings, LogOut } from "lucide-react";
import IndustrialSidebar, { SidebarNavItem } from "./IndustrialSidebar";
import { createBrowserClient } from "@/lib/supabase-browser";

interface AdminSidebarClientProps {
  staticItems: SidebarNavItem[];
}

export default function AdminSidebarClient({ staticItems }: AdminSidebarClientProps) {
  const router = useRouter();

  const allItems: SidebarNavItem[] = [
    ...staticItems,
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
