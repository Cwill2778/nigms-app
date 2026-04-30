"use client";

import { useEffect } from "react";
import { X } from "lucide-react";

interface SidePanelProps {
  open: boolean;
  onClose: () => void;
  title: string;
  children: React.ReactNode;
  width?: "md" | "lg" | "xl";
}

const widthMap = {
  md: "w-[400px]",
  lg: "w-[600px]",
  xl: "w-[800px]",
};

export default function SidePanel({
  open,
  onClose,
  title,
  children,
  width = "lg",
}: SidePanelProps) {
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, [onClose]);

  return (
    <>
      {open && (
        <div
          className="fixed inset-0 z-40"
          style={{ background: "rgba(0,0,0,0.6)" }}
          onClick={onClose}
          aria-hidden="true"
        />
      )}

      <div
        className={`fixed inset-y-0 right-0 ${widthMap[width]} z-50 flex flex-col
          transition-transform duration-300 ease-in-out
          ${open ? "translate-x-0" : "translate-x-full"}`}
        style={{
          background: "var(--color-bg-surface)",
          borderLeft: "2px solid var(--color-steel-mid)",
        }}
      >
        {/* Header */}
        <div
          className="px-6 py-4 flex items-center justify-between shrink-0"
          style={{
            background: "var(--color-navy)",
            borderBottom: "1px solid var(--color-navy-bright)",
          }}
        >
          <h2
            style={{
              fontFamily: "var(--font-heading)",
              fontSize: "0.85rem",
              fontWeight: 800,
              letterSpacing: "0.12em",
              textTransform: "uppercase",
              color: "var(--color-text-on-navy)",
            }}
          >
            {title}
          </h2>
          <button
            onClick={onClose}
            aria-label="Close panel"
            className="transition-colors"
            style={{ color: "var(--color-steel-bright)" }}
            onMouseEnter={(e) =>
              (e.currentTarget.style.color = "var(--color-accent-orange)")
            }
            onMouseLeave={(e) =>
              (e.currentTarget.style.color = "var(--color-steel-bright)")
            }
          >
            <X size={20} />
          </button>
        </div>

        {/* Body */}
        <div className="flex-1 overflow-y-auto">{children}</div>
      </div>
    </>
  );
}
