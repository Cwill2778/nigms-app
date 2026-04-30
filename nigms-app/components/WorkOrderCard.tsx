import Link from "next/link";
import type { WorkOrder } from "@/lib/types";
import StatusBadge from "./StatusBadge";

interface WorkOrderCardProps {
  workOrder: WorkOrder;
  onPayBalance?: (workOrderId: string) => void;
}

export default function WorkOrderCard({ workOrder, onPayBalance }: WorkOrderCardProps) {
  const hasOutstandingBalance =
    workOrder.quoted_amount !== null && workOrder.quoted_amount > 0;

  return (
    <div className="rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 p-4 shadow-sm">
      <div className="flex items-start justify-between gap-3">
        <div className="flex-1 min-w-0">
          <Link
            href={`/work-orders/${workOrder.id}`}
            className="text-sm font-semibold text-gray-900 dark:text-white hover:text-blue-600 dark:hover:text-blue-400 truncate block transition-colors"
          >
            {workOrder.title}
          </Link>
          {workOrder.description && (
            <p className="mt-1 text-sm text-gray-500 dark:text-gray-400 line-clamp-2">
              {workOrder.description}
            </p>
          )}
        </div>
        <StatusBadge status={workOrder.status} />
      </div>

      <div className="mt-3 flex items-center justify-between">
        <span className="text-sm text-gray-600 dark:text-gray-300">
          {workOrder.quoted_amount !== null
            ? `$${workOrder.quoted_amount.toFixed(2)}`
            : "No quote yet"}
        </span>

        {onPayBalance && hasOutstandingBalance && (
          <button
            onClick={() => onPayBalance(workOrder.id)}
            className="text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 dark:bg-blue-500 dark:hover:bg-blue-600 px-3 py-1.5 rounded-md transition-colors"
          >
            Pay Balance
          </button>
        )}
      </div>
    </div>
  );
}
