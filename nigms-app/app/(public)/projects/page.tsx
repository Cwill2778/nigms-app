import { createClient } from '@supabase/supabase-js';
import { PublicBeforeAfterGallery, type GalleryItem } from '@/components/BeforeAfterGallery';

/**
 * Fetches published gallery items for the public projects page.
 *
 * Items come from two sources:
 * 1. The `gallery` table — explicitly published by admin via CMSIntegration
 *    (the "publish to public projects page" checkbox).
 * 2. The `before_after_gallery` table is private (per-client) and is NOT
 *    shown here. Only items explicitly published to `gallery` appear publicly.
 *
 * Requirements: 8.7
 */
async function getGalleryItems(): Promise<GalleryItem[]> {
  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { autoRefreshToken: false, persistSession: false } }
  );

  // Try ordering by sort_order first; fall back to created_at if column absent
  const { data, error } = await supabase
    .from('gallery')
    .select('id, title, category, before_url, after_url')
    .order('created_at', { ascending: false });

  if (error) {
    console.error('[projects] gallery fetch error', error);
    return [];
  }

  return (data ?? []) as GalleryItem[];
}

export default async function ProjectsPage() {
  const items = await getGalleryItems();

  return (
    <main className="flex-1 max-w-7xl mx-auto w-full px-4 sm:px-6 lg:px-8 py-12">
      <div className="mb-10">
        <h1
          className="text-3xl font-bold mb-2"
          style={{ color: '#1B263B' }}
        >
          Our Work
        </h1>
        <p className="text-sm max-w-xl" style={{ color: '#778DA9' }}>
          Browse before-and-after photos from recent projects. Click any image to toggle between before and after.
        </p>
      </div>

      <PublicBeforeAfterGallery items={items} />
    </main>
  );
}
