"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Menu, X } from "lucide-react";
import ThemeToggle from "./ThemeToggle";
import { createBrowserClient } from "@/lib/supabase-browser";
import type { User } from "@supabase/supabase-js";
import type { UserProfile } from "@/lib/types";

export default function Navbar() {
  const router = useRouter();
  const [user, setUser] = useState<User | null>(null);
  const [role, setRole] = useState<UserProfile["role"] | null>(null);
  const [menuOpen, setMenuOpen] = useState(false);

  useEffect(() => {
    const supabase = createBrowserClient();

    async function loadUser() {
      const { data: { user } } = await supabase.auth.getUser();
      setUser(user);
      if (user) {
        const { data } = await supabase.from("users").select("role").eq("id", user.id).single();
        setRole((data as { role: UserProfile["role"] } | null)?.role ?? null);
      }
    }

    loadUser();

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null);
      if (!session?.user) setRole(null);
    });

    return () => subscription.unsubscribe();
  }, []);

  async function handleLogout() {
    await createBrowserClient().auth.signOut();
    router.push("/");
  }

  const publicLinks = [
    { href: "/", label: "Home" },
    { href: "/book", label: "Book a Service" },
  ];

  const authLinks = user
    ? role === "admin"
      ? [{ href: "/admin-dashboard", label: "Admin Dashboard" }]
      : [{ href: "/dashboard", label: "Dashboard" }]
    : [
        { href: "/login", label: "Login" },
        { href: "/signup", label: "Create Account" },
      ];

  const allLinks = [...publicLinks, ...authLinks];

  return (
    /* Force dark rendering — navbar is always brand-dark regardless of page theme */
    <nav
      className="w-full"
      style={{
        background: "var(--color-navy)",
        borderBottom: "2px solid var(--color-navy-bright)",
      }}
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16 md:h-28">

          {/* Logo — white version always works on navy background */}
          <Link href="/" className="shrink-0">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src="/nailedItGeneralMaintenance/Standard (image)/White on Transparent.png"
              alt="Nailed It General Maintenance Solutions"
              className="h-10 md:h-20 w-auto"
            />
          </Link>

          {/* Desktop nav */}
          <div className="hidden md:flex items-center gap-6">
            {allLinks.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                className="text-sm font-medium transition-colors"
                style={{ color: "var(--color-text-on-navy)" }}
                onMouseEnter={(e) => (e.currentTarget.style.color = "var(--color-accent-orange)")}
                onMouseLeave={(e) => (e.currentTarget.style.color = "var(--color-text-on-navy)")}
              >
                {link.label}
              </Link>
            ))}
            {user && (
              <button
                onClick={handleLogout}
                className="text-sm font-medium transition-colors"
                style={{ color: "var(--color-text-on-navy)" }}
                onMouseEnter={(e) => (e.currentTarget.style.color = "var(--color-accent-orange)")}
                onMouseLeave={(e) => (e.currentTarget.style.color = "var(--color-text-on-navy)")}
              >
                Logout
              </button>
            )}
            {/* ThemeToggle wrapped so icon is visible on navy */}
            <div style={{ color: "var(--color-text-on-navy)" }}>
              <ThemeToggle />
            </div>
          </div>

          {/* Mobile: theme toggle + hamburger */}
          <div className="flex md:hidden items-center gap-2">
            <div style={{ color: "var(--color-text-on-navy)" }}>
              <ThemeToggle />
            </div>
            <button
              onClick={() => setMenuOpen((o) => !o)}
              aria-label="Toggle menu"
              className="p-2 transition-colors"
              style={{ color: "var(--color-text-on-navy)", borderRadius: "var(--radius-sm)" }}
              onMouseEnter={(e) => (e.currentTarget.style.background = "var(--color-navy-mid)")}
              onMouseLeave={(e) => (e.currentTarget.style.background = "transparent")}
            >
              {menuOpen ? <X size={20} /> : <Menu size={20} />}
            </button>
          </div>
        </div>
      </div>

      {/* Mobile menu */}
      {menuOpen && (
        <div
          className="md:hidden px-4 py-3 flex flex-col gap-3"
          style={{
            borderTop: "1px solid var(--color-navy-bright)",
            background: "var(--color-navy-mid)",
          }}
        >
          {allLinks.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              onClick={() => setMenuOpen(false)}
              className="text-sm font-medium transition-colors"
              style={{ color: "var(--color-text-on-navy)" }}
            >
              {link.label}
            </Link>
          ))}
          {user && (
            <button
              onClick={() => { setMenuOpen(false); handleLogout(); }}
              className="text-left text-sm font-medium transition-colors"
              style={{ color: "var(--color-text-on-navy)" }}
            >
              Logout
            </button>
          )}
        </div>
      )}
    </nav>
  );
}
