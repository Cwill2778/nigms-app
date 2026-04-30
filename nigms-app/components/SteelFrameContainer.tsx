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
      className={`sm:mx-2 md:mx-4 sm:my-2 md:my-4 flex flex-col min-h-screen sm:min-h-[calc(100vh-1rem)] md:min-h-[calc(100vh-2rem)]${className ? ` ${className}` : ""}`}
      style={{
        border: "2px solid var(--color-navy-bright)",
        background: "var(--color-bg-base)",
      }}
    >
      {children}
    </div>
  );
}
