"use client";

import { useRef, useState, useCallback, useEffect } from "react";
import Image from "next/image";

export interface GalleryItem {
  id: string;
  title: string;
  beforeImage: string;
  afterImage: string;
}

interface BeforeAfterSliderProps {
  item: GalleryItem;
}

export default function BeforeAfterSlider({ item }: BeforeAfterSliderProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [sliderPos, setSliderPos] = useState(50); // percentage 0–100
  const isDragging = useRef(false);

  const calcPos = useCallback((clientX: number) => {
    const rect = containerRef.current?.getBoundingClientRect();
    if (!rect) return;
    const x = Math.max(0, Math.min(clientX - rect.left, rect.width));
    setSliderPos((x / rect.width) * 100);
  }, []);

  // Mouse events
  const onMouseMove = useCallback(
    (e: MouseEvent) => {
      if (!isDragging.current) return;
      calcPos(e.clientX);
    },
    [calcPos]
  );

  const onMouseUp = useCallback(() => {
    isDragging.current = false;
  }, []);

  useEffect(() => {
    window.addEventListener("mousemove", onMouseMove);
    window.addEventListener("mouseup", onMouseUp);
    return () => {
      window.removeEventListener("mousemove", onMouseMove);
      window.removeEventListener("mouseup", onMouseUp);
    };
  }, [onMouseMove, onMouseUp]);

  // Touch events
  const onTouchMove = useCallback(
    (e: React.TouchEvent) => {
      calcPos(e.touches[0].clientX);
    },
    [calcPos]
  );

  return (
    <div className="rounded-xl overflow-hidden border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 shadow-sm">
      {/* Slider area */}
      <div
        ref={containerRef}
        className="relative aspect-[4/3] overflow-hidden cursor-col-resize select-none"
        onMouseDown={(e) => {
          isDragging.current = true;
          calcPos(e.clientX);
        }}
        onMouseMove={(e) => {
          // hover (no drag) still moves slider
          calcPos(e.clientX);
        }}
        onTouchStart={(e) => calcPos(e.touches[0].clientX)}
        onTouchMove={onTouchMove}
      >
        {/* Before image — full width, clipped on right */}
        <div className="absolute inset-0">
          <Image
            src={item.beforeImage}
            alt={`${item.title} — Before`}
            fill
            draggable={false}
            className="object-cover pointer-events-none"
            sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
          />
        </div>

        {/* After image — clipped to right of divider */}
        <div
          className="absolute inset-0 overflow-hidden"
          style={{ clipPath: `inset(0 0 0 ${sliderPos}%)` }}
        >
          <Image
            src={item.afterImage}
            alt={`${item.title} — After`}
            fill
            draggable={false}
            className="object-cover pointer-events-none"
            sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
          />
        </div>

        {/* Divider line */}
        <div
          className="absolute top-0 bottom-0 w-0.5 bg-white shadow-[0_0_6px_rgba(0,0,0,0.6)] pointer-events-none"
          style={{ left: `${sliderPos}%` }}
        >
          {/* Handle */}
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-8 h-8 rounded-full bg-white shadow-md flex items-center justify-center">
            <svg
              className="w-4 h-4 text-gray-600"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
              strokeWidth={2}
            >
              <path strokeLinecap="round" strokeLinejoin="round" d="M8 9l-4 3 4 3M16 9l4 3-4 3" />
            </svg>
          </div>
        </div>

        {/* Labels */}
        <span className="absolute top-3 left-3 text-xs font-bold px-2 py-1 rounded-full bg-gray-800 text-white pointer-events-none">
          Before
        </span>
        <span className="absolute top-3 right-3 text-xs font-bold px-2 py-1 rounded-full bg-green-500 text-white pointer-events-none">
          After
        </span>

        {/* Watermark */}
        <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
          <span
            className="text-white font-semibold tracking-widest uppercase select-none"
            style={{
              fontSize: "clamp(10px, 2vw, 14px)",
              opacity: 0.18,
              transform: "rotate(-30deg)",
              whiteSpace: "nowrap",
              textShadow: "0 1px 3px rgba(0,0,0,0.6)",
              letterSpacing: "0.2em",
            }}
          >
            Nailed It General Maintenance
          </span>
        </div>
      </div>

      {/* Card footer */}
      <div className="p-4">
        <p className="text-sm font-semibold text-gray-900 dark:text-white">{item.title}</p>
        <p className="text-xs text-gray-400 mt-0.5">Drag or hover to reveal the transformation</p>
      </div>
    </div>
  );
}
