import React from "react";

interface SteelFrameContainerProps {
  children: React.ReactNode;
  className?: string;
}

export default function SteelFrameContainer({
  children,
  className,
}: SteelFrameContainerProps) {
  return (
    <div
      className={`m-4 flex flex-col min-h-[calc(100vh-2rem)]${className ? ` ${className}` : ""}`}
      style={{
        /* Navy border so it's visible in both light and dark mode —
           the navy token is dark enough to show on a light page background
           and distinct enough to show on the dark steel background */
        border: "2px solid var(--color-navy-bright)",
        background: "var(--color-bg-base)",
      }}
    >
      {children}
    </div>
  );
}
