import { createClient } from '@supabase/supabase-js';
import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';
import ProjectGrid from '@/components/ProjectGrid';
import type { WorkOrder } from '@/lib/types';

async function getAllProjects(): Promise<WorkOrder[]> {
  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  );

  const { data, error } = await supabase
    .from('work_orders')
    .select('*')
    .order('created_at', { ascending: false });

  if (error) {
    console.error('[projects] fetch error', error);
    return [];
  }

  return (data ?? []) as WorkOrder[];
}

export default async function ProjectsPage() {
  const projects = await getAllProjects();

  return (
    <div className="flex flex-col min-h-screen">
      <Navbar />

      <main className="flex-1 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16 w-full">
        <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-8">All Projects</h1>
        <ProjectGrid projects={projects} />
      </main>

      <Footer />
    </div>
  );
}
