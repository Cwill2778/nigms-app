'use client';

import { useState, useEffect } from 'react';
import Image from 'next/image';
import { createBrowserClient } from '@/lib/supabase-browser';
import type { BeforeAfterImage } from '@/lib/types';

// ─── Public gallery item (used by the public /projects page) ─────────────────

export interface GalleryItem {
  id: string;
  title: string;
  category: string;
  before_url: string;
  after_url: string;
}

// ─── Gallery card (shared between public and private modes) ──────────────────

function GalleryCard({
  beforeUrl,
  afterUrl,
  caption,
  title,
  category,
}: {
  beforeUrl: string;
  afterUrl: string;
  caption?: string | null;
  title?: string;
  category?: string;
}) {
  const [showAfter, setShowAfter] = useState(false);

  const displayTitle = title ?? caption ?? 'Project Photo';
  const displayCategory = category ?? '';

  return (
    <div
      className="rounded-xl overflow-hidden border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 shadow-sm group"
      style={{ border: '1px solid var(--color-steel-dim, #2a3a52)' }}
    >
      {/* Image toggle */}
      <div
        className="relative aspect-[4/3] overflow-hidden cursor-pointer select-none"
        onClick={() => setShowAfter((v) => !v)}
        onContextMenu={(e) => e.preventDefault()}
      >
        <Image
          src={showAfter ? afterUrl : beforeUrl}
          alt={showAfter ? `${displayTitle} — After` : `${displayTitle} — Before`}
          fill
          draggable={false}
          className="object-cover transition-opacity duration-500 pointer-events-none"
          sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
        />

        {/* Subtle watermark */}
        <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
          <span
            className="text-white font-semibold tracking-widest uppercase select-none"
            style={{
              fontSize: 'clamp(10px, 2vw, 14px)',
              opacity: 0.18,
              transform: 'rotate(-30deg)',
              whiteSpace: 'nowrap',
              textShadow: '0 1px 3px rgba(0,0,0,0.6)',
              letterSpacing: '0.2em',
            }}
          >
            Nailed It General Maintenance
          </span>
        </div>

        {/* Before/After label */}
        <span
          className={`absolute top-3 left-3 text-xs font-bold px-2 py-1 rounded-full ${
            showAfter ? 'bg-green-500 text-white' : 'bg-gray-800 text-white'
          }`}
        >
          {showAfter ? 'After' : 'Before'}
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
            <p
              className="text-sm font-semibold"
              style={{ color: 'var(--color-text-primary, #f0f4f8)' }}
            >
              {displayTitle}
            </p>
            {displayCategory && (
              <p
                className="text-xs"
                style={{ color: 'var(--color-text-muted, #778DA9)' }}
              >
                {displayCategory}
              </p>
            )}
          </div>
        </div>
        <div className="flex gap-2">
          <button
            onClick={() => setShowAfter(false)}
            className={`flex-1 text-xs py-1.5 rounded-md font-medium transition-colors ${
              !showAfter
                ? 'text-white'
                : 'border border-gray-300 dark:border-gray-600 text-gray-600 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800'
            }`}
            style={!showAfter ? { background: 'var(--color-navy, #1B263B)' } : {}}
          >
            Before
          </button>
          <button
            onClick={() => setShowAfter(true)}
            className={`flex-1 text-xs py-1.5 rounded-md font-medium transition-colors ${
              showAfter
                ? 'text-white'
                : 'border border-gray-300 dark:border-gray-600 text-gray-600 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800'
            }`}
            style={showAfter ? { background: 'var(--color-coral, #FF7F7F)' } : {}}
          >
            After
          </button>
        </div>
      </div>
    </div>
  );
}

// ─── Public gallery (used by /projects page) ──────────────────────────────────

interface PublicBeforeAfterGalleryProps {
  items: GalleryItem[];
}

/**
 * Public-facing gallery — accepts pre-fetched items as props.
 * Used on the public /projects page.
 */
export function PublicBeforeAfterGallery({ items }: PublicBeforeAfterGalleryProps) {
  if (items.length === 0) {
    return (
      <div className="text-center py-16">
        <p className="text-gray-500 dark:text-gray-400">
          No gallery photos yet. Check back soon!
        </p>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
      {items.map((item) => (
        <GalleryCard
          key={item.id}
          beforeUrl={item.before_url}
          afterUrl={item.after_url}
          title={item.title}
          category={item.category}
        />
      ))}
    </div>
  );
}

// ─── Private client gallery (fetches from Supabase, scoped to auth.uid()) ────

/**
 * BeforeAfterGallery — private per-client image gallery.
 *
 * Fetches from the `before_after_gallery` table scoped to the authenticated
 * client's `client_id`. Renders before/after image pairs with captions.
 *
 * Requirements: 7.2
 */
export default function BeforeAfterGallery() {
  const [images, setImages] = useState<BeforeAfterImage[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const supabase = createBrowserClient();

    async function fetchGallery() {
      setLoading(true);
      setError(null);

      const {
        data: { session },
      } = await supabase.auth.getSession();

      if (!session) {
        setError('Not authenticated');
        setLoading(false);
        return;
      }

      const { data, error: fetchError } = await supabase
        .from('before_after_gallery')
        .select('*')
        .eq('client_id', session.user.id)
        .order('created_at', { ascending: false });

      if (fetchError) {
        setError(fetchError.message);
      } else {
        setImages((data as BeforeAfterImage[]) ?? []);
      }

      setLoading(false);
    }

    fetchGallery();
  }, []);

  if (loading) {
    return (
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: '0.5rem',
          color: 'var(--color-text-muted, #778DA9)',
          fontSize: '0.875rem',
        }}
      >
        <span
          style={{
            display: 'inline-block',
            width: '1rem',
            height: '1rem',
            borderRadius: '50%',
            background: 'var(--color-coral, #FF7F7F)',
            animation: 'pulse 1.5s ease-in-out infinite',
          }}
        />
        Loading gallery…
      </div>
    );
  }

  if (error) {
    return (
      <p style={{ color: 'var(--color-error, #EF4444)', fontSize: '0.875rem' }}>
        Failed to load gallery: {error}
      </p>
    );
  }

  if (images.length === 0) {
    return (
      <p style={{ color: 'var(--color-text-muted, #778DA9)', fontSize: '0.875rem' }}>
        No project photos yet.
      </p>
    );
  }

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
      {images.map((img) => (
        <GalleryCard
          key={img.id}
          beforeUrl={img.before_url}
          afterUrl={img.after_url}
          caption={img.caption}
        />
      ))}
    </div>
  );
}
