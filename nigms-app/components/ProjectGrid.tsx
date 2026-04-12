import type { WorkOrder } from "@/lib/types";
import StatusBadge from "./StatusBadge";

interface ProjectGridProps {
  projects: WorkOrder[];
}

export default function ProjectGrid({ projects }: ProjectGridProps) {
  if (projects.length === 0) {
    return (
      <div className="text-center py-16">
        <p className="text-gray-500 dark:text-gray-400 text-lg">
          No current projects to display.
        </p>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
      {projects.map((project) => (
        <div
          key={project.id}
          className="rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 p-6 shadow-sm"
        >
          <div className="flex items-start justify-between gap-3 mb-3">
            <h3 className="text-base font-semibold text-gray-900 dark:text-white">
              {project.title}
            </h3>
            <StatusBadge status={project.status} />
          </div>
          {project.description && (
            <p className="text-sm text-gray-500 dark:text-gray-400 line-clamp-3">
              {project.description}
            </p>
          )}
        </div>
      ))}
    </div>
  );
}
