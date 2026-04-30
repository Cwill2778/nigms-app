"use client";

/**
 * IndustrialSidebar — shared sidebar navigation for client and admin portals.
 *
 * Design:
 *   - Background: trust-navy (#1B263B)
 *   - Navigation items with icons and labels
 *   - Active state: precision-coral (#FF7F7F) left border
 *   - Optional logout button pinned to the bottom
 *   - Optional notification badge counts per nav item
 *
 * Requirements: 7.10, 7.11
 */

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import React from "react";
import { LogOut } from "lucide-react";

export interface SidebarNavItem {
  href: string;
  label: string;
  icon: React.ReactNode;
  onClick?: () => void;
  /** Optional notification badge count */
  badgeCount?: number;
}

interface IndustrialSidebarProps {
  items: SidebarNavItem[];
  /** When true, renders a logout button pinned to the bottom of the sidebar */
  showLogout?: boolean;
  /** Called when the logout button is clicked; defaults to POST /api/auth/logout + redirect /login */
  onLogout?: () => void | Promise<void>;
}

export default function IndustrialSidebar({
  items,
  showLogout = false,
  onLogout,
}: IndustrialSidebarProps) {
  const pathname = usePathname();
  const router = useRouter();

  async function handleLogout() {
    if (onLogout) {
      await onLogout();
      return;
    }
    // Default: POST /api/auth/logout then redirect to /login
    try {
      await fetch("/api/auth/logout", { method: "POST" });
    } finally {
      router.push("/login");
    }
  }

  return (
    <aside
      className="hidden md:flex flex-col w-56 sticky top-0 h-screen"
      style={{
        background: "#1B263B" /* trust-navy */,
        borderRight: "2px solid rgba(119,141,169,0.25)",
      }}
    >
      {/* Navigation items */}
      <nav className="flex flex-col flex-1 pt-2" aria-label="Sidebar navigation">
        {items.map((item) => {
          const isActive = pathname === item.href || pathname.startsWith(item.href + "/");
          const baseStyle: React.CSSProperties = isActive
            ? {
                color: "#FF7F7F" /* precision-coral */,
                background: "rgba(255, 127, 127, 0.12)",
                borderLeft: "3px solid #FF7F7F" /* precision-coral */,
              }
            : {
                color: "#D4DCEE",
                borderLeft: "3px solid transparent",
              };

          const content = (
            <>
              <span className="flex-shrink-0">{item.icon}</span>
              <span
                style={{
                  fontFamily: "var(--font-heading, Montserrat, sans-serif)",
                  fontSize: "0.7rem",
                  fontWeight: 700,
                  letterSpacing: "0.1em",
                  textTransform: "uppercase",
                  flex: 1,
                }}
              >
                {item.label}
              </span>
              {/* Notification badge */}
              {item.badgeCount != null && item.badgeCount > 0 && (
                <span
                  style={{
                    display: "inline-flex",
                    alignItems: "center",
                    justifyContent: "center",
                    minWidth: "1.25rem",
                    height: "1.25rem",
                    padding: "0 0.3rem",
                    borderRadius: "9999px",
                    background: "#FF7F7F" /* precision-coral */,
                    color: "#1B263B" /* trust-navy */,
                    fontSize: "0.65rem",
                    fontWeight: 800,
                    lineHeight: 1,
                  }}
                  aria-label={`${item.badgeCount} notifications`}
                >
                  {item.badgeCount > 99 ? "99+" : item.badgeCount}
                </span>
              )}
            </>
          );

          const sharedClassName =
            "flex items-center gap-3 px-4 py-3 w-full text-left transition-colors duration-150 hover:bg-[rgba(255,255,255,0.06)] hover:text-white";

          if (item.onClick) {
            return (
              <button
                key={item.href}
                type="button"
                onClick={item.onClick}
                className={sharedClassName}
                style={baseStyle}
              >
                {content}
              </button>
            );
          }

          return (
            <Link
              key={item.href}
              href={item.href}
              className={sharedClassName}
              style={baseStyle}
            >
              {content}
            </Link>
          );
        })}
      </nav>

      {/* Logout button — pinned to bottom */}
      {showLogout && (
        <div
          style={{
            borderTop: "1px solid rgba(119,141,169,0.2)",
            padding: "0.5rem 0",
          }}
        >
          <button
            type="button"
            onClick={() => void handleLogout()}
            className="flex items-center gap-3 px-4 py-3 w-full text-left transition-colors duration-150 hover:bg-[rgba(255,255,255,0.06)]"
            style={{
              color: "#778DA9" /* steel-gray */,
              borderLeft: "3px solid transparent",
            }}
            aria-label="Log out of your account"
          >
            <LogOut size={18} aria-hidden="true" />
            <span
              style={{
                fontFamily: "var(--font-heading, Montserrat, sans-serif)",
                fontSize: "0.7rem",
                fontWeight: 700,
                letterSpacing: "0.1em",
                textTransform: "uppercase",
              }}
            >
              Logout
            </span>
          </button>
        </div>
      )}
    </aside>
  );
}
