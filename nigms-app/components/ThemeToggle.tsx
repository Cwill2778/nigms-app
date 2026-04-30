"use client";

import { useTheme } from "next-themes";
import { useEffect, useState } from "react";
import { Sun, Moon } from "lucide-react";

export default function ThemeToggle() {
  const { theme, setTheme } = useTheme();
  const [mounted, setMounted] = useState(false);

  useEffect(() => { setMounted(true); }, []);
  if (!mounted) return null;

  const isDark = theme === "dark";

  return (
    <button
      onClick={() => setTheme(isDark ? "light" : "dark")}
      aria-label={isDark ? "Switch to light mode" : "Switch to dark mode"}
      className="rounded-md p-2 transition-colors"
      style={{
        /* Inherits color from parent wrapper so it's always visible
           whether sitting on navy (Navbar) or a light/dark page surface */
        color: "inherit",
      }}
      onMouseEnter={(e) => (e.currentTarget.style.background = "rgba(255,255,255,0.1)")}
      onMouseLeave={(e) => (e.currentTarget.style.background = "transparent")}
    >
      {isDark ? <Sun size={18} /> : <Moon size={18} />}
    </button>
  );
}
