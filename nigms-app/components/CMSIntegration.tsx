'use client';

import { useState } from 'react';
import { createBrowserClient } from '@/lib/supabase-browser';
import type { WorkOrder } from '@/lib/types';

// ─── Types ────────────────────────────────────────────────────────────────────

interface CMSIntegrationProps {
  workOrders: (WorkOrder & { client_name?: string | null })[];
}

interface UploadResult {
  beforeUrl: string;
  afterUrl: string;
  galleryId: string;
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

function sanitizeFileName(name: string): string {
  return name.replace(/[^a-zA-Z0-9._-]/g, '_');
}

async function uploadImage(
  supabase: ReturnType<typeof createBrowserClient>,
  file: File,
  prefix: string
): Promise<string> {
  const ext = file.name.split('.').pop() ?? 'jpg';
  const fileName = `${prefix}_${Date.now()}_${sanitizeFileName(file.name.replace(/\.[^.]+$/, ''))}.${ext}`;
  const path = `gallery/${fileName}`;

  const { error } = await supabase.storage
    .from('project-gallery')
    .upload(path, file, { upsert: false, contentType: file.type });

  if (error) throw new Error(`Upload failed: ${error.message}`);

  const { data: urlData } = supabase.storage
    .from('project-gallery')
    .getPublicUrl(path);

  return urlData.publicUrl;
}

// ─── Component ────────────────────────────────────────────────────────────────

/**
 * CMSIntegration — admin section to upload completed project photos to
 * Supabase Storage and publish to the public-facing projects page.
 *
 * On submit:
 * 1. Uploads before/after images to the `project-gallery` Storage bucket.
 * 2. Inserts a record into `before_after_gallery` (private, linked to client).
 * 3. Optionally inserts into `gallery` for public display on /projects.
 *
 * Requirements: 8.7
 */
export default function CMSIntegration({ workOrders }: CMSIntegrationProps) {
  const [selectedWorkOrderId, setSelectedWorkOrderId] = useState('');
  const [beforeFile, setBeforeFile] = useState<File | null>(null);
  const [afterFile, setAfterFile] = useState<File | null>(null);
  const [caption, setCaption] = useState('');
  const [publishPublic, setPublishPublic] = useState(false);
  const [publicTitle, setPublicTitle] = useState('');
  const [publicCategory, setPublicCategory] = useState('');

  const [isUploading, setIsUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<UploadResult | null>(null);

  const selectedWorkOrder = workOrders.find((wo) => wo.id === selectedWorkOrderId) ?? null;

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setResult(null);

    if (!selectedWorkOrderId) { setError('Please select a work order.'); return; }
    if (!beforeFile) { setError('Please select a "Before" photo.'); return; }
    if (!afterFile) { setError('Please select an "After" photo.'); return; }
    if (publishPublic && !publicTitle.trim()) { setError('Please enter a title for the public listing.'); return; }

    setIsUploading(true);
    try {
      const supabase = createBrowserClient();

      // 1. Upload images to Storage
      const [beforeUrl, afterUrl] = await Promise.all([
        uploadImage(supabase, beforeFile, 'before'),
        uploadImage(supabase, afterFile, 'after'),
      ]);

      // 2. Insert into before_after_gallery (private, per-client)
      const { data: galleryRecord, error: galleryError } = await supabase
        .from('before_after_gallery')
        .insert({
          client_id: selectedWorkOrder!.client_id,
          work_order_id: selectedWorkOrderId,
          before_url: beforeUrl,
          after_url: afterUrl,
          caption: caption.trim() || null,
        })
        .select('id')
        .single();

      if (galleryError) throw new Error(`Gallery insert failed: ${galleryError.message}`);

      // 3. Optionally publish to public gallery table
      if (publishPublic) {
        const { error: publicError } = await supabase
          .from('gallery')
          .insert({
            title: publicTitle.trim(),
            category: publicCategory.trim() || 'General',
            before_url: beforeUrl,
            after_url: afterUrl,
          });

        if (publicError) {
          // Non-fatal — log but don't block success
          console.warn('[CMSIntegration] Public gallery insert failed:', publicError.message);
        }
      }

      setResult({
        beforeUrl,
        afterUrl,
        galleryId: (galleryRecord as { id: string }).id,
      });

      // Reset form
      setSelectedWorkOrderId('');
      setBeforeFile(null);
      setAfterFile(null);
      setCaption('');
      setPublishPublic(false);
      setPublicTitle('');
      setPublicCategory('');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Upload failed. Please try again.');
    } finally {
      setIsUploading(false);
    }
  }

  return (
    <div className="flex flex-col gap-6">
      {/* Success message */}
      {result && (
        <div
          className="rounded-lg p-4 flex flex-col gap-2"
          style={{ background: '#F0FDF4', border: '1px solid #22C55E' }}
          role="alert"
        >
          <p className="text-sm font-semibold" style={{ color: '#15803D' }}>
            ✓ Photos uploaded successfully!
          </p>
          <div className="flex gap-4 text-xs" style={{ color: '#166534' }}>
            <a
              href={result.beforeUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="underline hover:no-underline"
            >
              View Before Photo →
            </a>
            <a
              href={result.afterUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="underline hover:no-underline"
            >
              View After Photo →
            </a>
          </div>
        </div>
      )}

      <form onSubmit={handleSubmit} className="flex flex-col gap-5">
        {/* Work order selector */}
        <div className="flex flex-col gap-1.5">
          <label
            htmlFor="cms-work-order"
            className="text-sm font-medium"
            style={{ color: 'var(--color-text-primary)' }}
          >
            Work Order
          </label>
          <select
            id="cms-work-order"
            value={selectedWorkOrderId}
            onChange={(e) => setSelectedWorkOrderId(e.target.value)}
            required
            className="w-full px-3 py-2 text-sm rounded-md"
            style={{
              border: '1px solid #1B263B',
              background: 'var(--color-bg-elevated)',
              color: 'var(--color-text-primary)',
            }}
          >
            <option value="">— Select a work order —</option>
            {workOrders.map((wo) => (
              <option key={wo.id} value={wo.id}>
                {wo.wo_number ? `#${wo.wo_number} — ` : ''}{wo.title}
                {wo.client_name ? ` (${wo.client_name})` : ''}
              </option>
            ))}
          </select>
        </div>

        {/* Before photo */}
        <div className="flex flex-col gap-1.5">
          <label
            htmlFor="cms-before"
            className="text-sm font-medium"
            style={{ color: 'var(--color-text-primary)' }}
          >
            Before Photo <span style={{ color: '#FF7F7F' }}>*</span>
          </label>
          <input
            id="cms-before"
            type="file"
            accept="image/*"
            required
            onChange={(e) => setBeforeFile(e.target.files?.[0] ?? null)}
            className="text-sm"
            style={{ color: 'var(--color-text-primary)' }}
          />
          {beforeFile && (
            <p className="text-xs" style={{ color: 'var(--color-text-muted)' }}>
              Selected: {beforeFile.name} ({(beforeFile.size / 1024).toFixed(0)} KB)
            </p>
          )}
        </div>

        {/* After photo */}
        <div className="flex flex-col gap-1.5">
          <label
            htmlFor="cms-after"
            className="text-sm font-medium"
            style={{ color: 'var(--color-text-primary)' }}
          >
            After Photo <span style={{ color: '#FF7F7F' }}>*</span>
          </label>
          <input
            id="cms-after"
            type="file"
            accept="image/*"
            required
            onChange={(e) => setAfterFile(e.target.files?.[0] ?? null)}
            className="text-sm"
            style={{ color: 'var(--color-text-primary)' }}
          />
          {afterFile && (
            <p className="text-xs" style={{ color: 'var(--color-text-muted)' }}>
              Selected: {afterFile.name} ({(afterFile.size / 1024).toFixed(0)} KB)
            </p>
          )}
        </div>

        {/* Caption */}
        <div className="flex flex-col gap-1.5">
          <label
            htmlFor="cms-caption"
            className="text-sm font-medium"
            style={{ color: 'var(--color-text-primary)' }}
          >
            Caption{' '}
            <span className="text-xs font-normal" style={{ color: 'var(--color-text-muted)' }}>
              (optional)
            </span>
          </label>
          <input
            id="cms-caption"
            type="text"
            value={caption}
            onChange={(e) => setCaption(e.target.value)}
            placeholder="e.g. Kitchen renovation — tile replacement"
            className="w-full px-3 py-2 text-sm rounded-md"
            style={{
              border: '1px solid #1B263B',
              background: 'var(--color-bg-elevated)',
              color: 'var(--color-text-primary)',
            }}
          />
        </div>

        {/* Publish to public gallery toggle */}
        <div
          className="rounded-lg p-4 flex flex-col gap-3"
          style={{ border: '1px solid var(--color-steel-mid)', background: 'var(--color-bg-base)' }}
        >
          <label className="flex items-center gap-2 cursor-pointer select-none">
            <input
              type="checkbox"
              checked={publishPublic}
              onChange={(e) => setPublishPublic(e.target.checked)}
              className="w-4 h-4 rounded"
              style={{ accentColor: '#FF7F7F' }}
            />
            <span className="text-sm font-medium" style={{ color: 'var(--color-text-primary)' }}>
              Also publish to public projects page
            </span>
          </label>

          {publishPublic && (
            <div className="flex flex-col gap-3 pl-6">
              <div className="flex flex-col gap-1.5">
                <label
                  htmlFor="cms-public-title"
                  className="text-xs font-medium"
                  style={{ color: 'var(--color-text-secondary)' }}
                >
                  Public Title <span style={{ color: '#FF7F7F' }}>*</span>
                </label>
                <input
                  id="cms-public-title"
                  type="text"
                  value={publicTitle}
                  onChange={(e) => setPublicTitle(e.target.value)}
                  placeholder="e.g. Kitchen Tile Renovation"
                  className="w-full px-3 py-2 text-sm rounded-md"
                  style={{
                    border: '1px solid #1B263B',
                    background: 'var(--color-bg-elevated)',
                    color: 'var(--color-text-primary)',
                  }}
                />
              </div>
              <div className="flex flex-col gap-1.5">
                <label
                  htmlFor="cms-public-category"
                  className="text-xs font-medium"
                  style={{ color: 'var(--color-text-secondary)' }}
                >
                  Category{' '}
                  <span className="font-normal" style={{ color: 'var(--color-text-muted)' }}>
                    (optional)
                  </span>
                </label>
                <input
                  id="cms-public-category"
                  type="text"
                  value={publicCategory}
                  onChange={(e) => setPublicCategory(e.target.value)}
                  placeholder="e.g. Kitchen, Bathroom, Exterior"
                  className="w-full px-3 py-2 text-sm rounded-md"
                  style={{
                    border: '1px solid #1B263B',
                    background: 'var(--color-bg-elevated)',
                    color: 'var(--color-text-primary)',
                  }}
                />
              </div>
            </div>
          )}
        </div>

        {/* Error */}
        {error && (
          <p className="text-sm" style={{ color: 'var(--color-error, #EF4444)' }} role="alert">
            {error}
          </p>
        )}

        {/* Submit */}
        <button
          type="submit"
          disabled={isUploading}
          className="flex items-center justify-center gap-2 px-5 py-2.5 text-sm font-semibold rounded-md transition-opacity disabled:opacity-60"
          style={{
            background: '#1B263B',
            color: '#fff',
          }}
        >
          {isUploading ? (
            <>
              <span
                className="inline-block w-4 h-4 rounded-full animate-pulse"
                style={{ background: '#FF7F7F' }}
                aria-hidden="true"
              />
              Uploading…
            </>
          ) : (
            <>
              <span aria-hidden="true">🖼️</span>
              Upload Photos
            </>
          )}
        </button>
      </form>
    </div>
  );
}
