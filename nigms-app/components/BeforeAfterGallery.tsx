"use client";

import { useState } from "react";
import Image from "next/image";

export interface GalleryItem {
  id: string;
  title: string;
  category: string;
  before_url: string;
  after_url: string;
}

interface BeforeAfterGalleryProps {
  items: GalleryItem[];
}

function GalleryCard({ item }: { item: GalleryItem }) {
  const [showAfter, setShowAfter] = useState(false);

  return (
    <div className="rounded-xl overflow-hidden border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 shadow-sm group">
      {/* Image toggle */}
      <div
        className="relative aspect-[4/3] overflow-hidden cursor-pointer select-none"
        onClick={() => setShowAfter((v) => !v)}
        onContextMenu={(e) => e.preventDefault()}
      >
        <Image
          src={showAfter ? item.after_url : item.before_url}
          alt={showAfter ? `${item.title} — After` : `${item.title} — Before`}
          fill
          draggable={false}
          className="object-cover transition-opacity duration-500 pointer-events-none"
          sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
        />

        {/* Subtle watermark — diagonal, low opacity */}
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

        {/* Before/After label */}
        <span className={`absolute top-3 left-3 text-xs font-bold px-2 py-1 rounded-full ${showAfter ? "bg-green-500 text-white" : "bg-gray-800 text-white"}`}>
          {showAfter ? "After" : "Before"}
        </span>
        {/* Tap hint */}
        <span className="absolute bottom-3 right-3 text-xs bg-black/50 text-white px-2 py-1 rounded-full opacity-0 group-hover:opacity-100 transition-opacity">
          Tap to toggle
        </span>
      </div>

      {/* Info + toggle buttons */}
      <div className="p-4">
        <div className="flex items-start justify-between gap-2 mb-3">
          <div>
            <p className="text-sm font-semibold text-gray-900 dark:text-white">{item.title}</p>
            <p className="text-xs text-gray-500 dark:text-gray-400">{item.category}</p>
          </div>
        </div>
        <div className="flex gap-2">
          <button
            onClick={() => setShowAfter(false)}
            className={`flex-1 text-xs py-1.5 rounded-md font-medium transition-colors ${!showAfter ? "bg-[#0a1f44] text-white" : "border border-gray-300 dark:border-gray-600 text-gray-600 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800"}`}
          >
            Before
          </button>
          <button
            onClick={() => setShowAfter(true)}
            className={`flex-1 text-xs py-1.5 rounded-md font-medium transition-colors ${showAfter ? "bg-orange-500 text-white" : "border border-gray-300 dark:border-gray-600 text-gray-600 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800"}`}
          >
            After
          </button>
        </div>
      </div>
    </div>
  );
}

export default function BeforeAfterGallery({ items }: BeforeAfterGalleryProps) {
  if (items.length === 0) {
    return (
      <div className="text-center py-16">
        <p className="text-gray-500 dark:text-gray-400">No gallery photos yet. Check back soon!</p>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
      {items.map((item) => (
        <GalleryCard key={item.id} item={item} />
      ))}
    </div>
  );
}
