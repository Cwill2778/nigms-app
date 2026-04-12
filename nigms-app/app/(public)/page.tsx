import { createClient } from "@supabase/supabase-js";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import ProjectGrid from "@/components/ProjectGrid";
import NewsletterForm from "@/components/NewsletterForm";
import type { WorkOrder } from "@/lib/types";

async function getCurrentProjects(): Promise<WorkOrder[]> {
  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  );

  const { data, error } = await supabase
    .from("work_orders")
    .select("*")
    .in("status", ["in_progress", "pending"])
    .order("created_at", { ascending: false });

  if (error) {
    console.error("[landing] failed to fetch projects", error);
    return [];
  }

  return (data ?? []) as WorkOrder[];
}

export default async function LandingPage() {
  const projects = await getCurrentProjects();

  return (
    <div className="flex flex-col min-h-screen">
      <Navbar />

      <main className="flex-1">
        {/* Hero */}
        <section className="bg-white dark:bg-gray-900 border-b border-gray-200 dark:border-gray-700">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20 text-center">
            <h1 className="text-4xl sm:text-5xl font-bold text-gray-900 dark:text-white tracking-tight">
              Nailed It General Maintenance Services
            </h1>
            <p className="mt-4 text-lg text-gray-600 dark:text-gray-300 max-w-2xl mx-auto">
              Professional handyman and maintenance services you can count on. From repairs to renovations — we get it done right.
            </p>
            <div className="mt-8 flex flex-col sm:flex-row gap-4 justify-center">
              <a
                href="/book"
                className="inline-flex items-center justify-center px-6 py-3 rounded-md bg-blue-600 hover:bg-blue-700 dark:bg-blue-500 dark:hover:bg-blue-600 text-white font-medium transition-colors"
              >
                Book a Service
              </a>
              <a
                href="/projects"
                className="inline-flex items-center justify-center px-6 py-3 rounded-md border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-200 hover:bg-gray-50 dark:hover:bg-gray-800 font-medium transition-colors"
              >
                View All Projects
              </a>
            </div>
          </div>
        </section>

        {/* Current & Upcoming Projects */}
        <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-8">
            Current &amp; Upcoming Projects
          </h2>
          <ProjectGrid projects={projects} />
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
