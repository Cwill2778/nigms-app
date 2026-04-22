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
      if (e.key === "Escape") {
        onClose();
      }
    };
    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, [onClose]);

  return (
    <>
      {/* Backdrop */}
      {open && (
        <div
          className="fixed inset-0 bg-black/50 z-40"
          onClick={onClose}
          aria-hidden="true"
        />
      )}

      {/* Panel */}
      <div
        className={`fixed inset-y-0 right-0 ${widthMap[width]} z-50 flex flex-col
          bg-[#0a1f44] border-l-2 border-[#4A4A4A]
          transition-transform duration-300 ease-in-out
          ${open ? "translate-x-0" : "translate-x-full"}`}
      >
        {/* Header */}
        <div className="bg-[#162d5e] px-6 py-4 flex items-center justify-between shrink-0">
          <h2 className="text-white font-semibold text-lg uppercase tracking-widest">
            {title}
          </h2>
          <button
            onClick={onClose}
            aria-label="Close panel"
            className="text-gray-300 hover:text-orange-400 transition-colors"
          >
            <X size={20} />
          </button>
        </div>

        {/* Body */}
        <div className="flex-1 overflow-y-auto">
          {children}
        </div>
      </div>
    </>
  );
}
