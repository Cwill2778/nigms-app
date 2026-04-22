"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import React from "react";

export interface SidebarNavItem {
  href: string;
  label: string;
  icon: React.ReactNode;
  onClick?: () => void;
}

interface IndustrialSidebarProps {
  items: SidebarNavItem[];
}

export default function IndustrialSidebar({ items }: IndustrialSidebarProps) {
  const pathname = usePathname();

  return (
    <aside className="hidden md:flex flex-col w-56 sticky top-0 h-screen bg-[#0a1f44] border-r-2 border-[#4A4A4A]">
      {items.map((item) => {
        const isActive = pathname === item.href;
        const className =
          `flex items-center gap-3 px-4 py-3 w-full text-left ` +
          (isActive
            ? "bg-[#162d5e] text-orange-400 border-l-4 border-orange-500"
            : "text-gray-200 hover:text-orange-400");
        const content = (
          <>
            {item.icon}
            <span className="uppercase tracking-widest text-xs font-semibold">
              {item.label}
            </span>
          </>
        );

        if (item.onClick) {
          return (
            <button
              key={item.href}
              type="button"
              onClick={item.onClick}
              className={className}
            >
              {content}
            </button>
          );
        }

        return (
          <Link
            key={item.href}
            href={item.href}
            className={className}
          >
            {content}
          </Link>
        );
      })}
    </aside>
  );
}
