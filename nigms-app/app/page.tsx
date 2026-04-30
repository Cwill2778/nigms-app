import { redirect } from 'next/navigation';
import { createServerClient } from '@/lib/supabase';
import { createClient } from "@supabase/supabase-js";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import ProjectGallery from "@/components/ProjectGallery";
import NewsletterForm from "@/components/NewsletterForm";
import FallingNails from "@/components/FallingNails";
import type { GalleryItem } from "@/components/BeforeAfterSlider";

async function getGalleryItems(): Promise<GalleryItem[]> {
  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  );
  const { data, error } = await supabase
    .from("gallery")
    .select("id, title, beforeImage:before_url, afterImage:after_url")
    .order("sort_order", { ascending: true });
  if (error) {
    console.error("[gallery] fetch error", error);
    return [];
  }
  return (data ?? []) as GalleryItem[];
}

export default async function RootPage() {
  const supabase = await createServerClient();
  const { data: { session } } = await supabase.auth.getSession();

  if (session) {
    const { data: profile } = await supabase
      .from('users')
      .select('role, requires_password_reset')
      .eq('id', session.user.id)
      .single();

    const typedProfile = profile as { role: string; requires_password_reset: boolean } | null;
    if (typedProfile?.role === 'admin' && !typedProfile?.requires_password_reset) redirect('/admin-dashboard');
    if (typedProfile?.requires_password_reset) redirect('/update-password');
    if (typedProfile?.role === 'admin') redirect('/admin-dashboard');
    redirect('/dashboard');
  }

  const galleryItems = await getGalleryItems();

  return (
    <div className="flex flex-col min-h-screen">
      <Navbar />
      <main className="flex-1">
        {/* Hero */}
        <section className="relative overflow-hidden border-b border-gray-200 dark:border-gray-700 min-h-[480px] flex items-center">
          {/* Animated falling nails canvas */}
          <FallingNails />

          {/* Frosted white overlay card */}
          <div className="relative z-10 w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20 flex justify-center">
            <div className="bg-white/85 dark:bg-[#0a1f44]/80 backdrop-blur-md border-2 border-[#4A4A4A] px-8 py-12 max-w-2xl w-full text-center shadow-xl">
              <h1 className="text-4xl sm:text-5xl font-bold text-gray-900 dark:text-white tracking-tight">
                Nailed It General Maintenance Services
              </h1>
              <p className="mt-4 text-lg text-gray-700 dark:text-gray-200 max-w-xl mx-auto">
                Professional handyman and maintenance services you can count on. From repairs to renovations — we get it done right.
              </p>
              <div className="mt-8 flex flex-col sm:flex-row gap-4 justify-center">
                <a href="/book" className="inline-flex items-center justify-center px-6 py-3 bg-orange-500 hover:bg-orange-600 text-white font-medium transition-colors border-2 border-orange-600">
                  Book a Service
                </a>
              </div>
            </div>
          </div>
        </section>

        {/* Before & After Gallery */}
        <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
          <div className="text-center mb-10">
            <h2 className="text-3xl font-bold text-gray-900 dark:text-white">Our Work</h2>
            <p className="mt-2 text-gray-500 dark:text-gray-400">Hover or drag to reveal the transformation.</p>
          </div>
          <ProjectGallery items={galleryItems} />
        </section>

        {/* Newsletter */}
        <section className="bg-gray-50 dark:bg-gray-800 border-t border-gray-200 dark:border-gray-700">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16 text-center">
            <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
              Stay in the Loop
            </h2>
            <p className="text-gray-600 dark:text-gray-300 mb-8">
              Get updates on new services, promotions, and project highlights.
            </p>
            <NewsletterForm />
          </div>
        </section>
      </main>
      <Footer />
    </div>
  );
}
