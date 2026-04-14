"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { useTheme } from "next-themes";
import { useRouter } from "next/navigation";
import { Menu, X } from "lucide-react";
import ThemeToggle from "./ThemeToggle";
import { createBrowserClient } from "@/lib/supabase-browser";
import type { User } from "@supabase/supabase-js";
import type { UserProfile } from "@/lib/types";

export default function Navbar() {
  const router = useRouter();
  const { resolvedTheme } = useTheme();
  const [user, setUser] = useState<User | null>(null);
  const [role, setRole] = useState<UserProfile["role"] | null>(null);
  const [menuOpen, setMenuOpen] = useState(false);

  useEffect(() => {
    const supabase = createBrowserClient();

    async function loadUser() {
      const { data: { user } } = await supabase.auth.getUser();
      setUser(user);

      if (user) {
        const { data } = await supabase
          .from("users")
          .select("role")
          .eq("id", user.id)
          .single();
        setRole(data?.role ?? null);
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
    const supabase = createBrowserClient();
    await supabase.auth.signOut();
    router.push("/");
  }

  const publicLinks = [
    { href: "/", label: "Home" },
    { href: "/projects", label: "Projects" },
    { href: "/book", label: "Book a Service" },
  ];

  const authLinks = user
    ? role === "admin"
      ? [{ href: "/admin/admin-dashboard", label: "Admin Dashboard" }]
      : [{ href: "/dashboard", label: "Dashboard" }]
    : [{ href: "/login", label: "Login" }];

  const allLinks = [...publicLinks, ...authLinks];

  return (
    <nav className="w-full border-b border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-28">
          {/* Logo — swaps between light and dark variants */}
          <Link href="/" className="shrink-0">
            <Image
              src={resolvedTheme === "dark" ? "/logo-dark.svg" : "/logo-light.svg"}
              alt="Nailed It General Maintenance Solutions"
              width={400}
              height={100}
              className="h-20 w-auto object-contain"
              priority
            />
          </Link>

          {/* Desktop nav */}
          <div className="hidden md:flex items-center gap-6">
            {allLinks.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                className="text-sm text-gray-600 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white transition-colors"
              >
                {link.label}
              </Link>
            ))}
            {user && (
              <button
                onClick={handleLogout}
                className="text-sm text-gray-600 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white transition-colors"
              >
                Logout
              </button>
            )}
            <ThemeToggle />
          </div>

          {/* Mobile: theme toggle + hamburger */}
          <div className="flex md:hidden items-center gap-2">
            <ThemeToggle />
            <button
              onClick={() => setMenuOpen((o) => !o)}
              aria-label="Toggle menu"
              className="p-2 rounded-md text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
            >
              {menuOpen ? <X size={20} /> : <Menu size={20} />}
            </button>
          </div>
        </div>
      </div>

      {/* Mobile menu */}
      {menuOpen && (
        <div className="md:hidden border-t border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 px-4 py-3 flex flex-col gap-3">
          {allLinks.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              onClick={() => setMenuOpen(false)}
              className="text-sm text-gray-700 dark:text-gray-200 hover:text-gray-900 dark:hover:text-white transition-colors"
            >
              {link.label}
            </Link>
          ))}
          {user && (
            <button
              onClick={() => { setMenuOpen(false); handleLogout(); }}
              className="text-left text-sm text-gray-700 dark:text-gray-200 hover:text-gray-900 dark:hover:text-white transition-colors"
            >
              Logout
            </button>
          )}
        </div>
      )}
    </nav>
  );
}
