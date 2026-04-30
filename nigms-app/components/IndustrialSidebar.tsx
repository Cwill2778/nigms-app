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
 * Mobile: renders a fixed bottom tab bar instead of the sidebar.
 * Desktop (md+): renders the full left sidebar.
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

/** Badge pill used in both sidebar and bottom tab bar */
function BadgePill({ count }: { count: number }) {
  return (
    <span
      aria-label={`${count} notifications`}
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
    >
      {count > 99 ? "99+" : count}
    </span>
  );
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
    try {
      await fetch("/api/auth/logout", { method: "POST" });
    } finally {
      router.push("/login");
    }
  }

  // Items shown in the bottom tab bar — exclude logout-only items (no real href destination)
  // Show up to 5 primary nav items (not the logout/settings items that have onClick)
  const primaryItems = items.filter((item) => !item.onClick);
  const tabItems = primaryItems.slice(0, 5);

  return (
    <>
      {/* ── Desktop sidebar (md+) ─────────────────────────────────── */}
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
                  color: "#FF7F7F",
                  background: "rgba(255, 127, 127, 0.12)",
                  borderLeft: "3px solid #FF7F7F",
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
                {item.badgeCount != null && item.badgeCount > 0 && (
                  <BadgePill count={item.badgeCount} />
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
          <div style={{ borderTop: "1px solid rgba(119,141,169,0.2)", padding: "0.5rem 0" }}>
            <button
              type="button"
              onClick={() => void handleLogout()}
              className="flex items-center gap-3 px-4 py-3 w-full text-left transition-colors duration-150 hover:bg-[rgba(255,255,255,0.06)]"
              style={{ color: "#778DA9", borderLeft: "3px solid transparent" }}
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

      {/* ── Mobile bottom tab bar (< md) ─────────────────────────── */}
      <nav
        className="md:hidden fixed bottom-0 inset-x-0 z-50 flex items-stretch"
        aria-label="Mobile navigation"
        style={{
          background: "#1B263B",
          borderTop: "2px solid rgba(46,74,138,0.8)",
          height: "60px",
        }}
      >
        {tabItems.map((item) => {
          const isActive = pathname === item.href || pathname.startsWith(item.href + "/");

          if (item.onClick) {
            return (
              <button
                key={item.href}
                type="button"
                onClick={item.onClick}
                className="flex flex-col items-center justify-center flex-1 gap-0.5 relative transition-colors"
                style={{ color: isActive ? "#FF7F7F" : "#778DA9" }}
                aria-label={item.label}
              >
                <span className="relative">
                  {item.icon}
                  {item.badgeCount != null && item.badgeCount > 0 && (
                    <span
                      style={{
                        position: "absolute",
                        top: "-4px",
                        right: "-6px",
                        display: "inline-flex",
                        alignItems: "center",
                        justifyContent: "center",
                        minWidth: "1rem",
                        height: "1rem",
                        padding: "0 0.2rem",
                        borderRadius: "9999px",
                        background: "#FF7F7F",
                        color: "#1B263B",
                        fontSize: "0.6rem",
                        fontWeight: 800,
                        lineHeight: 1,
                      }}
                    >
                      {item.badgeCount > 99 ? "99+" : item.badgeCount}
                    </span>
                  )}
                </span>
                <span
                  style={{
                    fontFamily: "var(--font-heading, Montserrat, sans-serif)",
                    fontSize: "0.55rem",
                    fontWeight: 700,
                    letterSpacing: "0.06em",
                    textTransform: "uppercase",
                  }}
                >
                  {item.label}
                </span>
                {isActive && (
                  <span
                    style={{
                      position: "absolute",
                      top: 0,
                      left: "50%",
                      transform: "translateX(-50%)",
                      width: "32px",
                      height: "2px",
                      background: "#FF7F7F",
                      borderRadius: "0 0 2px 2px",
                    }}
                  />
                )}
              </button>
            );
          }

          return (
            <Link
              key={item.href}
              href={item.href}
              className="flex flex-col items-center justify-center flex-1 gap-0.5 relative transition-colors"
              style={{ color: isActive ? "#FF7F7F" : "#778DA9" }}
              aria-label={item.label}
              aria-current={isActive ? "page" : undefined}
            >
              <span className="relative">
                {item.icon}
                {item.badgeCount != null && item.badgeCount > 0 && (
                  <span
                    style={{
                      position: "absolute",
                      top: "-4px",
                      right: "-6px",
                      display: "inline-flex",
                      alignItems: "center",
                      justifyContent: "center",
                      minWidth: "1rem",
                      height: "1rem",
                      padding: "0 0.2rem",
                      borderRadius: "9999px",
                      background: "#FF7F7F",
                      color: "#1B263B",
                      fontSize: "0.6rem",
                      fontWeight: 800,
                      lineHeight: 1,
                    }}
                  >
                    {item.badgeCount > 99 ? "99+" : item.badgeCount}
                  </span>
                )}
              </span>
              <span
                style={{
                  fontFamily: "var(--font-heading, Montserrat, sans-serif)",
                  fontSize: "0.55rem",
                  fontWeight: 700,
                  letterSpacing: "0.06em",
                  textTransform: "uppercase",
                }}
              >
                {item.label}
              </span>
              {isActive && (
                <span
                  style={{
                    position: "absolute",
                    top: 0,
                    left: "50%",
                    transform: "translateX(-50%)",
                    width: "32px",
                    height: "2px",
                    background: "#FF7F7F",
                    borderRadius: "0 0 2px 2px",
                  }}
                />
              )}
            </Link>
          );
        })}

        {/* Logout tab — always last on mobile when showLogout is true */}
        {showLogout && (
          <button
            type="button"
            onClick={() => void handleLogout()}
            className="flex flex-col items-center justify-center flex-1 gap-0.5 transition-colors"
            style={{ color: "#778DA9" }}
            aria-label="Log out"
          >
            <LogOut size={18} aria-hidden="true" />
            <span
              style={{
                fontFamily: "var(--font-heading, Montserrat, sans-serif)",
                fontSize: "0.55rem",
                fontWeight: 700,
                letterSpacing: "0.06em",
                textTransform: "uppercase",
              }}
            >
              Logout
            </span>
          </button>
        )}
      </nav>
    </>
  );
}
