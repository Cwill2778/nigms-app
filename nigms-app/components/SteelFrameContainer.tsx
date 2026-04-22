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
      className={`m-4 border-2 border-[#4A4A4A] flex flex-col min-h-[calc(100vh-2rem)]${className ? ` ${className}` : ""}`}
    >
      {children}
    </div>
  );
}
